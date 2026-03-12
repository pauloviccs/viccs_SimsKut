import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { getFlashGroups } from '@/lib/flashService';
import { useFlashStore } from '@/store/flashStore';
import { useAuthStore } from '@/store/authStore';
import { FlashComposer } from './FlashComposer';
import { FlashViewer } from './FlashViewer';

import { Avatar } from '@/components/ui/Avatar';
import { useState } from 'react';
import type { FlashGroup } from '@/types';

/** Anel gradiente em torno do avatar de Flash */
function FlashRing({ hasUnseen }: { hasUnseen: boolean }) {
    // Anel: gradiente azul-roxo se tem unseen; cinza se já viu tudo
    const ringStyle = hasUnseen
        ? { background: 'linear-gradient(135deg, #007AFF, #AF52DE)' }
        : { background: 'rgba(255,255,255,0.15)' };

    return (
        <div
            className="absolute inset-0 rounded-full p-[2.5px]"
            style={ringStyle}
        >
            <div className="w-full h-full rounded-full bg-[#050508]" />
        </div>
    );
}

/** Bolha de avatar clicável na FlashBar */
function FlashAvatar({
    group,
    onClick,
    isOwn,
}: {
    group: FlashGroup;
    onClick: () => void;
    isOwn: boolean;
}) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
            style={{ minWidth: 60 }}
        >
            <div className="relative w-[58px] h-[58px]">
                <FlashRing hasUnseen={group.has_unseen} />
                <div className="absolute inset-[3px] rounded-full overflow-hidden">
                    <Avatar
                        src={group.author.avatar_url}
                        alt={group.author.display_name || group.author.username}
                        size="lg"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <span className="text-[10px] text-white/60 truncate w-full text-center px-1 inline-flex items-center justify-center gap-0.5">
                <span className="truncate">{isOwn ? 'Seu Flash' : (group.author.display_name || group.author.username)}</span>
                {group.author.is_verified && <VerifiedBadge size={10} />}
            </span>
        </motion.button>
    );
}

/** Botão de adicionar Flash (para o próprio usuário sem flashes ainda) */
function AddFlashButton({ onClick }: { onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
            style={{ minWidth: 60 }}
        >
            <div className="relative w-[58px] h-[58px]">
                <div
                    className="absolute inset-0 rounded-full p-[2px]"
                    style={{ background: 'linear-gradient(135deg, #007AFF, #AF52DE)' }}
                >
                    <div className="w-full h-full rounded-full bg-[#050508]" />
                </div>
                <div className="absolute inset-[3px] rounded-full glass flex items-center justify-center">
                    <Plus size={22} className="text-white/70" />
                </div>
            </div>
            <span className="text-[10px] text-white/60 truncate w-full text-center px-1">
                Seu Flash
            </span>
        </motion.button>
    );
}

export function FlashBar() {
    const { profile } = useAuthStore();
    const { openViewer } = useFlashStore();
    const [composerOpen, setComposerOpen] = useState(false);

    const { data: groups = [], refetch } = useQuery({
        queryKey: ['flash-groups'],
        queryFn: getFlashGroups,
        staleTime: 1000 * 60 * 2, // 2 minutos
        refetchInterval: 1000 * 60 * 5, // refetch a cada 5 min (flashes expiram)
    });

    if (!profile) return null;

    const myGroup = groups.find(g => g.author.id === profile.id);
    const otherGroups = groups.filter(g => g.author.id !== profile.id);

    return (
        <>
            <div className="glass rounded-[var(--radius-lg)] border border-white/10 px-4 py-3 mb-4">
                <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1">
                    {/* Próprio usuário: sempre primeiro — avatar + botão de adicionar */}
                    {myGroup ? (
                        <div className="relative flex flex-col items-center gap-1.5 flex-shrink-0" style={{ minWidth: 60 }}>
                            {/* Avatar clicável abre o viewer */}
                            <FlashAvatar
                                group={myGroup}
                                isOwn
                                onClick={() => openViewer(profile.id)}
                            />
                            {/* Botão "+" no canto inferior-direito do avatar (estilo Instagram) */}
                            <motion.button
                                onClick={(e) => { e.stopPropagation(); setComposerOpen(true); }}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute bottom-[22px] right-0 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-[#050508] z-10 cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #007AFF, #AF52DE)' }}
                                title="Novo Flash"
                            >
                                <Plus size={12} className="text-white" />
                            </motion.button>
                        </div>
                    ) : (
                        <AddFlashButton onClick={() => setComposerOpen(true)} />
                    )}

                    {/* Divider visual se tiver outros grupos */}
                    {otherGroups.length > 0 && (
                        <div className="w-[1px] bg-white/10 self-stretch my-1 flex-shrink-0" />
                    )}

                    {/* Flashes de amigos */}
                    <AnimatePresence initial={false}>
                        {otherGroups.map(group => (
                            <motion.div
                                key={group.author.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                            >
                                <FlashAvatar
                                    group={group}
                                    isOwn={false}
                                    onClick={() => openViewer(group.author.id)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modais */}
            <FlashComposer
                open={composerOpen}
                onClose={() => setComposerOpen(false)}
                onSuccess={() => { setComposerOpen(false); refetch(); }}
            />

            <FlashViewer groups={groups} onClose={() => { }} onRefetch={refetch} />
        </>
    );
}
