import { describe, it, expect } from 'vitest';
import { rgbaToHex, clamp, generateId, sanitizeFilename, truncate } from './utils';

describe('rgbaToHex', () => {
  it('converts black (0,0,0)', () => {
    expect(rgbaToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('converts white (1,1,1)', () => {
    expect(rgbaToHex({ r: 1, g: 1, b: 1 })).toBe('#FFFFFF');
  });

  it('converts mid-gray (0.5,0.5,0.5)', () => {
    expect(rgbaToHex({ r: 0.5, g: 0.5, b: 0.5 })).toBe('#808080');
  });

  it('converts pure red', () => {
    expect(rgbaToHex({ r: 1, g: 0, b: 0 })).toBe('#FF0000');
  });

  it('converts pure green', () => {
    expect(rgbaToHex({ r: 0, g: 1, b: 0 })).toBe('#00FF00');
  });

  it('converts pure blue', () => {
    expect(rgbaToHex({ r: 0, g: 0, b: 1 })).toBe('#0000FF');
  });

  it('handles fractional values', () => {
    // r=0.2 -> 51, g=0.4 -> 102, b=0.6 -> 153
    expect(rgbaToHex({ r: 0.2, g: 0.4, b: 0.6 })).toBe('#336699');
  });
});

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('generateId', () => {
  it('matches expected format fig_<timestamp>_<8chars>', () => {
    const id = generateId();
    expect(id).toMatch(/^fig_\d+_[a-z0-9]{8}$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('sanitizeFilename', () => {
  it('strips special characters', () => {
    expect(sanitizeFilename('hello world!@#$')).toBe('hello_world____');
  });

  it('keeps alphanumeric, underscore, and hyphen', () => {
    expect(sanitizeFilename('my-file_name123')).toBe('my-file_name123');
  });

  it('limits length to 60 characters', () => {
    const long = 'a'.repeat(100);
    expect(sanitizeFilename(long).length).toBe(60);
  });
});

describe('truncate', () => {
  it('returns short string unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long string with ellipsis', () => {
    expect(truncate('hello world this is long', 10)).toBe('hello worl...');
  });

  it('returns exact-length string unchanged', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });
});
