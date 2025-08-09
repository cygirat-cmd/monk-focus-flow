import { useEffect, useState } from 'react';

export default function Splash({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 500);
    const t2 = setTimeout(() => setPhase('out'), 1000);
    const t3 = setTimeout(() => onDone?.(), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const isDark = document.documentElement.classList.contains('dark');
  const logo = isDark
    ? '/lovable-uploads/0832e63d-9a3b-4522-9c16-56d6b4cd8fc3.png'
    : '/lovable-uploads/20a958db-a342-42f8-a711-30e17af81a0e.png';

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background ${
        phase === 'in' ? 'animate-fade-in' : phase === 'out' ? 'animate-fade-out' : ''
      }`}
      style={isDark ? { backgroundColor: '#000000' } : undefined}
    >
      <img
        src={logo}
        alt="Monk Zen logo"
        className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
      />
    </div>
  );
}
