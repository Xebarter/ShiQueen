import { randomUUID } from 'crypto';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  }
  return randomUUID().replace(/-/g, '').slice(0, 20);
}
