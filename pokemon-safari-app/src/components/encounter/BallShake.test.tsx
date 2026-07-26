import { cleanup, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encounterTimingMs } from "@/data/rates";
import { BallShake } from "@/components/encounter/BallShake";

vi.mock("@/hooks/useMapCamera", () => ({
  prefersReducedMotion: vi.fn(() => false),
}));

import { prefersReducedMotion } from "@/hooks/useMapCamera";

const prefersReducedMotionMock = vi.mocked(prefersReducedMotion);

function ballRoot() {
  return document.querySelector("[data-ending]") as HTMLElement;
}

function phase() {
  return ballRoot().getAttribute("data-phase");
}

function spriteSrc() {
  const img = ballRoot().querySelector("img") as HTMLImageElement;
  return img?.getAttribute("src") ?? "";
}

beforeEach(() => {
  prefersReducedMotionMock.mockReturnValue(false);
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("BallShake sprites + phases", () => {
  it("stays on closed sprite while shaking and reports shake count from chance", () => {
    const onComplete = vi.fn();
    render(<BallShake caught chance={0.8} onComplete={onComplete} />);

    expect(ballRoot().getAttribute("data-shakes")).toBe("3");
    expect(phase()).toBe("shaking");
    expect(spriteSrc()).toMatch(/ball-closed/);
    expect(screen.getByText("Caught")).toBeInTheDocument();
  });

  it("on catch: after shakes enters resolve-caught with sparkles, never opens, then completes", () => {
    const onComplete = vi.fn();
    render(<BallShake caught chance={0.5} onComplete={onComplete} />);
    // 2 shakes: once + gap + once
    const shakeTotal =
      2 * encounterTimingMs.shakeOnce + encounterTimingMs.shakeGap;

    act(() => {
      vi.advanceTimersByTime(shakeTotal);
    });
    expect(phase()).toBe("resolve-caught");
    expect(spriteSrc()).toMatch(/ball-closed/);
    expect(ballRoot().querySelectorAll("[data-sparkle]")).toHaveLength(4);
    expect(spriteSrc()).not.toMatch(/open/);

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeResolve);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("on escape: mid-open then full-open hold, then completes", () => {
    const onComplete = vi.fn();
    render(<BallShake caught={false} chance={0.2} onComplete={onComplete} />);
    const shakeTotal = encounterTimingMs.shakeOnce; // 1 shake

    act(() => {
      vi.advanceTimersByTime(shakeTotal);
    });
    expect(phase()).toBe("resolve-mid-open");
    expect(spriteSrc()).toMatch(/ball-mid-open/);

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeOpen);
    });
    expect(phase()).toBe("resolve-full-open");
    expect(spriteSrc()).toMatch(/ball-full-open/);

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeEscapeHold);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("reduced motion: skip mid-open on escape; complete after reducedShakeResolve", () => {
    prefersReducedMotionMock.mockReturnValue(true);
    const onComplete = vi.fn();
    render(<BallShake caught={false} chance={0.2} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.reducedShakeOnce);
    });
    expect(phase()).toBe("resolve-full-open");
    expect(spriteSrc()).toMatch(/ball-full-open/);

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.reducedShakeResolve);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("reduced motion: on catch, resolve-caught with static sparkles, never opens, then completes", () => {
    prefersReducedMotionMock.mockReturnValue(true);
    const onComplete = vi.fn();
    render(<BallShake caught chance={0.5} onComplete={onComplete} />);
    const shakeTotal = 2 * encounterTimingMs.reducedShakeOnce;

    act(() => {
      vi.advanceTimersByTime(shakeTotal);
    });
    expect(phase()).toBe("resolve-caught");
    expect(spriteSrc()).toMatch(/ball-closed/);
    expect(spriteSrc()).not.toMatch(/open/);
    const sparkles = ballRoot().querySelectorAll("[data-sparkle]");
    expect(sparkles).toHaveLength(4);
    for (const el of sparkles) {
      expect(el).toHaveClass("ball-sparkle--static");
    }

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.reducedShakeResolve);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(spriteSrc()).not.toMatch(/open/);
  });

  it("clears scheduled timers on unmount so onComplete is not called", () => {
    const onComplete = vi.fn();
    const { unmount } = render(
      <BallShake caught chance={0.2} onComplete={onComplete} />,
    );
    unmount();
    act(() => {
      vi.runAllTimers();
    });
    expect(onComplete).not.toHaveBeenCalled();
  });
});
