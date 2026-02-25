import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home,
    Image,
    Camera,
    Users,
    TreePine,
    Settings,
    Shield,
    LogOut,
    ArrowLeft,
    PanelLeftClose,
    PanelLeftOpen,
    UserCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { signOut } from '@/lib/authService';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationsPanel } from '@/components/ui/NotificationsPanel';

const navItems = [
    { to: '/feed', icon: Home, label: 'Feed' },
    { to: '/gallery/global', icon: Image, label: 'Galeria Global' },
    { to: '/gallery/private', icon: Camera, label: 'Minha Galeria' },
    { to: '/family', icon: Users, label: 'Minha Família' },
    { to: '/family-tree', icon: TreePine, label: 'Árvore Genealógica' },
    { to: '/settings', icon: Settings, label: 'Configurações' },
];

const profileItem = { icon: UserCircle, label: 'Meu Perfil' };

export function Sidebar() {
    const navigate = useNavigate();
    const { user, profile, isAdmin, logout } = useAuthStore();
    const { collapsed, toggle } = useSidebarStore();

    const handleLogout = async () => {
        try {
            logout();
            await signOut();
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <aside
            className={`hidden md:flex flex-col h-screen fixed left-0 top-0 glass-heavy border-r border-white/10 z-40 transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[240px]'
                }`}
        >
            {/* === Top: Logo + Toggle === */}
            <div className="flex items-center gap-3 px-4 py-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#34C759] flex items-center justify-center text-lg font-bold shrink-0">
                    S
                </div>
                {!collapsed && (
                    <span className="text-lg font-semibold tracking-tight text-white/90 whitespace-nowrap overflow-hidden">
                        SimsKut
                    </span>
                )}
                <button
                    onClick={toggle}
                    className={`w-8 h-8 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors cursor-pointer shrink-0 ${collapsed ? 'mx-auto' : 'ml-auto'
                        }`}
                    title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                >
                    {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
            </div>

            {/* === Profile Card === */}
            {user && (
                <div className={`mx-3 mb-4 p-3 rounded-[var(--radius-md)] bg-white/[0.04] border border-white/[0.06] transition-all duration-300 ${collapsed ? 'px-2' : ''}`}>
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                        <Avatar
                            src={profile?.avatar_url}
                            alt={profile?.display_name || 'User'}
                            size="md"
                        />
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white/90 truncate">
                                    {profile?.display_name || user.email?.split('@')[0]}
                                </p>
                                <p className="text-[10px] text-white/40 truncate">
                                    @{profile?.username || 'user'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === Notifications === */}
            {user && (
                <div className="mx-3 mb-2">
                    <NotificationsPanel collapsed={collapsed} />
                </div>
            )}

            {/* === Navigation === */}
            <nav className="flex flex-col gap-1 flex-1 overflow-y-auto px-3">
                {navItems.map(({ to, icon: Icon, label }) => {
                    // Inject profile right after Feed
                    if (label === 'Feed') {
                        return (
                            <div key="feed-group" className="contents">
                                <NavLink
                                    to={to}
                                    title={collapsed ? label : undefined}
                                    className={({ isActive }) => `
                                        flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5
                                        rounded-[10px] text-sm font-medium
                                        transition-all duration-[150ms]
                                        ${isActive
                                            ? 'bg-white/15 text-white'
                                            : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                                        }
                                    `}
                                >
                                    <Icon size={18} className="shrink-0" />
                                    {!collapsed && label}
                                </NavLink>
                                {profile?.username && (
                                    <NavLink
                                        key="profile"
                                        to={`/profile/${encodeURIComponent(profile.username)}`}
                                        title={collapsed ? profileItem.label : undefined}
                                        className={({ isActive }) => `
                                            flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5
                                            rounded-[10px] text-sm font-medium
                                            transition-all duration-[150ms]
                                            ${isActive
                                                ? 'bg-white/15 text-white'
                                                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                                            }
                                        `}
                                    >
                                        <profileItem.icon size={18} className="shrink-0" />
                                        {!collapsed && profileItem.label}
                                    </NavLink>
                                )}
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={to}
                            to={to}
                            title={collapsed ? label : undefined}
                            className={({ isActive }) => `
                                flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5
                                rounded-[10px] text-sm font-medium
                                transition-all duration-[150ms]
                                ${isActive
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                                }
                            `}
                        >
                            <Icon size={18} className="shrink-0" />
                            {!collapsed && label}
                        </NavLink>
                    );
                })}

                {isAdmin && (
                    <NavLink
                        to="/admin/dashboard"
                        title={collapsed ? 'Admin' : undefined}
                        className={({ isActive }) => `
                            flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5
                            rounded-[10px] text-sm font-medium
                            transition-all duration-[150ms]
                            mt-2 border-t border-white/10 pt-4
                            ${isActive
                                ? 'bg-[#FF9500]/20 text-[#FF9500]'
                                : 'text-[#FF9500]/60 hover:text-[#FF9500]/90 hover:bg-[#FF9500]/10'
                            }
                        `}
                    >
                        <Shield size={18} className="shrink-0" />
                        {!collapsed && 'Admin'}
                    </NavLink>
                )}
            </nav>

            {/* === Footer: Home + Logout === */}
            <div className="px-3 py-3 border-t border-white/[0.06] flex flex-col gap-1">
                <button
                    onClick={() => navigate('/')}
                    title={collapsed ? 'Página Inicial' : undefined}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-[10px] text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-150 w-full cursor-pointer`}
                >
                    <ArrowLeft size={18} className="shrink-0" />
                    {!collapsed && 'Página Inicial'}
                </button>
                <button
                    onClick={handleLogout}
                    title={collapsed ? 'Sair da Conta' : undefined}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-[10px] text-sm font-medium text-[var(--accent-danger)]/60 hover:text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 transition-all duration-150 w-full cursor-pointer`}
                >
                    <LogOut size={18} className="shrink-0" />
                    {!collapsed && 'Sair da Conta'}
                </button>
            </div>
        </aside>
    );
}
