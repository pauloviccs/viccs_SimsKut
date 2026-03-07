import { motion } from 'framer-motion';
import { GlobalGallery } from '@/components/gallery/GlobalGallery';
import { TrendingBunny } from './TrendingBunny';
import { ChallengesHub } from './challenges/ChallengesHub';

export default function CommunityPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full"
        >
            {/* Mobile Top Trending / Desktop Right Sidebar */}
            <div className="lg:order-last w-full lg:w-80 shrink-0 mb-6 lg:mb-0 space-y-6">
                <TrendingBunny />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-12">
                <GlobalGallery />

                {/* Horizontal Divider */}
                <div className="h-px w-full bg-white/10" />

                <ChallengesHub />
            </div>
        </motion.div>
    );
}
