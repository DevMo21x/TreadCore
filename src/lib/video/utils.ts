export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/ - /g, ' – ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
