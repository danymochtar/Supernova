import { describe, expect, it } from 'vitest';
import { RULER, ZODIAC_SIGNS } from '../signs';
import { rulerMeaning } from '../content';

describe('classical RULER map', () => {
  it('assigns each sign a ruler-planet from the seven personal/social planets', () => {
    const personalOrSocial: Array<string> = [
      'sun',
      'moon',
      'mercury',
      'venus',
      'mars',
      'jupiter',
      'saturn',
    ];
    for (const sign of ZODIAC_SIGNS) {
      expect(personalOrSocial).toContain(RULER[sign]);
    }
  });

  it('pins the well-known classical rulerships', () => {
    // Fixed points — if any of these change, someone re-picked the ruler
    // scheme and we should re-audit the copy.
    expect(RULER.aries).toBe('mars');
    expect(RULER.taurus).toBe('venus');
    expect(RULER.gemini).toBe('mercury');
    expect(RULER.cancer).toBe('moon');
    expect(RULER.leo).toBe('sun');
    expect(RULER.virgo).toBe('mercury');
    expect(RULER.libra).toBe('venus');
    expect(RULER.scorpio).toBe('mars');
    expect(RULER.sagittarius).toBe('jupiter');
    expect(RULER.capricorn).toBe('saturn');
    expect(RULER.aquarius).toBe('saturn');
    expect(RULER.pisces).toBe('jupiter');
  });

  it('has a ruler content entry for every planet in the map', () => {
    for (const sign of ZODIAC_SIGNS) {
      const planet = RULER[sign];
      const meaning = rulerMeaning(planet, 'id');
      expect(meaning.name).toBeTruthy();
      expect(meaning.theme).toBeTruthy();
    }
  });
});
