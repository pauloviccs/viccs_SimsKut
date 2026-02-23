import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Ticket,
    Users,
    MessageSquare,
    UserCog,
    LogOut,
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

            <div className="min-h-screen flex relative z-10">
                {/* Sidebar */}
                <motion.aside
                    initial={{ x: -280, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="w-64 min-h-screen glass-card rounded-none border-l-0 border-t-0 border-b-0 flex flex-col p-4"
                    style={{ borderRadius: '0 var(--radius-lg) var(--radius-lg) 0' }}
                >
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-3 py-4 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-success)] flex items-center justify-center">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">SimsKut</p>
                            <p className="text-[10px] text-white/35">Painel Admin</p>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 flex flex-col gap-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5
                                        rounded-[var(--radius-sm)] text-sm font-medium
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
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Info + Logout */}
                    <div className="border-t border-white/10 pt-4 mt-4">
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
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
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
