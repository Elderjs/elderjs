import shuffleArray from '../shuffleArray';

const mockMath = Object.create(global.Math);

describe('#shuffleArray', () => {
  it('works when Math.random returns 0', () => {
    mockMath.random = () => 0;
    global.Math = mockMath;
    expect(shuffleArray([1, 2, 3, 4, 5])).toEqual([2, 3, 4, 5, 1]);
  });
  it('works when Math.random returns 0.25', () => {
    mockMath.random = () => 0.25;
    global.Math = mockMath;
    expect(shuffleArray([1, 2, 3])).toEqual([2, 3, 1]);
  });
  it('works when Math.random returns 0.5', () => {
    mockMath.random = () => 0.5;
    global.Math = mockMath;
    expect(shuffleArray([1, 2, 3, 4, 5])).toEqual([1, 4, 2, 5, 3]);
    expect(shuffleArray([])).toEqual([]);
  });
  it('works when Math.random returns 0.9999999', () => {
    mockMath.random = () => 0.9999999;
    global.Math = mockMath;
    expect(shuffleArray([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });
});
