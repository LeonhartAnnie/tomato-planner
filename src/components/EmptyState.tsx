interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
  compact?: boolean
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`empty-state${compact ? ' is-compact' : ''}`}>
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" disabled={actionDisabled} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
