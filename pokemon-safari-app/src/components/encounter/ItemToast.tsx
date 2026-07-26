type ItemToastProps = {
  onDismiss: () => void
}

export function ItemToast({ onDismiss }: ItemToastProps) {
  return (
    <aside
      className="w-full max-w-[320px] border-l-4 border-accent bg-dominant px-3 py-3"
      role="status"
    >
      <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
        Found an item!
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="touch-target mt-1 font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-text underline touch-manipulation"
      >
        Dismiss
      </button>
    </aside>
  )
}
