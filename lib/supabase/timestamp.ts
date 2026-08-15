export function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as { toDate?: () => Date; seconds?: number };
    if (typeof record.toDate === 'function') return record.toDate();
    if (typeof record.seconds === 'number') {
      return new Date(record.seconds * 1000);
    }
  }
  return new Date();
}

export function toIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}
