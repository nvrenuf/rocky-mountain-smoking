const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatReadingMinutes(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes));
  return `${rounded} min read`;
}
