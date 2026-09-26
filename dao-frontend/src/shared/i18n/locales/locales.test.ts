import { en } from './en';
import { my } from './my';
import { th } from './th';

type Tree = { [k: string]: string | Tree };
const keys = (o: Tree, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [`${p}${k}`] : keys(v, `${p}${k}.`)));

describe('translations', () => {
  it('Thai and Myanmar cover every English key with non-empty text', () => {
    const base = keys(en as unknown as Tree).sort();
    for (const locale of [th, my] as unknown as Tree[]) {
      expect(keys(locale).sort()).toEqual(base);
    }
  });

  it('keeps interpolation placeholders consistent', () => {
    const flat = (o: Tree, p = ''): [string, string][] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [[`${p}${k}`, v] as [string, string]] : flat(v, `${p}${k}.`)));
    const vars = (s: string) => (s.match(/{{\s*\w+\s*}}/g) ?? []).sort().join(',');
    const enMap = new Map(flat(en as unknown as Tree));
    for (const locale of [th, my] as unknown as Tree[]) {
      for (const [key, value] of flat(locale)) {
        expect([key, vars(value)]).toEqual([key, vars(enMap.get(key) ?? '')]);
      }
    }
  });
});
