// components/HomePage/fx/SplitReveal.jsx
import { useEffect, useRef } from 'react';
import SplitType from 'split-type';
import gsap from 'gsap';

/**
 * Splits its text content into characters and animates them in with GSAP.
 * Falls back to a plain fade if SplitType/GSAP can't run (e.g. reduced motion).
 */
const SplitReveal = ({ as: Tag = 'h1', children, className = '', style = {}, delay = 0 }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      gsap.set(el, { opacity: 1 });
      return undefined;
    }

    const split = new SplitType(el, { types: 'chars', tagName: 'span' });
    gsap.set(el, { opacity: 1 });
    const tween = gsap.fromTo(
      split.chars,
      { yPercent: 120, opacity: 0, rotateZ: 6 },
      {
        yPercent: 0,
        opacity: 1,
        rotateZ: 0,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.028,
        delay,
      }
    );

    return () => {
      tween.kill();
      split.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, delay]);

  return (
    <Tag ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </Tag>
  );
};

export default SplitReveal;
