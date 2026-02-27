import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/components/auth/LandingPage';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { LoginPage } from '@/components/auth/LoginPage';
import { PendingApproval } from '@/components/auth/PendingApproval';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FeedPage } from '@/components/feed/FeedPage';
import { GlobalGallery } from '@/components/gallery/GlobalGallery';
import { PrivateGallery } from '@/components/gallery/PrivateGallery';
import { FamilyConfig } from '@/components/family/FamilyConfig';
import { FamilyTree } from '@/components/family/FamilyTree';
import { AuthCallback } from '@/components/auth/AuthCallback';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { CookieBanner } from '@/components/ui/CookieBanner';

export default function App() {
    return (
        <>
            <Routes>
                {/* Rotas públicas (sem sidebar/navbar) */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pending" element={<PendingApproval />} />

                {/* Callback do OAuth — handler dedicado */}
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Rotas protegidas (com AppShell: sidebar + navbar) */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppShell />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/gallery/global" element={<GlobalGallery />} />
                    <Route path="/gallery/private" element={<PrivateGallery />} />
                    <Route path="/family" element={<FamilyConfig />} />
                    <Route path="/family-tree" element={<FamilyTree />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/profile/:username" element={<ProfilePage />} />
                </Route>

                {/* Admin — protegido + adminOnly */}
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute adminOnly>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>

            {/* Global Overlays for Public & Protected routes */}
            <CookieBanner />
        </>
    );
}
