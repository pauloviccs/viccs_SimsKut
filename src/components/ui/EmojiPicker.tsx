import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';

/**
 * EmojiPicker — Seletor de emojis nativo.
 * Usa emojis Unicode do sistema (sempre atualizados pelo OS do dispositivo).
 * Sem lib externa — leve, bonito, e Mobile First.
 */

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    /** Tamanho do botão trigger */
    size?: number;
    /** Posição do popup: auto detecta, mas pode forçar */
    position?: 'top' | 'bottom';
}

// Categorias de emojis com os mais usados e modernos
const categories = [
    {
        name: '😊',
        label: 'Carinhas',
        emojis: [
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉',
            '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲',
            '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🫣',
            '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏',
            '😒', '🙄', '😬', '🤥', '🫠', '😌', '😔', '😪', '🤤', '😴',
            '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴', '😵', '🤯',
            '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟', '🙁',
            '😮', '😯', '😲', '😳', '🥺', '🥹', '😦', '😧', '😨', '😰',
            '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
            '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩',
        ],
    },
    {
        name: '👋',
        label: 'Gestos',
        emojis: [
            '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '🫷',
            '🫸', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙',
            '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊',
            '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏',
            '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀',
        ],
    },
    {
        name: '❤️',
        label: 'Corações',
        emojis: [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
            '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
            '💟', '♥️', '🩷', '🩵', '🩶', '💐', '🌹', '🥀', '🌺', '🌸',
            '💮', '🏵️', '🌻', '🌼', '🌷', '🪻', '🪷', '🌱', '🪴', '🌿',
        ],
    },
    {
        name: '🎮',
        label: 'Jogos & Diversão',
        emojis: [
            '🎮', '🕹️', '🎯', '🎲', '🧩', '🎰', '🎳', '🎪', '🎭', '🎨',
            '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪘',
            '🎻', '🪕', '🎶', '🎵', '🎙️', '📸', '📷', '🖼️', '🎞️', '📽️',
            '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️',
            '⭐', '🌟', '✨', '💫', '🔥', '💥', '💯', '🎉', '🎊', '🥳',
        ],
    },
    {
        name: '🍕',
        label: 'Comida',
        emojis: [
            '🍕', '🍔', '🍟', '🌭', '🍿', '🧀', '🥚', '🍳', '🥞', '🧇',
            '🥓', '🥩', '🍗', '🍖', '🌮', '🌯', '🫔', '🥗', '🥘', '🍝',
            '🍜', '🍲', '🫕', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙',
            '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦',
            '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍩', '🍪',
            '☕', '🍵', '🧋', '🥤', '🧃', '🍶', '🍺', '🍻', '🥂', '🍷',
        ],
    },
    {
        name: '🐱',
        label: 'Animais',
        emojis: [
            '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
            '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
            '🐔', '🐧', '🐦', '🐤', '🪿', '🦆', '🦅', '🦉', '🦇', '🐺',
            '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜',
            '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🦈', '🐙', '🐚', '🪸',
        ],
    },
    {
        name: '🏠',
        label: 'Objetos',
        emojis: [
            '🏠', '🏡', '🏢', '🏣', '🏥', '🏦', '🏪', '🏫', '🏬', '🏭',
            '💻', '🖥️', '⌨️', '🖱️', '📱', '📲', '☎️', '📞', '📟', '📠',
            '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶',
            '💷', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨',
            '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🗜️', '⚗️', '🧪', '🧫',
        ],
    },
];

export function EmojiPicker({ onSelect, size = 18, position = 'top' }: EmojiPickerProps) {
    const [open, setOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fecha ao clicar fora
    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        // Não fecha automaticamente para permitir seleção múltipla
    };

    const popupPosition = position === 'top'
        ? 'bottom-full mb-2'
        : 'top-full mt-2';

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                type="button"
                className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-[var(--accent-primary)] transition-colors cursor-pointer"
                title="Emoji"
            >
                <Smile size={size} />
            </button>

            {/* Popup */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute ${popupPosition} right-0 z-50 w-[320px] sm:w-[352px] glass-heavy rounded-[var(--radius-md)] border border-white/10 overflow-hidden`}
                    >
                        {/* Category Tabs */}
                        <div className="flex border-b border-white/[0.08] px-1">
                            {categories.map((cat, i) => (
                                <button
                                    key={cat.label}
                                    onClick={() => setActiveCategory(i)}
                                    type="button"
                                    className={`flex-1 py-2 text-center text-base transition-colors cursor-pointer ${activeCategory === i
                                            ? 'bg-white/[0.08] border-b-2 border-[var(--accent-primary)]'
                                            : 'hover:bg-white/[0.04]'
                                        }`}
                                    title={cat.label}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Emoji Grid */}
                        <div className="h-[220px] overflow-y-auto p-2 scrollbar-hide">
                            <div className="grid grid-cols-8 gap-0.5">
                                {categories[activeCategory].emojis.map((emoji, i) => (
                                    <button
                                        key={`${emoji}-${i}`}
                                        onClick={() => handleSelect(emoji)}
                                        type="button"
                                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl rounded-lg hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Label */}
                        <div className="px-3 py-1.5 border-t border-white/[0.06] text-[10px] text-white/30">
                            {categories[activeCategory].label}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
