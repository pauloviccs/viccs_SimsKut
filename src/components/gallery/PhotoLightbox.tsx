import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { getPhotoComments, addPhotoComment, deletePhotoComment, togglePhotoLike } from '@/lib/galleryService';
import type { Photo, PhotoComment } from '@/types';

interface PhotoLightboxProps {
    photo: Photo;
    onClose: () => void;
    // Callback para atualizar a foto no array pai (ex: GlobalGallery) para não precisar de refetch inteiro
    onPhotoUpdate?: (updated: Photo) => void;
}

export function PhotoLightbox({ photo, onClose, onPhotoUpdate }: PhotoLightboxProps) {
    const { user } = useAuthStore();

    // Estado do Like e contadores locais (para reagir instantaneamente)
    const [likedByMe, setLikedByMe] = useState(photo.liked_by_me || false);
    const [likesCount, setLikesCount] = useState(photo.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(photo.comments_count || 0);

    const [comments, setComments] = useState<PhotoComment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Carregar os comentários apenas quando abrir a aba de comentários
    useEffect(() => {
        if (!showComments) return;
        let mounted = true;

        const loadComments = async () => {
            setIsLoadingComments(true);
            try {
                const data = await getPhotoComments(photo.id);
                if (mounted) setComments(data);
            } catch (err) {
                console.error('Erro ao carregar comentários', err);
            } finally {
                if (mounted) setIsLoadingComments(false);
            }
        };

        loadComments();
        return () => { mounted = false; };
    }, [photo.id, showComments]);

    // Handle curtir
    const handleLike = async () => {
        if (!user) return;
        const newStatus = !likedByMe;
        setLikedByMe(newStatus);
        setLikesCount(prev => newStatus ? prev + 1 : prev - 1);

        try {
            await togglePhotoLike(photo.id, user.id);
            if (onPhotoUpdate) {
                onPhotoUpdate({
                    ...photo,
                    liked_by_me: newStatus,
                    likes_count: newStatus ? likesCount + 1 : likesCount - 1
                });
            }
        } catch (err) {
            console.error(err);
            // rollback em caso de falha
            setLikedByMe(!newStatus);
            setLikesCount(prev => !newStatus ? prev + 1 : prev - 1);
        }
    };

    // Handle novo comentário
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const added = await addPhotoComment(photo.id, user.id, newComment);
            setComments(prev => [...prev, added]);
            setNewComment('');
            const newCount = commentsCount + 1;
            setCommentsCount(newCount);
            if (onPhotoUpdate) {
                onPhotoUpdate({ ...photo, comments_count: newCount });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle excluir comentário
    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este comentário?')) return;
        try {
            await deletePhotoComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            const newCount = Math.max(0, commentsCount - 1);
            setCommentsCount(newCount);
            if (onPhotoUpdate) {
                onPhotoUpdate({ ...photo, comments_count: newCount });
            }
        } catch (err) {
            console.error('Erro ao excluir', err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-0 md:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-6xl w-full h-full md:h-[90vh] flex flex-col md:flex-row bg-[#0a0a0f] md:rounded-[var(--radius-lg)] overflow-hidden shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botão Fechar Global (Mobile fica topo esquerdo, Desktop fica superior direito) */}
                <button
                    onClick={onClose}
                    className="absolute z-10 top-3 right-3 md:top-4 md:left-4 md:right-auto w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 cursor-pointer transition-colors"
                >
                    <X size={20} />
                </button>

                {/* AREA DA IMAGEM */}
                <div className={`flex-1 flex flex-col justify-center bg-black/40 relative ${showComments ? 'hidden md:flex' : 'flex'}`}>
                    <div className="w-full h-full max-h-[80vh] md:max-h-full p-2 md:p-8 flex items-center justify-center">
                        <img
                            src={photo.url}
                            alt={photo.title || photo.description || 'Foto'}
                            className="max-w-full max-h-full object-contain rounded-[var(--radius-md)]"
                        />
                    </div>
                </div>

                {/* AREA DA SIDEBAR LATERAL (INFORMAÇÕES & COMENTÁRIOS) */}
                <div className={`w-full md:w-[350px] lg:w-[400px] bg-white/[0.02] border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-[50vh] md:h-full ${!showComments ? 'absolute bottom-0 md:relative' : 'h-full md:relative'}`}>

                    {/* Header: Autor e Infos da Foto */}
                    <div className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-md flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={photo.owner?.avatar_url}
                                    alt={photo.owner?.display_name || 'Usuário'}
                                    size="sm"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-white/90">
                                        {photo.owner?.display_name || 'Anônimo'}
                                    </p>
                                    <p className="text-[11px] text-white/40">
                                        {new Date(photo.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {photo.title && (
                            <h2 className="text-base font-bold text-white/95 mb-1">{photo.title}</h2>
                        )}
                        {photo.description && (
                            <p className="text-sm text-white/70 whitespace-pre-wrap">{photo.description}</p>
                        )}
                        {!photo.title && !photo.description && (
                            <p className="text-sm text-white/40 italic">Sem legenda</p>
                        )}
                    </div>

                    {/* Barra de Ações Rápidas (Like / Comentar) */}
                    <div className="flex items-center justify-around py-3 border-b border-white/5 flex-shrink-0 bg-black/10">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors cursor-pointer ${likedByMe ? 'text-red-500 hover:bg-red-500/10' : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                                }`}
                        >
                            <Heart size={20} className={likedByMe ? 'fill-current' : ''} />
                            <span className="text-sm font-medium">{likesCount}</span>
                        </button>

                        <button
                            onClick={() => setShowComments(!showComments)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-colors ${showComments ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                                }`}
                        >
                            <MessageSquare size={20} />
                            <span className="text-sm font-medium">{commentsCount}</span>
                        </button>
                    </div>

                    {/* Lista de Comentários */}
                    {showComments && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                                {isLoadingComments ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 size={24} className="animate-spin text-white/30" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-white/40">Nenhum comentário ainda. Seja o primeiro!</p>
                                    </div>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <Avatar
                                                src={comment.author?.avatar_url}
                                                alt={comment.author?.display_name || 'User'}
                                                size="sm"
                                            />
                                            <div className="flex-1">
                                                <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2 relative">
                                                    <span className="text-xs font-bold text-white/90">
                                                        {comment.author?.display_name || 'Anônimo'}
                                                    </span>
                                                    <p className="text-sm text-white/80 mt-0.5 break-words">
                                                        {comment.content}
                                                    </p>
                                                    {/* Botão Excluir (se dono do comentário) */}
                                                    {(user?.id === comment.author_id || user?.user_metadata?.is_admin) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/20 rounded-full transition-all"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-white/30 px-2 mt-1">
                                                    {new Date(comment.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input de Novo Comentário */}
                            <form onSubmit={handleSubmitComment} className="p-3 border-t border-white/10 bg-black/20 flex gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 hidden sm:block">
                                    <Avatar src={user?.user_metadata?.avatar_url} alt="You" size="sm" />
                                </div>
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Adicione um comentário..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="w-10 h-10 shrink-0 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent-primary)]/80 transition-colors"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
