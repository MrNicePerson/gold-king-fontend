export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gold-500 hover:bg-gold-600 text-white shadow-md hover:shadow-lg focus:ring-gold-400',
    secondary: 'bg-luxury-soft hover:bg-luxury-darker text-white shadow focus:ring-luxury-soft',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
    outline: 'border-2 border-gold-500 text-gold-600 hover:bg-gold-50 focus:ring-gold-300',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}