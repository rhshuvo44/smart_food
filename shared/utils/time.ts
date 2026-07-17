import { format, isWithinInterval, parse } from 'date-fns';

export function formatDate(date: Date, formatStr = 'yyyy-MM-dd'): string {
  return format(date, formatStr);
}

export function formatDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

export function isInBusinessHours(date: Date, openTime: string, closeTime: string): boolean {
  const todayOpen = parse(openTime, 'HH:mm', date);
  const todayClose = parse(closeTime, 'HH:mm', date);
  return isWithinInterval(date, { start: todayOpen, end: todayClose });
}

export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function isExpired(date: Date): boolean {
  return new Date() > date;
}
