import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function AppShell() {
    return (
        <div className="min-h-screen">
            <Sidebar />
            <Navbar />

            {/* Main Content */}
            <main className="md:ml-[240px] pb-20 md:pb-0 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
