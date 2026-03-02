import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useSidebarStore } from '@/store/sidebarStore';
import { ZenBackground } from '@/components/ui/ZenBackground';

export function AppShell() {
    const { collapsed } = useSidebarStore();

    // Mantém o scroll isolado no container principal sem fixar o body no iOS.
    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, []);

    return (
        <div
            className="h-[100dvh] w-full relative overflow-hidden app-shell-zen"
        >
            <div className="app-shell-zen-content h-full w-full">
                <ZenBackground />
                <Sidebar />

                {/* Main Content — ScrollContainer isolado */}
                <main
                    id="main-scroll-container"
                    className={`h-full w-full overflow-y-auto overflow-x-hidden pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:pl-[72px] md:pr-0' : 'md:pl-[240px] md:pr-0'}`}
                >
                    <div className="max-w-4xl mx-auto px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] md:pt-6 pb-6 min-h-full">
                        <Outlet />
                    </div>
                </main>

                <Navbar />
            </div>
        </div>
    );
}
