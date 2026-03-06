export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDisplayDate(date: string): string {
  return date.replace(/-/g, '.');
}

export function isDateWithinLastDays(date: string, days: number): boolean {
  const targetDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - targetDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= days;
}
