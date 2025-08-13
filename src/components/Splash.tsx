import { useEffect, useState } from 'react';

export default function Splash({ loading }: { loading: boolean }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (loading) {
      setPhase('in');
      setVisible(true);
      return;
    }
    setPhase('out');
    const t = setTimeout(() => setVisible(false), 500);
    return () => clearTimeout(t);
  }, [loading]);

  // Always use light theme logo
  const logo = '/lovable-uploads/20a958db-a342-42f8-a711-30e17af81a0e.png';

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        phase === 'in' ? 'opacity-0 animate-fade-in' : 'opacity-100 animate-fade-out'
      }`}
      style={{ backgroundColor: '#f5f5f0' }}
    >
      <img
        src={logo}
        alt="Monk Zen logo"
        className="w-40 h-40 sm:w-48 sm:h-48 object-contain transition-opacity duration-500"
        onError={(e) => {
          console.error('Failed to load splash logo:', e);
          // Fallback to text if image fails
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
