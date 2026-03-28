export function formatPoints(points) {
  const numeric = Number(points || 0);
  const sign = numeric > 0 ? "+" : "";
  const digits = numeric % 1 === 0 ? 0 : 2;
  return `${sign}${numeric.toFixed(digits)} pts`;
}

export function formatDateLabel(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTimeLabel(dateValue, timeValue) {
  const dateLabel = formatDateLabel(dateValue);
  const timeLabel = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(`1970-01-01T${timeValue}`));

  return `${dateLabel} at ${timeLabel}`;
}

export function formatJoinedAt(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}
