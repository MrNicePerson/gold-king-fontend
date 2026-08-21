// components/HomePage/Footer.jsx
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

const Footer = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const p = theme.primary;

  const highlights = [
    t('hero.liveMarket'),
    t('shop.shops'),
    t('hero.trustedExchange')
  ];

  return (
    <footer
      className="w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
      style={{
        background: theme.bg,
        borderTop: `1px solid ${p}18`,
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-4">

        {/* Brand - uses theme.brandText like Navbar */}
        <div className="text-center sm:text-left flex-shrink-0">
          <p
            className="text-xl font-black tracking-tight mb-0.5"
            style={{
              fontFamily: '"Playfair Display", serif',
              color: theme.brandText,
            }}
          >
            GOLDKING JEWELLERY
          </p><span className='text-sm sm:text-lg pl-2 text-gray-400'>SOFTWARE</span>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Developer <span
              style={{
                fontFamily: '"Playfair Display", serif',
                color: theme.brandText,
              }}
              className=' text-sm sm:text-lg pl-2'
            >ISLAM-UL-HAQ</span>
          </p>
        </div>

        {/* Pills */}
        <div>
          <a href='https://wa.me/923449461234' target='_blank' rel="noopener noreferrer" className=' text-gray-400'

          >MOB:<span className='text-md sm:text-lg pl-1 sm:pl-2 -mt-4'
            style={{
              fontFamily: 'serif',
              color: theme.brandText,
            }}
          >0344-9461234</span></a> <br />
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center mt-2 sm:mt-4">
            {highlights.map((item, i, arr) => (
              <div key={item} className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
                  {item}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-xs" style={{ color: `${p}30` }}>|</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <p
          className="text-xs text-center sm:text-right leading-relaxed flex-shrink-0"
          style={{ color: theme.textMuted, opacity: 0.6 }}
        >
          © {new Date().getFullYear()} GOLDKING. {t('footer.rightsReserved')}
          <br />
          <span>{t('placeOrder.termsNotice', { defaultValue: 'Prices for reference. Confirm at shop.' })}</span>
        </p>

      </div>
    </footer>
  );
};

export default Footer;