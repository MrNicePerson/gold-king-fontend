// components/HomePage/fx/HomeCursor.jsx
import { useEffect, useState } from 'react';

/**
 * Renders a lightweight custom gold-ring cursor on pointer (desktop) devices only.
 * It disables itself on touch devices and when the user prefers reduced motion.
 */
const HomeCursor = ({ color = '212, 175, 55' }) => {
  const [enabled, setEnabled] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isFinePointer || reduceMotion) {
      setEnabled(false);
      return undefined;
    }

    setEnabled(true);

    const handleMove = (event) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    const handleDown = () => setClicked(true);
    const handleUp = () => setClicked(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed pointer-events-none z-[9999] rounded-full border transition-transform duration-150"
        style={{
          left: position.x,
          top: position.y,
          width: 32,
          height: 32,
          transform: `translate(-50%, -50%) scale(${clicked ? 0.8 : 1})`,
          borderColor: `rgba(${color}, 0.8)`,
          borderWidth: '1.5px',
          boxShadow: `0 0 0 1px rgba(${color}, 0.12)`,
          mixBlendMode: 'exclusion',
        }}
      />
      <div
        aria-hidden="true"
        className="fixed pointer-events-none z-[9999] rounded-full"
        style={{
          left: position.x,
          top: position.y,
          width: 8,
          height: 8,
          transform: 'translate(-50%, -50%)',
          backgroundColor: `rgba(${color}, 1)`,
        }}
      />
    </>
  );
};

export default HomeCursor;
