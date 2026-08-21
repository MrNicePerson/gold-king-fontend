// components/HomePage/ShopsSection.jsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ShopCard from './ShopCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useGoldUnit } from '../../hooks/useGoldUnit';
import { calculateTolaPrice } from '../../utils/goldUnitUtils';
import { formatNumberByLanguage } from '../../utils/formatUtils';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { key: 'default',        label: 'Default Order',                icon: '📌' },
  { key: 'gold_sell_asc',  label: '24K Sell Price (Low → High)',  icon: '💰' },
  { key: 'gold_sell_desc', label: '24K Sell Price (High → Low)',  icon: '💎' },
  { key: 'gold_buy_asc',   label: '24K Buy Price (Low → High)',   icon: '🛒' },
  { key: 'gold_buy_desc',  label: '24K Buy Price (High → Low)',   icon: '📈' },
  { key: 'name_asc',       label: 'Shop Name (A → Z)',            icon: '📝' },
  { key: 'name_desc',      label: 'Shop Name (Z → A)',            icon: '📝' },
];

const getSortValue = (shop, key, selectedUnit) => {
  switch (key) {
    case 'gold_sell_asc':
    case 'gold_sell_desc': return calculateTolaPrice(shop.prices?.sell_24k, selectedUnit) || 0;
    case 'gold_buy_asc':
    case 'gold_buy_desc':  return calculateTolaPrice(shop.prices?.buy_24k, selectedUnit) || 0;
    case 'name_asc':
    case 'name_desc':      return shop.shopName?.toLowerCase() || '';
    default: return 0;
  }
};

const ShopsSection = ({ shops = [], currencies }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { selectedUnit } = useGoldUnit();
  const [search, setSearch]             = useState('');
  const [cityFilter, setCityFilter]     = useState('all');
  const [sortKey, setSortKey]           = useState('default');
  const [isSortOpen, setIsSortOpen]     = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const isDark = theme.type === 'dark';

  const SORT_OPTIONS = [
    { key: 'default',        label: t('common.default', { defaultValue: 'Default Order' }),                icon: '📌' },
    { key: 'gold_sell_asc',  label: t('prices.sortSellAsc', { defaultValue: '24K Sell Price (Low → High)' }),  icon: '💰' },
    { key: 'gold_sell_desc', label: t('prices.sortSellDesc', { defaultValue: '24K Sell Price (High → Low)' }),  icon: '💎' },
    { key: 'gold_buy_asc',   label: t('prices.sortBuyAsc', { defaultValue: '24K Buy Price (Low → High)' }),   icon: '🛒' },
    { key: 'gold_buy_desc',  label: t('prices.sortBuyDesc', { defaultValue: '24K Buy Price (High → Low)' }),   icon: '📈' },
    { key: 'name_asc',       label: t('shop.sortNameAsc', { defaultValue: 'Shop Name (A → Z)' }),            icon: '📝' },
    { key: 'name_desc',      label: t('shop.sortNameDesc', { defaultValue: 'Shop Name (Z → A)' }),            icon: '📝' },
  ];

  const cities = useMemo(() => {
    const set = new Set(shops.map((s) => s.city).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [shops]);

  const filtered = useMemo(() => {
    setVisibleCount(PAGE_SIZE);

    let list = shops.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        s.shopName?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q);
      const matchCity = cityFilter === 'all' || s.city === cityFilter;
      return matchSearch && matchCity;
    });

    if (sortKey !== 'default') {
      list = [...list].sort((a, b) => {
        const aV = getSortValue(a, sortKey, selectedUnit);
        const bV = getSortValue(b, sortKey, selectedUnit);
        if (sortKey.includes('name')) {
          const cmp = aV.localeCompare(bV);
          return sortKey === 'name_asc' ? cmp : -cmp;
        }
        return sortKey.includes('asc') ? aV - bV : bV - aV;
      });
    }
    return list;
  }, [shops, search, cityFilter, sortKey, selectedUnit]);

  const visibleShops = filtered.slice(0, visibleCount);
  const hasMore      = visibleCount < filtered.length;
  const remaining    = Math.min(PAGE_SIZE, filtered.length - visibleCount);

  const activeSort = SORT_OPTIONS.find((o) => o.key === sortKey);
  const hasFilters = search || cityFilter !== 'all' || sortKey !== 'default';

  const p           = theme.primary;
  const bg          = theme.bg;
  const cardBg      = theme.cardBg;
  const border      = theme.border;
  const textPrimary = theme.textPrimary;
  const textMuted   = theme.textMuted;

  return (
    <>
      <style>{`
        @keyframes cardIn  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
        .ss-card-in  { animation: cardIn  0.38s cubic-bezier(0.22,1,0.36,1) both }
        .ss-fade-in  { animation: fadeIn  0.2s ease-out }
        .ss-input::placeholder { color: ${textMuted}; opacity: 0.6 }
        .ss-pill-city:hover  { background: ${p}20 !important; border-color: ${p}60 !important; }
        .ss-sort-row:hover   { background: ${p}12 !important; }
        .ss-sort-row.active  { background: ${p}22 !important; border-left: 2px solid ${p} !important; }
        .ss-view-btn:hover   { border-color: ${p}55 !important; color: ${p} !important; background: ${p}0d !important; }
        .ss-clear-btn:hover  { background: rgba(224,90,78,0.2) !important; }
        .ss-load-more:hover  { background: ${p}1e !important; border-color: ${p}70 !important; }
      `}</style>

      <section
        className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
        style={{ background: bg }}
      >
        <div className="max-w-7xl mx-auto">

          {/* ── Section Header ── */}
          <div className="flex items-center gap-4 mb-10 sm:mb-14">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${p}50)` }} />
            <div className="text-center flex-shrink-0">
              <p className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-1" style={{ color: p }}>
                {t('prices.live')}
              </p>
              <h2
                className="text-3xl sm:text-4xl font-black tracking-tight leading-none"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', color: textPrimary }}
              >
                {t('shop.shops')}
              </h2>
            </div>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${p}50)` }} />
          </div>

          {/* ── Search + City Filters ── */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('hero.searchShopPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ss-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: isDark ? `${p}08` : `${p}0a`,
                  border: `1px solid ${border}`,
                  color: textPrimary,
                }}
                onFocus={(e) => { e.target.style.borderColor = `${p}80`; e.target.style.background = `${p}10`; }}
                onBlur={(e)  => { e.target.style.borderColor = border;    e.target.style.background = isDark ? `${p}08` : `${p}0a`; }}
              />
            </div>

            {/* City pills */}
            <div className="flex gap-2 flex-wrap">
              {cities.map((city) => {
                const active = cityFilter === city;
                return (
                  <button
                    key={city}
                    onClick={() => setCityFilter(city)}
                    className="ss-pill-city px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap capitalize transition-all duration-200"
                    style={{
                      background: active ? `${p}22` : `${p}08`,
                      border: `1px solid ${active ? `${p}90` : border}`,
                      color: active ? p : textMuted,
                      boxShadow: active ? `0 0 16px ${p}18` : 'none',
                    }}
                  >
                    {city === 'all' ? `🏠 ${t('common.all')}` : `📍 ${city}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Sort bar ── */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 sm:p-4 rounded-xl"
            style={{ background: isDark ? 'rgba(255,255,255,0.02)' : `${p}06`, border: `1px solid ${border}` }}
          >
            {/* Sort dropdown */}
            <div className="relative z-20">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={{
                  background: `${p}12`,
                  border: `1px solid ${p}40`,
                  color: p,
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span className="hidden xs:inline">{t('common.filter')}: </span>
                <span style={{ color: textPrimary }} className="max-w-[120px] truncate">{activeSort?.label || t('common.default', { defaultValue: 'Default' })}</span>
                <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div
                    className="ss-fade-in absolute top-full left-0 mt-2 w-64 sm:w-72 rounded-xl shadow-2xl z-20 overflow-hidden"
                    style={{ background: cardBg, border: `1px solid ${border}` }}
                  >
                    {SORT_OPTIONS.map((opt) => {
                      const isActive = sortKey === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => { setSortKey(opt.key); setIsSortOpen(false); }}
                          className="ss-sort-row w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150 text-left"
                          style={{
                            color: isActive ? p : textMuted,
                            background: isActive ? `${p}18` : 'transparent',
                            borderLeft: isActive ? `2px solid ${p}` : '2px solid transparent',
                          }}
                        >
                          <span className="text-base">{opt.icon}</span>
                          <span className="flex-1">{opt.label}</span>
                          {isActive && (
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Results count + clear */}
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="px-3 py-1.5 rounded-full text-[13px]"
                style={{ background: `${p}0d`, border: `1px solid ${border}`, color: textMuted }}
              >
                <span className="font-bold text-sm" style={{ color: p }}>{formatNumberByLanguage(filtered.length, i18n.language)}</span>
                {' '}{t('shop.shops')}
                {cityFilter !== 'all' && <span className="opacity-60"> · {cityFilter}</span>}
              </div>

              {hasFilters && (
                <button
                  onClick={() => { setSearch(''); setCityFilter('all'); setSortKey('default'); }}
                  className="ss-clear-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200"
                  style={{
                    background: 'rgba(224,90,78,0.1)',
                    color: '#e05a4e',
                    border: '1px solid rgba(224,90,78,0.25)',
                  }}
                >
                  <span>✕</span>
                  <span>{t('common.clear', { defaultValue: 'Clear' })}</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Active sort indicator ── */}
          {sortKey !== 'default' && (
            <div
              className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
              style={{ background: `${p}0d`, border: `1px solid ${border}` }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: p }} />
              <span className="text-xs" style={{ color: textMuted }}>
                {t('common.sortedBy', { defaultValue: 'Sorted by' })} <strong style={{ color: p }}>{activeSort?.label}</strong>
              </span>
              <button
                onClick={() => setSortKey('default')}
                className="ml-1 text-[11px] underline transition-colors"
                style={{ color: textMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.color = p; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = textMuted; }}
              >
                {t('common.reset')}
              </button>
            </div>
          )}

          {/* ── Grid ── */}
          {filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                {visibleShops.map((shop, i) => (
                  <div
                    key={shop.id || shop._id || i}
                    className="ss-card-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <ShopCard shop={shop} currencies={currencies} index={i} />
                  </div>
                ))}
              </div>

              {/* ── Load More ── */}
              {hasMore ? (
                <div className="flex flex-col items-center gap-2 mt-10">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="ss-load-more flex items-center gap-2.5 px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      background: `${p}10`,
                      border: `1px solid ${p}40`,
                      color: p,
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    {t('common.loadMore', { defaultValue: 'Load More' })}
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: `${p}18`, color: p }}
                    >
                      +{remaining}
                    </span>
                  </button>
                  <p className="text-xs" style={{ color: textMuted }}>
                    {t('common.showing')} {formatNumberByLanguage(visibleShops.length, i18n.language)} {t('common.of', { defaultValue: 'of' })} {formatNumberByLanguage(filtered.length, i18n.language)} {t('shop.shops')}
                  </p>
                </div>
              ) : (
                filtered.length > PAGE_SIZE && (
                  <p className="text-center text-xs mt-8" style={{ color: textMuted }}>
                    {t('common.showing')} {formatNumberByLanguage(filtered.length, i18n.language)} {t('shop.shops')}
                  </p>
                )
              )}
            </>
          ) : (
            <div
              className="text-center py-16 sm:py-20 px-6 rounded-2xl"
              style={{ border: `1px solid ${border}`, background: `${p}04` }}
            >
              <p className="text-6xl sm:text-7xl mb-4 opacity-40">🔍</p>
              <p className="text-base sm:text-lg font-medium mb-2" style={{ color: textMuted }}>
                {t('shop.noShopsFound')}
              </p>
              <p className="text-sm mb-6 opacity-60" style={{ color: textMuted }}>
                {t('common.noData')}
              </p>
              <button
                onClick={() => { setSearch(''); setCityFilter('all'); setSortKey('default'); }}
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
                style={{
                  background: `${p}12`,
                  border: `1px solid ${p}40`,
                  color: p,
                }}
              >
                {t('common.reset')}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ShopsSection;