import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Ticket,
    Users,
    MessageSquare,
    UserCog,
    LogOut,
    ArrowLeft,
    Sparkles,
} from 'lucide-react';
import { FluidBackground } from '@/components/ui/FluidBackground';
import { AdminOverview } from './AdminOverview';
import { InviteManager } from './InviteManager';
import { UserManager } from './UserManager';
import { AdminFeed } from './AdminFeed';
import { AdminProfile } from './AdminProfile';
import { signOut } from '@/lib/authService';
import { useAuthStore } from '@/store/authStore';

type AdminTab = 'overview' | 'invites' | 'users' | 'feed' | 'profile';

const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'invites', label: 'Convites', icon: Ticket },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'feed', label: 'Feed Geral', icon: MessageSquare },
    { id: 'profile', label: 'Meu Perfil', icon: UserCog },
];

export function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const { profile, logout } = useAuthStore();
    const navigate = useNavigate();

    async function handleLogout() {
        await signOut();
        logout();
        window.location.href = '/';
    }

    function renderContent() {
        switch (activeTab) {
            case 'overview':
                return <AdminOverview />;
            case 'invites':
                return <InviteManager />;
            case 'users':
                return <UserManager />;
            case 'feed':
                return <AdminFeed />;
            case 'profile':
                return <AdminProfile />;
        }
    }

    return (
        <>
            <FluidBackground />

            <div className="h-[100dvh] flex flex-col md:flex-row relative z-10 w-full overflow-hidden">
                {/* Sidebar -> Navbar on Mobile */}
                <motion.aside
                    initial={{ x: -280, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="w-full md:w-64 pt-[calc(1rem+env(safe-area-inset-top))] md:pt-4 p-4 md:min-h-[100dvh] glass-card rounded-none border-l-0 border-t-0 border-r-0 md:border-r border-b md:border-b-0 border-white/10 flex flex-col shrink-0 z-20"
                    style={{ borderRadius: '0' }}
                >
                    {/* Logo & Mobile Actions */}
                    <div className="flex items-center justify-between px-1 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-success)] flex items-center justify-center shrink-0">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">SimsKut</p>
                                <p className="text-[10px] text-white/35">Painel Admin</p>
                            </div>
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex md:hidden items-center gap-2">
                            <button
                                onClick={() => navigate('/feed')}
                                className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] bg-white/5 text-white/60 hover:text-white"
                                title="Voltar ao Feed"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]/80 hover:text-[var(--accent-danger)]"
                                title="Sair"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 px-1 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 md:gap-3 px-3 md:px-3 py-2.5
                                        rounded-[var(--radius-sm)] text-sm font-medium shrink-0 whitespace-nowrap
                                        transition-all duration-200 cursor-pointer
                                        ${isActive
                                            ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="admin-tab-indicator"
                                            className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Info + Logout (Desktop) */}
                    <div className="hidden md:block border-t border-white/10 pt-4 mt-auto">
                        <div className="flex items-center gap-3 px-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                {profile?.display_name?.[0]?.toUpperCase() ||
                                    profile?.username?.[0]?.toUpperCase() ||
                                    'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {profile?.display_name || profile?.username || 'Admin'}
                                </p>
                                <p className="text-[10px] text-white/30">Administrador</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/feed')}
                            className="flex items-center gap-2 px-3 py-2 w-full
                                rounded-[var(--radius-sm)] text-sm text-white/40
                                hover:text-white/80 hover:bg-white/5
                                transition-colors cursor-pointer"
                        >
                            <ArrowLeft size={16} />
                            Voltar ao Feed
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 w-full
                                rounded-[var(--radius-sm)] text-sm text-white/40
                                hover:text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10
                                transition-colors cursor-pointer"
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                </motion.aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-8">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </main>
            </div>
        </>
    );
}
