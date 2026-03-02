import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import FluidBackground from './FluidBackground';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import ShowcaseSection from './ShowcaseSection';
import NewsSection from './NewsSection';
import Footer from './Footer';
import CookieBanner from './CookieBanner';

export const LandingV2 = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    return (
        <div className="relative min-h-screen noise-overlay bg-[#050508] select-none">
            <FluidBackground />
            <div className="relative z-10 w-full max-w-full overflow-hidden">
                <HeroSection
                    isLoggedIn={!!user}
                    onRegister={() => navigate('/register')}
                    onLogin={() => navigate('/login')}
                    onDashboard={() => navigate('/feed')}
                />
                <FeaturesSection />
                <ShowcaseSection />
                <NewsSection />
                <Footer />
            </div>
            <CookieBanner />
        </div>
    );
};
