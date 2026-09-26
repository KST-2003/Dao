import { formatCount, formatDuration, formatMoney } from './format';

describe('format', () => {
  it('formats minor units as baht', () => {
    expect(formatMoney(59000)).toBe('฿590');
    expect(formatMoney(116000)).toBe('฿1,160');
    expect(formatMoney(1250)).toBe('฿12.50');
  });
  it('formats counts and durations', () => {
    expect(formatCount(2400)).toBe('2.4K');
    expect(formatCount(182)).toBe('182');
    expect(formatDuration(482)).toBe('8:02');
  });
});
