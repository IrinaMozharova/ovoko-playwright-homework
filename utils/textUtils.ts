export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeProductName(productName: string): string {
  return normalizeText(productName)
    .replace(/^NEW LISTING\s*/i, '')
    .replace(/\s+Opens in a new window or tab\s*$/i, '')
    .replace(/\s*-\s*$/i, '')
    .trim();
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function textToFlexibleRegExp(value: string, flags = 'i'): RegExp {
  const normalizedValue = normalizeText(value);
  const pattern = normalizedValue
    .split(' ')
    .map(escapeRegExp)
    .join('\\s+');

  return new RegExp(pattern, flags);
}
