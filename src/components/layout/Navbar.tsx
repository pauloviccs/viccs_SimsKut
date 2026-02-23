import { NavLink } from 'react-router-dom';
import { Home, Image, Lock, Users, Settings } from 'lucide-react';

const navItems = [
    { to: '/feed', icon: Home, label: 'Feed' },
    { to: '/gallery/global', icon: Image, label: 'Galeria' },
    { to: '/gallery/private', icon: Lock, label: 'Minha' },
    { to: '/family', icon: Users, label: 'Família' },
    { to: '/settings', icon: Settings, label: 'Config' },
];

export function Navbar() {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-heavy border-t border-white/10">
            <div className="flex items-center justify-around py-2 px-1">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `
              flex flex-col items-center gap-0.5
              min-w-[44px] min-h-[44px] py-1 px-2
              rounded-[10px] text-[10px] font-medium
              transition-all duration-[150ms]
              ${isActive
                                ? 'text-[#007AFF]'
                                : 'text-white/40 hover:text-white/70'
                            }
            `}
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
