
import { Home, CheckSquare, Store, Settings, TreePine, Sprout } from 'lucide-react';

const Tab = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const isActive = typeof window !== 'undefined' && window.location?.pathname === to;
  const base = "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-md transition-colors duration-200";
  const cls = isActive ? `${base} text-primary bg-accent` : `${base} text-muted-foreground hover:text-foreground`;
  return (
    <a href={to} className={cls} aria-label={label}>
      <Icon size={22} />
      <span className="text-xs">{label}</span>
    </a>
  );
};

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-md grid grid-cols-6 gap-1 px-2">
        <Tab to="/" icon={Home} label="Timer" />
        <Tab to="/tasks" icon={CheckSquare} label="Tasks" />
        <Tab to="/zen-path" icon={TreePine} label="Path" />
        <Tab to="/garden" icon={Sprout} label="Garden" />
        <Tab to="/store" icon={Store} label="Store" />
        <Tab to="/settings" icon={Settings} label="Settings" />
      </div>
    </nav>
  );
}
