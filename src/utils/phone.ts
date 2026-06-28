export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) return phone;
  return `${normalized.slice(0, 5)} ${normalized.slice(5)}`;
}

export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length <= 4) return normalized;
  return `${'*'.repeat(normalized.length - 4)}${normalized.slice(-4)}`;
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizePhone(phone));
}

export function toE164IndianPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  return `+91${normalized}`;
}
