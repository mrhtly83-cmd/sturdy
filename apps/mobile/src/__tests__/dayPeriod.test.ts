import { getDayPeriod, getTimeGreeting } from '../utils/dayPeriod';

const at = (hour: number) => new Date(2026, 5, 2, hour, 0, 0);

describe('getDayPeriod', () => {
  it('is active during the day (06:00–18:59)', () => {
    expect(getDayPeriod(at(6))).toBe('active');
    expect(getDayPeriod(at(14))).toBe('active');
    expect(getDayPeriod(at(18))).toBe('active');
  });

  it('is calm in the evening/night (19:00–05:59)', () => {
    expect(getDayPeriod(at(19))).toBe('calm');
    expect(getDayPeriod(at(23))).toBe('calm');
    expect(getDayPeriod(at(0))).toBe('calm');
    expect(getDayPeriod(at(5))).toBe('calm');
  });
});

describe('greeting / layout contract', () => {
  // The "Good afternoon" greeting must never coincide with the calm layout.
  it('never shows "Good afternoon" while the layout is calm', () => {
    for (let h = 0; h < 24; h++) {
      const greeting = getTimeGreeting(at(h));
      const period = getDayPeriod(at(h));
      if (greeting === 'Good afternoon') {
        expect(period).toBe('active');
      }
    }
  });
});
