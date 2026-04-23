export function formatDuration(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0:00'
  }

  const totalSeconds = Math.floor(value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMonths =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())

  if (diffInMonths <= 0) {
    return 'this year'
  }

  if (diffInMonths === 1) {
    return '1 month ago'
  }

  if (diffInMonths < 12) {
    return `${diffInMonths} months ago`
  }

  const years = Math.floor(diffInMonths / 12)
  return years === 1 ? '1 year ago' : `${years} years ago`
}
