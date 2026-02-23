import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/components/auth/LandingPage';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { LoginPage } from '@/components/auth/LoginPage';
import { FeedPage } from '@/components/feed/FeedPage';
import { GlobalGallery } from '@/components/gallery/GlobalGallery';
import { PrivateGallery } from '@/components/gallery/PrivateGallery';
import { FamilyConfig } from '@/components/family/FamilyConfig';
import { FamilyTree } from '@/components/family/FamilyTree';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function App() {
    return (
        <Routes>
            {/* Rotas públicas (sem sidebar/navbar) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Rotas protegidas (com AppShell: sidebar + navbar) */}
            <Route element={<AppShell />}>
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/gallery/global" element={<GlobalGallery />} />
                <Route path="/gallery/private" element={<PrivateGallery />} />
                <Route path="/family" element={<FamilyConfig />} />
                <Route path="/family-tree" element={<FamilyTree />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
        </Routes>
    );
}
