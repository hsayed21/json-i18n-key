import { JsonI18nKeySettings } from "../models/JsonI18nKeySettings";

export function convertCase(key: string): string {
  const normalizedInput = key
    .trim()
    .replace(/[\s_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  const words = normalizedInput.split(' ');

  switch (JsonI18nKeySettings.instance.keyFormat) {
    case 'camelCase':
      return words
        .map((word, index) =>
          index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');

    case 'PascalCase':
      return words
        .map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');

    case 'snake_case':
      return words
        .map(word => word.toLowerCase())
        .join('_');

    case 'kebab-case':
      return words
        .map(word => word.toLowerCase())
        .join('-');

    default:
      return key;
  }
}
