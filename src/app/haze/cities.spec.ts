import { CITIES, CITY_BY_ID, COUNTRIES, DEFAULT_CITY_ID, placeLabel } from './cities';

describe('cities', () => {
  it('has unique, URL-safe ids', () => {
    const ids = CITIES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it('places every city inside Southeast Asia', () => {
    for (const c of CITIES) {
      expect(c.lat).withContext(c.name).toBeGreaterThan(-11);
      expect(c.lat).withContext(c.name).toBeLessThan(24);
      expect(c.lon).withContext(c.name).toBeGreaterThan(92);
      expect(c.lon).withContext(c.name).toBeLessThan(128);
    }
  });

  it('only uses known countries', () => {
    const codes = new Set(COUNTRIES.map(c => c.code));
    for (const c of CITIES) expect(codes.has(c.country)).withContext(c.name).toBeTrue();
  });

  it('has a valid default city', () => {
    expect(CITY_BY_ID.has(DEFAULT_CITY_ID)).toBeTrue();
  });

  it('describes where a city is', () => {
    expect(placeLabel(CITY_BY_ID.get('pekanbaru')!)).toBe('Riau, Indonesia');
    expect(placeLabel(CITY_BY_ID.get('bangkok')!)).toBe('Thailand');
    expect(placeLabel(CITY_BY_ID.get('singapore')!)).toBe('City-state');
  });
});
