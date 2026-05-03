import { NavLink } from 'react-router-dom';
import { Home, Search, Library, User, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

export const Navbar = () => {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Library, label: 'Library', path: '/library' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 border-t border-white/5 bg-black/80 backdrop-blur-2xl pb-safe">
      <div className="mx-auto grid h-16 max-w-2xl grid-cols-5">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'group flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-tighter transition-all',
                isActive ? 'text-primary' : 'text-zinc-500 hover:text-zinc-200',
              )
            }
          >
            <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive && "text-glow")} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
