const sum = (...a: number[]) => a.reduce((acc, val) => acc + val, 0);
const d = 3;
const bar = (a: string, b: number) => {
  const d = b + 3;
  return a + 'ef';
};

// This is an error, obviously -- we introduce it to make sure Jest does not show a type error
sum('a');
bar('fefe', 5);

export { sum };
