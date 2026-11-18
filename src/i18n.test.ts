import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { translations } from './translations';
function keys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, item]) =>
    typeof item === 'string' ? [`${prefix}${key}`] : keys(item, `${prefix}${key}.`),
  );
}
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(directory, entry.name))
      : /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')
        ? [path.join(directory, entry.name)]
        : [],
  );
}
it('keeps both locales complete and resolves literal UI keys', () => {
  const en = keys(translations.en.translation);
  const ru = keys(translations.ru.translation);
  const withoutPlurals = (list: string[]) =>
    list.filter((key) => !/_(one|few|many|other|zero|two)$/.test(key)).sort();
  expect(withoutPlurals(ru)).toEqual(withoutPlurals(en));
  for (const file of files(path.resolve('src'))) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\bt\(['"]([a-zA-Z]+\.[\w.]+)['"]/g))
      expect(en, `${file}: ${match[1]}`).toContain(match[1]);
  }
});
