import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useSidebarStore } from '@/store/sidebarStore';

export function AppShell() {
    const { collapsed } = useSidebarStore();

    return (
        <div className="min-h-screen">
            <Sidebar />
            <Navbar />

            {/* Main Content — margin ajusta dinamicamente com a sidebar */}
            <main
                className={`pb-20 md:pb-0 min-h-screen transition-all duration-300 ease-in-out ${collapsed ? 'md:ml-[72px]' : 'md:ml-[240px]'
                    }`}
            >
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
