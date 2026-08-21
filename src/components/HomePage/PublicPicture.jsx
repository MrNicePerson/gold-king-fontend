// components/HomePage/PublicPicture.jsx

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import publicApi from "../../services/publicApi";
import { useLivePrices } from "../../hooks/useLivePrices";
import { formatNumberByLanguage } from "../../utils/formatUtils";

const WHATSAPP_NUMBER = "923001234567";
const PHONE_NUMBER = "+923001234567";

const GRAMS_PER_TOLA = 11.6638;
const MASHA_PER_TOLA = 12;

const toTola = (weight, unit) => {
    const w = Number(weight) || 0;
    switch ((unit || '').toLowerCase()) {
        case 'tola':
            return w;
        case 'masha':
            return w / MASHA_PER_TOLA;
        case 'gram':
        case 'g':
        default:
            return w / GRAMS_PER_TOLA;
    }
};

const getLiveRatePerTola = (item, marketPrices) => {
    if (!marketPrices) return null;

    if (item?.type === 'silver' || item?.category === 'silver') {
        return marketPrices.silver?.per_tola_PKR ?? null;
    }

    const purity = String(item?.purity ?? item?.karat ?? '');
    if (purity.includes('23.85') || purity.includes('2385')) {
        return marketPrices.gold?.per_tola_PKR_2385k ?? null;
    }

    return marketPrices.gold?.per_tola_PKR_24k ?? null;
};

const computeLiveItemPrice = (item, marketPrices) => {
    const ratePerTola = getLiveRatePerTola(item, marketPrices);
    if (ratePerTola == null) return null;

    const tolas = toTola(item?.weight, item?.weightUnit);
    if (!tolas) return null;

    return Math.round(ratePerTola * tolas);
};

const formatUploadedDate = (dateString) => {
    if (!dateString) return null;
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

// Gold / Silver read as material facts, not brand colors — a small,
// deliberate exception to the theme-only rule so the badge tells the truth.
const getMetalBadgeStyle = (type = "") => {
    const normalized = type.toLowerCase();

    if (normalized.includes("gold")) {
        return {
            background: "linear-gradient(135deg, #F4E4A6 0%, #D4AF37 45%, #9C7A1E 100%)",
            color: "#3A2B00",
        };
    }

    if (normalized.includes("silver")) {
        return {
            background: "linear-gradient(135deg, #F5F5F5 0%, #C9C9C9 45%, #8E8E8E 100%)",
            color: "#2A2A2A",
        };
    }

    return null;
};

const DiamondIcon = ({ className = "", style }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        style={style}
        aria-hidden="true"
    >
        <path
            d="M4 8L8 3H16L20 8L12 21L4 8Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
        />
        <path
            d="M4 8H20M8 3L9.5 8L12 21M16 3L14.5 8L12 21M4 8L9.5 8M20 8L14.5 8"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
            opacity="0.6"
        />
    </svg>
);

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.68 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.42 19.65L5.25 16.6L5.05 16.29C4.22 15 3.79 13.47 3.79 11.91C3.79 7.37 7.5 3.66 12.05 3.66C14.25 3.66 16.32 4.52 17.87 6.08C19.42 7.63 20.29 9.7 20.29 11.91C20.28 16.45 16.57 20.15 12.04 20.15ZM16.56 13.99C16.32 13.87 15.13 13.28 14.91 13.2C14.69 13.12 14.53 13.08 14.37 13.32C14.21 13.56 13.75 14.1 13.61 14.26C13.47 14.42 13.33 14.44 13.09 14.32C12.85 14.2 12.06 13.94 11.13 13.11C10.4 12.46 9.91 11.66 9.77 11.42C9.63 11.18 9.75 11.05 9.87 10.93C9.98 10.82 10.11 10.64 10.23 10.5C10.35 10.36 10.39 10.26 10.47 10.1C10.55 9.94 10.51 9.8 10.45 9.68C10.39 9.56 9.91 8.37 9.71 7.89C9.51 7.42 9.31 7.49 9.16 7.48C9.02 7.47 8.86 7.47 8.7 7.47C8.54 7.47 8.28 7.53 8.06 7.77C7.84 8.01 7.22 8.59 7.22 9.78C7.22 10.97 8.08 12.12 8.2 12.28C8.32 12.44 9.9 14.89 12.32 15.94C12.9 16.19 13.35 16.34 13.7 16.45C14.28 16.64 14.81 16.61 15.23 16.55C15.7 16.48 16.68 15.96 16.88 15.39C17.08 14.82 17.08 14.34 17.02 14.24C16.96 14.14 16.8 14.08 16.56 13.99Z" />
    </svg>
);

const PhoneIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
        <path
            d="M3.5 5C3.5 4 4.3 3.5 5 3.5H7.5C8 3.5 8.4 3.8 8.5 4.3L9.3 7.5C9.4 7.9 9.2 8.4 8.9 8.6L7.2 9.8C8.1 12 9.9 13.9 12.2 14.8L13.4 13.1C13.7 12.7 14.2 12.6 14.5 12.7L17.7 13.5C18.2 13.6 18.5 14 18.5 14.5V17C18.5 17.7 18 18.5 17 18.5C9.5 18.5 3.5 12.5 3.5 5Z"
            strokeLinejoin="round"
        />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
        <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
    </svg>
);

const ProductCard = ({ item, theme, onOpen, marketPrices }) => {
    const { t, i18n } = useTranslation();
    const metalBadge = getMetalBadgeStyle(item.type);
    const livePrice = computeLiveItemPrice(item, marketPrices);
    const displayPrice = livePrice ?? item.price;

    return (
        <div
            className="group rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5 cursor-pointer focus-within:-translate-y-1.5"
            style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                boxShadow:
                    theme.type === "dark"
                        ? "0 0 0 1px rgba(255,255,255,0.02)"
                        : "0 8px 24px rgba(0,0,0,.07)",
            }}
        >
            {/* Image */}
            <button
                type="button"
                onClick={() => onOpen(item)}
                aria-label={`View details for ${item.title}`}
                className="relative w-full overflow-hidden focus:outline-none"
                style={{ aspectRatio: "4 / 5" }}
            >
                <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6"
                    style={{
                        background:
                            "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 55%)",
                    }}
                >
                    <span className="text-white text-xs font-semibold tracking-[0.2em] uppercase border border-white/70 rounded-full px-5 py-2 backdrop-blur-sm">
                        {t('common.viewDetails')}
                    </span>
                </div>

                {item.type && (
                    <span
                        className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold capitalize tracking-wide shadow-md"
                        style={
                            metalBadge || {
                                background: `${theme.primary}E6`,
                                color: "#fff",
                            }
                        }
                    >
                        <DiamondIcon className="w-3 h-3" />
                        {item.type}
                    </span>
                )}
            </button>

            {/* Content */}
            <div className="p-5 sm:p-6">
                <h3
                    className="text-lg sm:text-xl font-bold mb-1.5 leading-snug"
                    style={{
                        color: theme.textPrimary,
                        fontFamily: '"Playfair Display", Georgia, serif',
                    }}
                >
                    {item.title}
                </h3>

                <div
                    className="w-10 h-px mb-3"
                    style={{ background: theme.primary }}
                />

                <p
                    className="text-sm leading-6 line-clamp-2 mb-5 min-h-[2.5rem]"
                    style={{ color: theme.textMuted }}
                >
                    {item.description}
                </p>

                <div className="flex items-end justify-between mb-5">
                    <div className="space-y-1">
                        {item.weight && (
                            <p className="text-xs" style={{ color: theme.textMuted }}>
                                {item.weight} {item.weightUnit || t('common.g')}
                            </p>
                        )}
                    </div>

                    {displayPrice != null && (
                        <p
                            className="text-lg sm:text-xl font-bold"
                            style={{ color: theme.primary }}
                        >
                            PKR {formatNumberByLanguage(displayPrice, i18n.language)}
                        </p>
                    )}
                </div>

                <button
                    onClick={() => onOpen(item)}
                    className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                        background: theme.gradient || theme.primary,
                        color: "#fff",
                        outlineColor: theme.primary,
                    }}
                >
                    {t('common.details')}
                </button>
            </div>
        </div>
    );
};

const PublicPicture = () => {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const { prices } = useLivePrices("public");

    const [pictures, setPictures] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalMounted, setIsModalMounted] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);

    useEffect(() => {
        fetchPictures();
    }, []);

    const fetchPictures = async () => {
        try {
            const res = await publicApi.get("/pictures");
            setPictures(res.data.data || []);
        } catch (err) {
            console.error("Failed to load pictures:", err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = useCallback((item) => {
        setSelectedItem(item);
        setIsModalClosing(false);
        setIsModalMounted(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalClosing(true);
        window.setTimeout(() => {
            setIsModalMounted(false);
            setIsModalClosing(false);
            setSelectedItem(null);
        }, 220);
    }, []);

    useEffect(() => {
        if (!isModalMounted) return undefined;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") closeModal();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalMounted, closeModal]);

    useEffect(() => {
        if (!isModalMounted) return undefined;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isModalMounted]);

    const formattedDate = useMemo(
        () => formatUploadedDate(selectedItem?.createdAt),
        [selectedItem]
    );

    const getWhatsAppNumber = (item) => {
        const rawNumber =
            item?.whatsappNumber ||
            item?.shop?.whatsappNumber ||
            item?.shop?.phoneNumber ||
            item?.whatsappLink ||
            item?.shop?.whatsappLink ||
            "";

        let whatsappNumber = String(rawNumber).replace(/\D/g, "");

        if (String(rawNumber).includes("wa.me/")) {
            whatsappNumber = String(rawNumber)
                .split("wa.me/")[1]
                .split("?")[0]
                .replace(/\D/g, "");
        }

        return whatsappNumber;
    };

    const buildWhatsAppMessage = (item, marketPrices) => {
        const shopName =
            item?.shopName ||
            item?.shop?.shopName ||
            "Shop";

        const productName =
            item?.title ||
            "Product";

        const code =
            item?.code ||
            item?.productCode ||
            (item?.itemIndex != null ? `${item.itemIndex}` : "N/A");

        const purity =
            item?.purity ||
            "N/A";

        const weight = item?.weight
            ? `${item.weight} ${item.weightUnit || "gram"}`
            : "N/A";

        const category =
            item?.category ||
            item?.type ||
            "N/A";

        const computedLivePrice = computeLiveItemPrice(item, marketPrices);
        const finalPrice = computedLivePrice != null ? computedLivePrice : item?.price;

        const priceStr =
            finalPrice != null && finalPrice !== undefined
                ? `PKR ${formatNumberByLanguage(finalPrice, i18n.language)}`
                : "Not Available";

        return [
            `👋 Hello ${shopName},`,
            "",
            "I am interested in the following product:",
            "",
            `✨ *${productName}*`,
            "",
            `🏷️ Code: ${code}`,
            `💎 Purity: ${purity}`,
            `⚖️ Weight: ${weight}`,
            `📂 Category: ${category}`,
            `💰 Price: ${priceStr}`,
            "",
            "📋 Please Share availability and further details.",
            "🙏 Thank You!",
        ].join("\n");
    };

    const whatsappHref = useMemo(() => {
        if (!selectedItem?.title) {
            return "#";
        }

        const whatsappNumber = getWhatsAppNumber(selectedItem);
        if (!whatsappNumber) {
            return "#";
        }

        const message = buildWhatsAppMessage(selectedItem, prices);

        return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            message
        )}`;
    }, [selectedItem, prices]);

    const modalMetalBadge = selectedItem ? getMetalBadgeStyle(selectedItem.type) : null;

    return (
        <section
            className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
            style={{ background: theme.bg }}
        >
            <div className="max-w-7xl mx-auto">

                {/* ================= Header ================= */}

                <div className="flex items-center gap-4 mb-12">
                    <div
                        className="flex-1 h-px"
                        style={{
                            background: `linear-gradient(to right, transparent, ${theme.primary}50)`,
                        }}
                    />

                    <div className="text-center">
                        <p
                            className="uppercase tracking-[0.25em] text-xs font-semibold mb-2"
                            style={{ color: theme.primary }}
                        >
                            {t('hero.title')}
                        </p>

                        <h2
                            className="text-3xl sm:text-4xl font-black"
                            style={{
                                color: theme.textPrimary,
                                fontFamily: '"Playfair Display", Georgia, serif',
                            }}
                        >
                            {t('shop.viewProducts')}
                        </h2>
                    </div>

                    <div
                        className="flex-1 h-px"
                        style={{
                            background: `linear-gradient(to left, transparent, ${theme.primary}50)`,
                        }}
                    />
                </div>

                {/* ================= Loading ================= */}

                {loading ? (
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        role="status"
                        aria-label="Loading products"
                    >
                        {[...Array(8)].map((_, index) => (
                            <div
                                key={index}
                                className="rounded-2xl overflow-hidden animate-pulse"
                                style={{
                                    background: theme.cardBg,
                                    border: `1px solid ${theme.border}`,
                                }}
                            >
                                <div
                                    style={{ background: theme.shimmerVia, aspectRatio: "4 / 5" }}
                                />

                                <div className="p-5 sm:p-6 space-y-3">
                                    <div
                                        className="h-5 w-3/4 rounded"
                                        style={{ background: theme.shimmerVia }}
                                    />

                                    <div
                                        className="h-3 w-10 rounded"
                                        style={{ background: theme.shimmerVia }}
                                    />

                                    <div
                                        className="h-4 rounded"
                                        style={{ background: theme.shimmerVia }}
                                    />

                                    <div
                                        className="h-4 w-1/2 rounded"
                                        style={{ background: theme.shimmerVia }}
                                    />

                                    <div
                                        className="h-11 rounded-xl mt-4"
                                        style={{ background: theme.shimmerVia }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : pictures.length === 0 ? (

                    /* ================= Empty State ================= */

                    <div
                        className="text-center py-24 px-6 rounded-2xl"
                        style={{
                            background: theme.cardBg,
                            border: `1px solid ${theme.border}`,
                        }}
                    >
                        <DiamondIcon
                            className="w-12 h-12 mx-auto mb-5"
                            style={{ color: theme.primary }}
                        />

                        <h3
                            className="text-2xl font-bold mb-3"
                            style={{
                                color: theme.textPrimary,
                                fontFamily: '"Playfair Display", Georgia, serif',
                            }}
                        >
                            {t('common.noData')}
                        </h3>

                        <p
                            className="max-w-md mx-auto"
                            style={{ color: theme.textMuted }}
                        >
                            {t('common.noData')}
                        </p>
                    </div>
                ) : (

                    /* ================= Product Grid ================= */

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                        {pictures.map((item, index) => (
                            <ProductCard
                                key={item._id}
                                item={{ ...item, itemIndex: index + 1 }}
                                theme={theme}
                                onOpen={openModal}
                                marketPrices={prices}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ================= Product Modal ================= */}

            {isModalMounted && selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="product-modal-title"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-300 ${isModalClosing ? "opacity-0" : "opacity-100"
                            }`}
                        style={{
                            background: "rgba(10, 8, 4, 0.72)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                        }}
                    />

                    {/* Panel */}
                    <div
                        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl transition-all duration-300 ${isModalClosing
                                ? "opacity-0 scale-95"
                                : "opacity-100 scale-100"
                            }`}
                        style={{
                            background: theme.cardBg,
                            border: `1px solid ${theme.border}`,
                            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={closeModal}
                            aria-label="Close product details"
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2"
                            style={{
                                background: theme.type === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                                color: theme.textPrimary,
                                outlineColor: theme.primary,
                            }}
                        >
                            <CloseIcon />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2">

                            {/* Image */}
                            <div className="overflow-hidden md:rounded-l-3xl" style={{ aspectRatio: "4 / 5" }}>
                                <img
                                    src={selectedItem.imageUrl}
                                    alt={selectedItem.title}
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                />
                            </div>

                            {/* Details */}
                            <div className="p-6 sm:p-8 flex flex-col">
                                {selectedItem.type && (
                                    <span
                                        className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold capitalize tracking-wide mb-4"
                                        style={
                                            modalMetalBadge || {
                                                background: `${theme.primary}20`,
                                                color: theme.primary,
                                            }
                                        }
                                    >
                                        <DiamondIcon className="w-3 h-3" />
                                        {selectedItem.type}
                                    </span>
                                )}

                                <h2
                                    id="product-modal-title"
                                    className="text-2xl sm:text-3xl font-black mb-2 leading-tight"
                                    style={{
                                        color: theme.textPrimary,
                                        fontFamily: '"Playfair Display", Georgia, serif',
                                    }}
                                >
                                    {selectedItem.title}
                                </h2>

                                <div
                                    className="w-14 h-px mb-5"
                                    style={{ background: theme.primary }}
                                />

                                <p
                                    className="text-sm leading-7 mb-6"
                                    style={{ color: theme.textMuted }}
                                >
                                    {selectedItem.description}
                                </p>

                                <dl className="grid grid-cols-2 gap-4 mb-6">
                                    {selectedItem.weight && (
                                        <div>
                                            <dt
                                                className="text-[11px] uppercase tracking-widest mb-1"
                                                style={{ color: theme.textMuted }}
                                            >
                                                Weight
                                            </dt>
                                            <dd
                                                className="text-sm font-semibold"
                                                style={{ color: theme.textPrimary }}
                                            >
                                                {selectedItem.weight} {selectedItem.weightUnit}
                                            </dd>
                                        </div>
                                    )}

                                    {formattedDate && (
                                        <div>
                                            <dt
                                                className="text-[11px] uppercase tracking-widest mb-1"
                                                style={{ color: theme.textMuted }}
                                            >
                                                Uploaded
                                            </dt>
                                            <dd
                                                className="text-sm font-semibold"
                                                style={{ color: theme.textPrimary }}
                                            >
                                                {formattedDate}
                                            </dd>
                                        </div>
                                    )}
                                </dl>

                                {(() => {
                                    const livePrice = computeLiveItemPrice(selectedItem, prices);
                                    const displayPrice = livePrice ?? selectedItem.price;

                                    return displayPrice != null ? (
                                    <p
                                        className="text-3xl font-bold mb-6"
                                        style={{ color: theme.primary }}
                                    >
                                        PKR {formatNumberByLanguage(displayPrice, i18n.language)}
                                    </p>
                                    ) : null;
                                })()}

                                <div className="mt-auto space-y-3">
                                    <a
                                        href={whatsappHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus-visible:ring-2"
                                        style={{
                                            background: theme.gradient || theme.primary,
                                            color: "#fff",
                                            outlineColor: theme.primary,
                                        }}
                                    >
                                        <WhatsAppIcon />
                                        Contact on WhatsApp
                                    </a>

                                    <a
                                        href={`tel:${PHONE_NUMBER}`}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus-visible:ring-2"
                                        style={{
                                            background: `${theme.primary}18`,
                                            color: theme.primary,
                                            outlineColor: theme.primary,
                                        }}
                                    >
                                        <PhoneIcon />
                                        Call Now
                                    </a>

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide border transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus-visible:ring-2"
                                        style={{
                                            borderColor: theme.border,
                                            color: theme.textPrimary,
                                            background: "transparent",
                                            outlineColor: theme.primary,
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default PublicPicture;