export const sum = (...a: number[]) => a.reduce((acc, val) => acc + val, 0);

// This is an error, obviously -- we introduce it to make sure Jest does not show a type error
sum('a');
