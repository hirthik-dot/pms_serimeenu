/** Strip HTML tags and null bytes from string inputs. */
export function sanitizeString(value: string): string {
  return value
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/** Recursively sanitize string fields in an object or array and prevent NoSQL injection. */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const result = { ...obj } as Record<string, unknown>;

  for (const [key, value] of Object.entries(result)) {
    // Strip keys that start with '$' to prevent NoSQL operator injection
    if (key.startsWith('$')) {
      delete result[key];
      continue;
    }

    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObject(value);
    }
  }

  return result as T;
}
