export function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export function omitUndefined<T extends Record<string, unknown>>(data: T): T {
  return stripUndefined(data) as T;
}
