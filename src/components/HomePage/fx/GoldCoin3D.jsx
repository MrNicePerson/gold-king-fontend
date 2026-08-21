// components/HomePage/fx/GoldCoin3D.jsx
const GoldCoin3D = ({ primaryColor = '#d4af37', className = '' }) => (
  <div className={className} aria-hidden="true">
    <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
      <defs>
        <linearGradient id="coinGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="35%" stopColor={primaryColor} />
          <stop offset="100%" stopColor="#8b6417" />
        </linearGradient>
        <linearGradient id="coinEdge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffeaa8" />
          <stop offset="50%" stopColor="#c89a2f" />
          <stop offset="100%" stopColor="#8b6417" />
        </linearGradient>
      </defs>

      <circle cx="110" cy="110" r="95" fill="url(#coinGold)" />
      <circle cx="110" cy="110" r="84" fill="none" stroke="url(#coinEdge)" strokeWidth="8" />
      <circle cx="110" cy="110" r="78" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="2" />
      <ellipse cx="110" cy="96" rx="44" ry="18" fill="rgba(255,255,255,0.22)" />
      <circle cx="110" cy="110" r="58" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />

      <g transform="translate(110 110)">
        <path d="M-24,-6 C-14,-22 14,-22 24,-6 C34,8 28,26 14,34 C8,38 0,40 -8,38 C-24,34 -32,18 -24,-6Z" fill="#fff6d0" opacity="0.85" />
        <path d="M-22,-4 C-14,-16 14,-16 22,-4 C28,6 22,18 12,24 C6,27 0,28 -8,26 C-20,22 -28,10 -22,-4Z" fill="none" stroke="#8b6417" strokeWidth="3" opacity="0.55" />
      </g>

      <path d="M82 110C82 86 94 66 110 66C126 66 138 86 138 110C138 134 126 154 110 154C94 154 82 134 82 110Z" fill="rgba(255,255,255,0.12)" />
    </svg>
  </div>
);

export default GoldCoin3D;
