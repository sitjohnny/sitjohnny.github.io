import { Component, type ErrorInfo, type ReactNode } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PixelButton } from '@/components/PixelButton'

type Props = { children: ReactNode }
type State = { hasError: boolean }

function goToGame() {
  window.location.hash = '#/pokemon-safari/game'
  window.location.reload()
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally no kid-facing stack; optional console for parents/devs.
    if (import.meta.env.DEV) {
      console.error(_error, _info)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-6 bg-dominant px-4 py-8 text-text">
        <EmptyState
          heading="Something went wrong"
          body="Tap Reload to try again, or Go to Game to keep exploring."
        />
        <div className="flex w-full max-w-[320px] flex-col gap-3">
          <PixelButton variant="primary" onClick={() => window.location.reload()}>
            Reload
          </PixelButton>
          <PixelButton variant="secondary" onClick={goToGame}>
            Go to Game
          </PixelButton>
        </div>
      </div>
    )
  }
}
