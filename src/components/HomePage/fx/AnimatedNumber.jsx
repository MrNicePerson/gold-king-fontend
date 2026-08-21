// components/HomePage/fx/AnimatedNumber.jsx
import { useEffect, useRef, useState } from 'react';

/**
 * Animates numeric values counting up whenever they change (e.g. live price
 * ticks). Accepts an already-formatted prefix/suffix so callers keep full
 * control over currency formatting (PKR, $, etc.).
 */
const AnimatedNumber = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.1,
  separator = ',',
  className = '',
  fallback = '—',
}) => {
  const numeric = Number(value);
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);

  useEffect(() => {
    if (value == null || Number.isNaN(numeric)) {
      return;
    }

    const startValue = previousValueRef.current;
    const endValue = numeric;
    previousValueRef.current = endValue;

    let frameId;
    const startTime = performance.now();
    const totalDuration = Math.max(duration, 0.1) * 1000;

    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / totalDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * eased;

      setDisplayValue(currentValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, numeric, value]);

  if (value == null || Number.isNaN(numeric)) {
    return <span className={className}>{fallback}</span>;
  }

  const formatValue = (num) => {
    const safeValue = Number(num);
    if (!Number.isFinite(safeValue)) {
      return fallback;
    }

    const formatted = safeValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    });

    return separator === ',' ? formatted : formatted.replace(/,/g, separator);
  };

  return (
    <span className={className}>
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </span>
  );
};

export default AnimatedNumber;
