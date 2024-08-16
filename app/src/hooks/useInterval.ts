import React, { useEffect, useRef } from "react";

export function useInterval(callback: () => void, delay: number) {
  const intervalRef = React.useRef<number>();
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    const tick = () => savedCallback.current();
    if (typeof delay === "number") {
      intervalRef.current = window.setInterval(tick, delay);
      return () => window.clearInterval(intervalRef.current);
    }
  }, [delay]);

  // call it right away as well
  useEffect(() => {
    const tick = () => savedCallback.current();
    tick();
  }, []);

  return intervalRef;
}

export const useIntervalWithDependencies = (
  callback: () => void,
  delay: number,
  dependencies: any[]
) => {
  const savedCallback = React.useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      if (savedCallback.current) savedCallback.current();
    };

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay, ...dependencies]);
};
