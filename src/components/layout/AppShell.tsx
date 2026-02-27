import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useSidebarStore } from '@/store/sidebarStore';
import { ZenBackground } from '@/components/ui/ZenBackground';

export function AppShell() {
    const { collapsed } = useSidebarStore();

    // Fix iOS scroll detaching on mobile browsers
    useEffect(() => {
        document.body.classList.add('overflow-hidden', 'fixed', 'inset-0', 'w-full', 'h-[100dvh]');
        return () => {
            document.body.classList.remove('overflow-hidden', 'fixed', 'inset-0', 'w-full', 'h-[100dvh]');
        };
    }, []);

    return (
        <div className="h-[100dvh] w-full relative overflow-hidden bg-[#050508]">
            <ZenBackground />
            <Sidebar />

            {/* Main Content — ScrollContainer isolado */}
            <main
                id="main-scroll-container"
                className={`h-full w-full overflow-y-auto overflow-x-hidden pb-16 md:pb-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:pl-[72px] md:pr-0' : 'md:pl-[240px] md:pr-0'}`}
            >
                <div className="max-w-4xl mx-auto px-4 py-6 min-h-full">
                    <Outlet />
                </div>
            </main>

            <Navbar />
        </div>
    );
}
