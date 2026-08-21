// components/HomePage/HomePageSkeleton.jsx
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../config/themes';

const Shimmer = ({ className, theme }) => (
  <div
    className={`rounded animate-pulse ${className}`}
    style={{
      background: `linear-gradient(90deg, ${theme.shimmerFrom} 25%, ${theme.shimmerVia} 50%, ${theme.shimmerTo} 75%)`,
      backgroundSize: '200% 100%'
    }}
  />
);

const Spinner = ({ theme }) => (
  <div className="relative flex items-center justify-center w-24 h-24 mb-8" aria-hidden="true">
    <div
      className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
      style={{ borderTopColor: theme.primary, borderRightColor: `${theme.primary}55` }}
    />
    <div
      className="absolute inset-3 rounded-full border border-current opacity-20"
      style={{ color: theme.primary }}
    />
  </div>
);

const HomePageSkeleton = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen" style={{ background: theme.bg }}>
      {/* Hero skeleton */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-20 max-w-7xl mx-auto">
        <Spinner theme={theme} />
        <p
          className="mt-2 mb-10 text-xs tracking-[0.3em] uppercase font-semibold"
          style={{ color: theme.primary }}
        >
          {t('common.loading')}
        </p>
        <div className="w-full">
          <Shimmer theme={theme} className="h-4 w-48 mb-12 rounded-full mx-auto" />
          <Shimmer theme={theme} className="h-20 w-3/4 mb-4 rounded-xl mx-auto" />
          <Shimmer theme={theme} className="h-6 w-1/2 mb-12 rounded-lg mx-auto" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Shimmer key={i} theme={theme} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Rates skeleton */}
      <div className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: theme.cardBg, border: `1px solid ${theme.border}` }}>
              <div className="p-6 space-y-4">
                <Shimmer theme={theme} className="h-6 w-32 rounded-lg" />
                <Shimmer theme={theme} className="h-12 w-full rounded-lg" />
                <Shimmer theme={theme} className="h-4 w-24 rounded-lg" />
                <div className="space-y-2">
                  <Shimmer theme={theme} className="h-3 w-full rounded" />
                  <Shimmer theme={theme} className="h-3 w-3/4 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePageSkeleton;