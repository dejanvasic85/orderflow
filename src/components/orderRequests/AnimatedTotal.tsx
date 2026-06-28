import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

type AnimatedTotalProps = {
  value: number;
  className?: string;
  "aria-label"?: string;
};

type RollDigitProps = {
  char: string;
  direction: 1 | -1;
};

function RollDigit({ char, direction }: RollDigitProps) {
  return (
    <span className="relative inline-block h-[1.25em] w-[0.62em] overflow-hidden text-center tabular-nums">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={char}
          className="absolute inset-0"
          initial={{ y: `${direction * -100}%`, opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: `${direction * 100}%`, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function AnimatedTotal({ value, className, "aria-label": ariaLabel }: AnimatedTotalProps) {
  const prev = useRef(value);
  const direction: 1 | -1 = value >= prev.current ? 1 : -1;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    prev.current = value;
  }, [value]);

  if (reduceMotion) {
    return (
      <span className={className} aria-label={ariaLabel}>
        {value}
      </span>
    );
  }

  const chars = String(value).split("");

  return (
    <span className={className} aria-label={ariaLabel} aria-live="polite">
      {chars.map((char, index) => (
        <RollDigit
          // Index keying is intentional: a digit position rolls in place as the value changes.
          key={`${chars.length}-${index}`}
          char={char}
          direction={direction}
        />
      ))}
    </span>
  );
}
