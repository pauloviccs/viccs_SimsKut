import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Send, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { newsService } from '@/lib/newsService';
import type { News } from '@/types';
import { supabase } from '@/lib/supabaseClient';

interface ReadNewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    news: News | null;
}

export function ReadNewsModal({ isOpen, onClose, news }: ReadNewsModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUserId(data.user?.id || null);
        };
        checkUser();
    }, []);

    // Fetch Likes
    const { data: likeData, refetch: refetchLikes } = useQuery({
        queryKey: ['news-likes', news?.id],
        queryFn: () => news ? newsService.getNewsLikeStatus(news.id) : null,
        enabled: !!news?.id,
    });

    // Fetch Comments
    const { data: comments, isLoading: isLoadingComments } = useQuery({
        queryKey: ['news-comments', news?.id],
        queryFn: () => news ? newsService.getNewsComments(news.id) : null,
        enabled: !!news?.id,
    });

    // Toggle Like Mutation
    const toggleLikeMutation = useMutation({
        mutationFn: async () => {
            if (!news || !userId) return;
            await newsService.toggleNewsLike(news.id, !!likeData?.likedByMe);
        },
        onSuccess: () => {
            refetchLikes();
        },
        onError: () => {
            toast({
                title: 'Erro',
                description: 'Você precisa estar logado para curtir.',
                variant: 'destructive'
            });
        }
    });

    // Post Comment Mutation
    const postCommentMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!news || !userId) return;
            await newsService.postNewsComment(news.id, content);
        },
        onSuccess: () => {
            setCommentText('');
            queryClient.invalidateQueries({ queryKey: ['news-comments', news?.id] });
            toast({
                title: 'Sucesso',
                description: 'Comentário enviado!',
            });
        },
        onError: () => {
            toast({
                title: 'Erro',
                description: 'Houve um problema ao enviar o comentário.',
                variant: 'destructive'
            });
        }
    });

    // Delete Comment Mutation
    const deleteCommentMutation = useMutation({
        mutationFn: async (commentId: string) => {
            await newsService.deleteNewsComment(commentId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news-comments', news?.id] });
        }
    });

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        postCommentMutation.mutate(commentText);
    };

    if (!news) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-card w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col relative overflow-hidden"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/80 backdrop-blur-md transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="overflow-y-auto flex-1 scrollbar-hide">
                                {/* Hero Banner Image */}
                                {news.image_url && (
                                    <div className="w-full h-64 md:h-80 relative">
                                        <img
                                            src={news.image_url}
                                            alt={news.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    </div>
                                )}

                                <div className="p-6 md:p-10 -mt-10 relative z-10 space-y-6">
                                    {/* Header Meta */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                                                {news.category}
                                            </span>
                                            <span className="text-xs text-white/50">
                                                {new Date(news.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit', month: 'long', year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight">
                                            {news.title}
                                        </h1>
                                        {news.author && (
                                            <div className="flex items-center gap-2 mt-4">
                                                <img
                                                    src={news.author.avatar_url || '/default-avatar.png'}
                                                    alt={news.author.display_name || news.author.username}
                                                    className="w-8 h-8 rounded-full border border-white/20 object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm text-white/90 font-medium">
                                                        {news.author.display_name || news.author.username}
                                                    </p>
                                                    <p className="text-xs text-white/50">Admin</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="w-full h-px bg-white/10"></div>

                                    {/* Content */}
                                    <div
                                        className="prose prose-invert prose-lg max-w-none text-white/80 leading-relaxed font-light [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-white/70"
                                        dangerouslySetInnerHTML={{ __html: news.excerpt }}
                                    />

                                    {/* Actions / Reactions */}
                                    <div className="flex items-center gap-4 pt-6 mt-8 border-t border-white/10">
                                        <button
                                            onClick={() => userId ? toggleLikeMutation.mutate() : toast({ title: 'Aviso', description: 'Faça login para curtir', duration: 3000 })}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${likeData?.likedByMe ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'}`}
                                        >
                                            <Heart size={20} className={likeData?.likedByMe ? 'fill-current' : ''} />
                                            <span className="font-semibold">{likeData?.likesCount || 0}</span>
                                        </button>
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/60 border border-white/5 cursor-default">
                                            <MessageSquare size={20} />
                                            <span className="font-semibold">{comments?.length || 0}</span>
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="pt-8 space-y-6">
                                        <h3 className="text-xl font-display font-semibold text-white/90">Comentários</h3>

                                        {/* Input Box (if logged in) */}
                                        {userId ? (
                                            <form onSubmit={handleSubmitComment} className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    placeholder="Adicione um comentário..."
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all placeholder:text-white/30"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!commentText.trim() || postCommentMutation.isPending}
                                                    className="bg-primary/20 text-primary border border-primary/30 p-3 rounded-xl hover:bg-primary/30 transition-colors disabled:opacity-50 flex items-center justify-center"
                                                >
                                                    {postCommentMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                                </button>
                                            </form>
                                        ) : (
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                                <p className="text-sm text-white/60">Faça login para interagir e comentar.</p>
                                            </div>
                                        )}

                                        {/* Comment List */}
                                        <div className="space-y-4 pb-10">
                                            {isLoadingComments ? (
                                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white/50" /></div>
                                            ) : comments && comments.length > 0 ? (
                                                comments.map((comment: any) => (
                                                    <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-black/20 border border-white/5 group">
                                                        <img
                                                            src={comment.author.avatar_url || '/default-avatar.png'}
                                                            alt={comment.author.username}
                                                            className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold text-white/90 text-sm">
                                                                    {comment.author.display_name || comment.author.username}
                                                                </span>
                                                                <span className="text-xs text-white/40">
                                                                    {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                                                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                                                                {comment.content}
                                                            </p>
                                                        </div>
                                                        {userId === comment.author_id && (
                                                            <button
                                                                onClick={() => deleteCommentMutation.mutate(comment.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                                                                title="Apagar comentário"
                                                                disabled={deleteCommentMutation.isPending}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-white/40 text-sm py-4">Nenhum comentário ainda. Seja o primeiro!</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
