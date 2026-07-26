import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { PixelButton } from '@/components/PixelButton'
import { PokemonSprite } from '@/components/PokemonSprite'
import { captureCopy } from '@/data/educationConfig'
import { encounterTimingMs } from '@/data/rates'
import { timingBar } from '@/data/timingBar'
import { pingPong } from '@/game/timing'
import { capture } from '@/hooks/useEncounterFlow'
import { prefersReducedMotion } from '@/hooks/useMapCamera'
import type { RarityBand } from '@/types/encounter'
import type { PokemonDto } from '@/types/pokemon'

const TIMING_GROUP_LABEL =
  'Timing bar. Press Capture when the marker is in the bright zone.'

type TimingBarProps = {
  pokemon: PokemonDto
  captureBonus: number
  attemptsUsed: number
  sweetSpot: number
  rarity: RarityBand
  shiny?: boolean
  /** Mash lock during grade flash / shake (D-21). */
  locked?: boolean
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function bandStyle(sweetSpot: number, halfWidth: number): CSSProperties {
  const left = clamp01(sweetSpot - halfWidth)
  const right = clamp01(sweetSpot + halfWidth)
  return {
    left: `${left * 100}%`,
    width: `${Math.max(0, right - left) * 100}%`,
  }
}

/**
 * Continuous ping-pong timing mini-game (CATCH-02 / D-01, D-08–D-14, D-17–D-21).
 * Position lives in a ref + imperative indicator write — never per-frame React state.
 */
export function TimingBar({
  pokemon,
  captureBonus,
  attemptsUsed,
  sweetSpot,
  rarity,
  shiny = false,
  locked = false,
}: TimingBarProps) {
  const posRef = useRef(0)
  const frozenRef = useRef(false)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const indicatorRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef(0)
  const holdTimerRef = useRef(0)
  const [frozen, setFrozen] = useState(false)

  const zones = timingBar.zones[rarity]
  const bonusPercent = Math.round(captureBonus * 100)
  const hasBoost = captureBonus > 0
  const throwLabel = captureCopy.throwOf.replace('{n}', String(attemptsUsed + 1))
  const boostLabel = captureCopy.mathBoost.replace('{n}', String(bonusPercent))
  const canCapture = !locked && !frozen

  function writeIndicator(pos: number): void {
    const track = trackRef.current
    const indicator = indicatorRef.current
    if (!track || !indicator) return
    const x = pos * track.clientWidth - indicator.offsetWidth / 2
    indicator.style.transform = `translate3d(${x}px, 0, 0)`
  }

  useEffect(() => {
    if (locked) return

    frozenRef.current = false
    setFrozen(false)
    const periodMs = prefersReducedMotion()
      ? timingBar.periodMs * timingBar.reducedMotionScale
      : timingBar.periodMs

    let start = 0
    const tick = (now: number) => {
      if (frozenRef.current) return
      if (start === 0) start = now
      const pos = pingPong(now - start, periodMs)
      posRef.current = pos
      writeIndicator(pos)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.clearTimeout(holdTimerRef.current)
    }
  }, [locked])

  function handleCapture(): void {
    if (locked || frozenRef.current) return
    frozenRef.current = true
    setFrozen(true)
    cancelAnimationFrame(rafRef.current)
    writeIndicator(posRef.current)
    const hold = prefersReducedMotion()
      ? encounterTimingMs.reducedTimingFreezeHold
      : encounterTimingMs.timingFreezeHold
    holdTimerRef.current = window.setTimeout(() => {
      capture(posRef.current)
    }, hold)
  }

  return (
    <div
      role="group"
      aria-label={TIMING_GROUP_LABEL}
      className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center"
    >
      <PokemonSprite pokemon={pokemon} size={96} shiny={shiny} alt={pokemon.name} />
      <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text">
        {pokemon.name}
      </h2>
      <p className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted">
        {throwLabel}
      </p>
      <p className="boost-chip" data-active={hasBoost ? 'true' : 'false'}>
        {boostLabel}
      </p>
      <div
        ref={trackRef}
        className="timing-track w-full"
        aria-hidden="true"
        data-testid="timing-track"
      >
        <div className="timing-band-miss absolute inset-0" data-timing-band="miss" />
        <div
          className="timing-band-good absolute inset-y-0"
          data-timing-band="good"
          style={bandStyle(sweetSpot, zones.good)}
        />
        <div
          className="timing-band-great absolute inset-y-0"
          data-timing-band="great"
          style={bandStyle(sweetSpot, zones.great)}
        />
        <div
          className="timing-band-perfect absolute inset-y-0"
          data-timing-band="perfect"
          style={bandStyle(sweetSpot, zones.perfect)}
        />
        <div ref={indicatorRef} className="timing-indicator" />
      </div>
      <PixelButton
        variant="primary"
        className="w-full min-h-14"
        disabled={!canCapture}
        onClick={handleCapture}
      >
        {captureCopy.captureCta}
      </PixelButton>
    </div>
  )
}
