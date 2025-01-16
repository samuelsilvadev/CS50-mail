export function formatDate(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  return formatter.format(new Date(date));
}
