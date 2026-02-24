import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { searchUsers } from '@/lib/notificationService';
import type { Profile } from '@/types';

/**
 * MentionInput — Input/Textarea com autocomplete de @username.
 * Imagina como o Instagram/Twitter: digita @, aparece um dropdown
 * com as sugestões de usuários, seleciona e insere no texto.
 */

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    maxLength?: number;
    /** 'input' = single line, 'textarea' = multiline */
    mode?: 'input' | 'textarea';
    rows?: number;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function MentionInput({
    value,
    onChange,
    placeholder,
    className = '',
    maxLength,
    mode = 'input',
    rows = 2,
    onKeyDown,
}: MentionInputProps) {
    const [suggestions, setSuggestions] = useState<Profile[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStart, setMentionStart] = useState(-1);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Detecta @ no texto enquanto digita
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        const cursorPos = e.target.selectionStart ?? newValue.length;
        const textBeforeCursor = newValue.slice(0, cursorPos);

        // Procura o último @ sem espaço depois
        const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_#]*)$/);

        if (atMatch) {
            const query = atMatch[1];
            setMentionStart(cursorPos - query.length - 1);
            setMentionQuery(query);
            setSelectedIndex(0);

            // Debounce a busca
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(async () => {
                if (query.length >= 1) {
                    try {
                        const results = await searchUsers(query);
                        setSuggestions(results);
                        setShowSuggestions(results.length > 0);
                    } catch {
                        setShowSuggestions(false);
                    }
                } else {
                    setShowSuggestions(false);
                }
            }, 200);
        } else {
            setShowSuggestions(false);
            setMentionQuery('');
        }
    };

    // Seleciona uma sugestão
    const selectUser = useCallback((user: Profile) => {
        const before = value.slice(0, mentionStart);
        const after = value.slice(mentionStart + mentionQuery.length + 1); // +1 pro @
        const newValue = `${before}@${user.username} ${after}`;
        onChange(newValue);
        setShowSuggestions(false);
        setSuggestions([]);
        setMentionQuery('');

        // Foca de volta no input
        setTimeout(() => {
            if (inputRef.current) {
                const pos = mentionStart + user.username.length + 2; // @username + espaço
                inputRef.current.focus();
                inputRef.current.setSelectionRange(pos, pos);
            }
        }, 10);
    }, [value, mentionStart, mentionQuery, onChange]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % suggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectUser(suggestions[selectedIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setShowSuggestions(false);
                return;
            }
        }

        // Propaga o onKeyDown original (para Enter enviar comentário, etc)
        onKeyDown?.(e);
    };

    // Fecha ao clicar fora
    useEffect(() => {
        if (!showSuggestions) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showSuggestions]);

    const sharedProps = {
        ref: inputRef as any,
        value,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        placeholder,
        className,
        maxLength,
    };

    return (
        <div className="relative flex-1" ref={containerRef}>
            {mode === 'textarea' ? (
                <textarea {...sharedProps} rows={rows} />
            ) : (
                <input {...sharedProps} />
            )}

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 bottom-full mb-1 w-full max-w-[280px] glass-popup rounded-[var(--radius-sm)] border border-white/10 py-1 z-50 overflow-hidden"
                    >
                        {suggestions.map((user, i) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => selectUser(user)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${i === selectedIndex
                                        ? 'bg-white/[0.08]'
                                        : 'hover:bg-white/[0.04]'
                                    }`}
                            >
                                <Avatar
                                    src={user.avatar_url}
                                    alt={user.display_name || user.username}
                                    size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white/80 truncate">
                                        {user.display_name || user.username}
                                    </p>
                                    <p className="text-[10px] text-white/35 truncate">
                                        @{user.username}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
