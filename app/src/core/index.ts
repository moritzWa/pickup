export * from "./failureOrSuccess";
export * from "./errors";

export type Maybe<T> = T | null;

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export const hasValue = <TValue>(
  value: TValue | null | undefined
): value is TValue => {
  if (value === null || value === undefined) return false;
  const _testDummy: TValue = value;
  return true;
};
