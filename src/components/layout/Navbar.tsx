import { NavLink } from 'react-router-dom';
import { Home, Image, Lock, Users, Settings, UserCircle } from 'lucide-react';
import { NotificationsPanel } from '@/components/ui/NotificationsPanel';
import { useAuthStore } from '@/store/authStore';

export function Navbar() {
    const { profile } = useAuthStore();

    const navItems = [
        { to: '/feed', icon: Home, label: 'Feed' },
        ...(profile?.username ? [{ to: `/profile/${encodeURIComponent(profile.username)}`, icon: UserCircle, label: 'Perfil' }] : []),
        { to: '/gallery/global', icon: Image, label: 'Galeria' },
        { to: '/gallery/private', icon: Lock, label: 'Minha' },
        { to: '/family', icon: Users, label: 'Família' },
        { to: '/settings', icon: Settings, label: 'Config' },
    ];

    return (
        <nav className="md:hidden flex fixed bottom-0 left-0 right-0 z-50 glass-heavy border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
            <div className="flex w-full items-center justify-between py-2 px-3 overflow-x-auto scrollbar-hide">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        title={label}
                        className={({ isActive }) => `
              flex items-center justify-center shrink-0
              w-[44px] h-[44px] rounded-full
              transition-all duration-[150ms]
              ${isActive
                                ? 'text-[#007AFF] bg-white/[0.08]'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                            }
            `}
                    >
                        <Icon size={22} className={label === 'Perfil' ? "stroke-[1.5px]" : ""} />
                    </NavLink>
                ))}
                {/* Notificações — não é NavLink, é popup */}
                <div className="flex shrink-0 items-center justify-center">
                    <NotificationsPanel collapsed={false} upward={true} hideLabel={true} />
                </div>
            </div>
        </nav>
    );
}
