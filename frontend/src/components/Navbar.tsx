import { NavLink } from 'react-router-dom';
import { Home, Search, Library, User, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

export const Navbar = () => {
  const navItems = [
    { icon: Home, label: 'خانه', path: '/' },
    { icon: Search, label: 'جستجو', path: '/search' },
    { icon: Library, label: 'کتابخانه', path: '/library' },
    { icon: LayoutDashboard, label: 'داشبورد', path: '/dashboard' },
    { icon: User, label: 'پروفایل', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 border-t border-fuchsia-500/20 bg-zinc-950/85 backdrop-blur-xl pb-safe">
      <div className="mx-auto grid h-16 max-w-2xl grid-cols-5">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'group flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all',
                isActive ? 'text-fuchsia-400' : 'text-zinc-500 hover:text-zinc-200',
              )
            }
          >
            <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
