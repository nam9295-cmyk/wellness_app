const SEOUL_TIME_ZONE = 'Asia/Seoul';

function getDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: lookup.year ?? '0000',
    month: lookup.month ?? '01',
    day: lookup.day ?? '01',
    hour: lookup.hour ?? '00',
    minute: lookup.minute ?? '00',
  };
}

export function getTodayDateString(date = new Date()): string {
  const { year, month, day } = getDateParts(date);
  return `${year}-${month}-${day}`;
}

export function getCurrentTimestampString(date = new Date()): string {
  const { year, month, day, hour, minute } = getDateParts(date);
  return `${year}-${month}-${day} ${hour}:${minute}`;
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
