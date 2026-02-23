import { NavLink } from 'react-router-dom';
import {
    Home,
    Image,
    Lock,
    Users,
    TreePine,
    Settings,
    Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
    { to: '/feed', icon: Home, label: 'Feed' },
    { to: '/gallery/global', icon: Image, label: 'Galeria Global' },
    { to: '/gallery/private', icon: Lock, label: 'Minha Galeria' },
    { to: '/family', icon: Users, label: 'Minha Família' },
    { to: '/family-tree', icon: TreePine, label: 'Árvore Genealógica' },
    { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
    const isAdmin = useAuthStore((s) => s.isAdmin);

    return (
        <aside className="hidden md:flex flex-col w-[240px] h-screen fixed left-0 top-0 glass-heavy border-r border-white/10 p-4 z-40">
            {/* Logo */}
            <div className="flex items-center gap-3 px-3 py-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#34C759] flex items-center justify-center text-lg font-bold">
                    S
                </div>
                <span className="text-lg font-semibold tracking-tight text-white/90">
                    SimsKut
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 flex-1">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5
              rounded-[10px] text-sm font-medium
              transition-all duration-[150ms]
              ${isActive
                                ? 'bg-white/15 text-white'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                            }
            `}
                    >
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}

                {isAdmin && (
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5
              rounded-[10px] text-sm font-medium
              transition-all duration-[150ms]
              mt-2 border-t border-white/10 pt-4
              ${isActive
                                ? 'bg-[#FF9500]/20 text-[#FF9500]'
                                : 'text-[#FF9500]/60 hover:text-[#FF9500]/90 hover:bg-[#FF9500]/10'
                            }
            `}
                    >
                        <Shield size={18} />
                        Admin
                    </NavLink>
                )}
            </nav>
        </aside>
    );
}
