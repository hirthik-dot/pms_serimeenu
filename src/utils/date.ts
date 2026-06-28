const DEFAULT_LOCALE = 'en-IN';

export function formatDate(date: Date | string, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: Date | string, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function toISODateString(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0] ?? '';
}

export function calculateAge(dateOfBirth: Date | string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

export function isFutureDate(date: Date | string): boolean {
  return new Date(date).getTime() > Date.now();
}

export function isPastDate(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now();
}
