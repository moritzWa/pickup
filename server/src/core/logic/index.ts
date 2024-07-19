export * from "./FailureOrSuccess";
export * from "./SwitchGuard";
export * from "./Exception";
export * from "./errors";
export * from "./codec";

export type Maybe<T> = T | null;

export const hasValue = <TValue>(
    value: TValue | null | undefined
): value is TValue => {
    if (value === null || value === undefined) return false;
    const _testDummy: TValue = value;
    return true;
};
