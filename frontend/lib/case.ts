/**
 * Recursively converts snake_case object keys to camelCase.
 * The backend returns PostgreSQL snake_case columns; frontend
 * models use camelCase.
 */
export function camelCaseKeys(value: any): any {
  if (Array.isArray(value)) return value.map(camelCaseKeys);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        camelCaseKeys(nested),
      ])
    );
  }
  return value;
}
