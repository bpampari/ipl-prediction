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

export function formatJoinedAt(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}
