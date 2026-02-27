import { motion, AnimatePresence } from 'framer-motion';
import { useCookieStore } from '../../store/cookieStore';
import { GlassButton } from './GlassButton';

export function CookieBanner() {
    const { hasAnswered, acceptAll } = useCookieStore();

    return (
        <AnimatePresence>
            {!hasAnswered && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:max-w-sm z-[9999]"
                >
                    <div className="glass-popup p-6 flex flex-col gap-4 text-sm text-foreground/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2 font-display">
                                🍪 Sua privacidade conta!
                            </h3>
                            <p className="leading-relaxed opacity-80">
                                Nós usamos cookies para melhorar sua experiência no SimsKut, e personalizar conteúdo. Ao aceitar, você concorda que o site permaneça nos ajuda a melhorar!
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end mt-2">
                            {/* Opções estendidas omitidas por agora pra fluxo de 1 clique, futuramente entram na v2 */}
                            <GlassButton
                                onClick={acceptAll}
                                variant="primary"
                                className="w-full md:w-auto px-6 font-medium tracking-wide"
                            >
                                Aceitar tudo e fechar
                            </GlassButton>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
