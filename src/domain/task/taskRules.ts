export const validateTaskTitle = (title: string): void => {
  if (title.trim().length === 0) {
    throw new Error('Task title is required')
  }
}

export const validateEstimatedMinutes = (minutes: number): void => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error('Estimated minutes must be a positive finite number')
  }
}
