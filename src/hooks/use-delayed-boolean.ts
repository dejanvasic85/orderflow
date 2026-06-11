import { useEffect, useRef, useState } from "react";

export function useDelayedBoolean(value: boolean, delay = 100, minDuration = 300): boolean {
  const [delayed, setDelayed] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (value) {
      const id = setTimeout(() => {
        setDelayed(true);
        shownAt.current = Date.now();
      }, delay);
      return () => clearTimeout(id);
    }

    if (!delayed) return;

    const elapsed = shownAt.current ? Date.now() - shownAt.current : minDuration;
    const remaining = minDuration - elapsed;

    if (remaining <= 0) {
      setDelayed(false);
      shownAt.current = null;
      return;
    }

    const id = setTimeout(() => {
      setDelayed(false);
      shownAt.current = null;
    }, remaining);
    return () => clearTimeout(id);
  }, [value, delay, minDuration, delayed]);

  return delayed;
}
