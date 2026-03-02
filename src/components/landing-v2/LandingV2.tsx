import { useNavigate } from 'react-router-dom';
import FluidBackground from './FluidBackground';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import ShowcaseSection from './ShowcaseSection';
import NewsSection from './NewsSection';
import Footer from './Footer';
import CookieBanner from './CookieBanner';

export const LandingV2 = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen noise-overlay bg-[#050508]">
            <FluidBackground />
            <div className="relative z-10 w-full max-w-full overflow-hidden">
                <HeroSection
                    onRegister={() => navigate('/register')}
                    onLogin={() => navigate('/login')}
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
