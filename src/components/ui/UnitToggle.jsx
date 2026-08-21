import { useTheme } from '../../contexts/ThemeContext';
import { useGoldUnit } from '../../hooks/useGoldUnit';
import { TOLA_11664, TOLA_12150 } from '../../utils/goldUnitUtils';

const UNIT_OPTIONS = [
  { value: TOLA_11664, label: '11.664 g' },
  { value: TOLA_12150, label: '12.150 g' },
];

// selectedUnit/onChange are optional overrides so a card can control its
// own local unit instead of the shared global one. Falls back to the
// global GoldUnitContext when not provided (unchanged old behavior).
const UnitToggle = ({ selectedUnit: selectedUnitProp, onChange } = {}) => {
  const globalGoldUnit = useGoldUnit();
  const { theme } = useTheme();
  const isDark = theme.type === 'dark';
  const primary = theme.primary;
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db';
  const background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(243,244,246,0.9)';

  const selectedUnit = selectedUnitProp ?? globalGoldUnit.selectedUnit;
  const setSelectedUnit = onChange ?? globalGoldUnit.setSelectedUnit;

  return (
    <div
      className="inline-flex rounded-full p-1"
      style={{
        background,
        border: `1px solid ${borderColor}`,
        boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.12)' : '0 0 0 1px rgba(148,163,184,0.15)',
      }}
    >
      {UNIT_OPTIONS.map((option) => {
        const active = selectedUnit === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelectedUnit(option.value)}
            className="transition-all duration-200 text-sm font-semibold rounded-full px-3 py-2 min-w-[84px]"
            style={{
              background: active ? primary : 'transparent',
              color: active ? '#ffffff' : isDark ? '#d1d5db' : '#374151',
              boxShadow: active ? `0 0 0 1px ${primary}40` : 'none',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default UnitToggle;