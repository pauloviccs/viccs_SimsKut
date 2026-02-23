import { motion } from 'framer-motion';

/**
 * FluidBackground — Blobs animados com mix-blend-screen
 * Cria o efeito "líquido" atrás de todo o conteúdo.
 * Referência: skill liquid-glass-design (Mesh Gradients)
 */
export function FluidBackground() {
    return (
        <div className="fluid-bg" aria-hidden="true">
            <motion.div
                className="fluid-blob fluid-blob--primary"
                animate={{
                    x: [0, 30, -20, 20, 0],
                    y: [0, -50, 20, 40, 0],
                    scale: [1, 1.1, 0.95, 1.05, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                className="fluid-blob fluid-blob--secondary"
                animate={{
                    x: [0, -40, 30, -20, 0],
                    y: [0, 30, -30, -40, 0],
                    scale: [1, 1.08, 0.92, 1.12, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 2,
                }}
            />
            <motion.div
                className="fluid-blob fluid-blob--accent"
                animate={{
                    x: [0, 50, -30, 10, 0],
                    y: [0, -20, 40, -30, 0],
                    scale: [1, 0.9, 1.1, 0.95, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 4,
                }}
            />
            <motion.div
                className="fluid-blob fluid-blob--warm"
                animate={{
                    x: [0, -20, 40, -30, 0],
                    y: [0, 40, -20, 30, 0],
                    scale: [1, 1.05, 0.9, 1.08, 1],
                }}
                transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 6,
                }}
            />
        </div>
    );
}
