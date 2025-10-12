export function formatTimestamp(timestampMs: number) {
  const dt = new Date(timestampMs);
  const year = dt.getFullYear();
  const month = `${dt.getMonth() + 1}`.padStart(2, "0");
  const day = `${dt.getDate()}`.padStart(2, "0");
  const hours = dt.getHours();
  const hour = `${hours % 12 || 12}`.padStart(2, "0");
  const minute = `${dt.getMinutes()}`.padStart(2, "0");
  const amOrPm = hours >= 12 ? "pm" : "am";

  return `${year}-${month}-${day} ${hour}:${minute} ${amOrPm}`;
}
