import { useEffect, useState } from 'react';

export default function Splash({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 500);
    const t2 = setTimeout(() => setPhase('out'), 1000);
    const t3 = setTimeout(() => {
      setShouldShow(false);
      onDone?.();
    }, 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  // Use CSS custom property to detect theme instead of classList
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkTheme = () => {
      const isDarkTheme = document.documentElement.classList.contains('dark') || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkTheme);
    };
    
    checkTheme();
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const logo = isDark
    ? '/lovable-uploads/0832e63d-9a3b-4522-9c16-56d6b4cd8fc3.png'
    : '/lovable-uploads/20a958db-a342-42f8-a711-30e17af81a0e.png';

  if (!shouldShow) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        phase === 'in' ? 'opacity-0 animate-fade-in' : 
        phase === 'out' ? 'opacity-100 animate-fade-out' : 
        'opacity-100'
      }`}
      style={{ backgroundColor: isDark ? '#000000' : '#f5f5f0' }}
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
