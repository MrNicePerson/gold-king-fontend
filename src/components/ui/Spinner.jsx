export default function Spinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  return (
    <div className="flex justify-center items-center p-8">
      <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-gold-500 ${sizeClasses[size]}`} />
    </div>
  );
}