import {
  binarySearch,
  lowerBound,
  sortedArrayFind,
  compareNameAscending,
} from '../index';

describe('compareNameAscending', () => {
  it('compares strings case-insensitively', () => {
    expect(compareNameAscending('alice', 'Bob')).toBeLessThan(0);
    expect(compareNameAscending('Bob', 'alice')).toBeGreaterThan(0);
    expect(compareNameAscending('Alice', 'alice')).toBe(0);
  });

  it('compares contacts by their name field', () => {
    const a = { name: 'alice' } as any;
    const b = { name: 'bob' } as any;
    expect(compareNameAscending(a, b)).toBeLessThan(0);
    expect(compareNameAscending(b, a)).toBeGreaterThan(0);
  });
});

describe('binarySearch / lowerBound / sortedArrayFind', () => {
  const sorted = ['alice', 'bob', 'carol', 'dave'];

  it('finds an existing item', () => {
    expect(sortedArrayFind(sorted, 'carol', compareNameAscending)).toBe(
      'carol'
    );
    expect(sortedArrayFind(sorted, 'alice', compareNameAscending)).toBe(
      'alice'
    );
  });

  it('returns undefined for a missing item', () => {
    expect(
      sortedArrayFind(sorted, 'zoe', compareNameAscending)
    ).toBeUndefined();
  });

  it('lowerBound returns the insertion index for a missing item', () => {
    expect(lowerBound(sorted, 'bea', compareNameAscending)).toBe(1);
  });

  it('binarySearch returns a negative encoded index when absent', () => {
    expect(binarySearch(sorted, 'zoe', compareNameAscending)).toBeLessThan(0);
    expect(binarySearch(sorted, 'bob', compareNameAscending)).toBe(1);
  });
});
