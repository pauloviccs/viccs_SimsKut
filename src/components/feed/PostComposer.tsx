import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Images, Send, X } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { Avatar } from '@/components/ui/Avatar';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { useAuthStore } from '@/store/authStore';
import { createPost } from '@/lib/feedService';
import { processAndUpload, uploadRawFile } from '@/lib/imageService';
import type { FeedPost } from '@/types';
import { GalleryPicker } from './GalleryPicker';

interface PostComposerProps {
    onPostCreated: (post: FeedPost) => void;
}

const MAX_CHARS = 280;

/**
 * PostComposer — Campo de criação de posts.
 * Imagina como o "What's happening?" do Twitter: texto + foto opcional.
 */
export function PostComposer({ onPostCreated }: PostComposerProps) {
    const { user, profile } = useAuthStore();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [galleryImageUrl, setGalleryImageUrl] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const charsLeft = MAX_CHARS - content.length;
    const canPost = (content.trim().length > 0 || imageFile || galleryImageUrl) && charsLeft >= 0;

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Selecione um arquivo de imagem.');
            return;
        }

        const isGif = file.type === 'image/gif';
        const maxSize = isGif ? 5 * 1024 * 1024 : 15 * 1024 * 1024;
        if (file.size > maxSize) {
            setError(isGif ? 'GIF muito grande. Máximo 5MB.' : 'Imagem muito grande. Máximo 15MB.');
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setError('');
        e.target.value = '';
    };

    const removeImage = () => {
        if (imagePreview && !galleryImageUrl) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
        setGalleryImageUrl(null);
    };

    const handleGallerySelect = (url: string) => {
        removeImage();
        setGalleryImageUrl(url);
        setImagePreview(url);
        setShowGalleryPicker(false);
        setError('');
    };

    const handleSubmit = async () => {
        if (!user || !canPost) return;
        setPosting(true);
        setError('');

        try {
            let imageUrl: string | null = null;

            if (imageFile) {
                const ts = Date.now();
                const isGif = imageFile.type === 'image/gif';

                if (isGif) {
                    const path = `${user.id}/${ts}.gif`;
                    const result = await uploadRawFile(imageFile, 'feed-images', path, 'image/gif');
                    imageUrl = result.url;
                } else {
                    const path = `${user.id}/${ts}.webp`;
                    const result = await processAndUpload(imageFile, 'feed-images', path);
                    imageUrl = result.url;
                }
            } else if (galleryImageUrl) {
                imageUrl = galleryImageUrl;
            }

            const post = await createPost(user.id, content.trim() || null, imageUrl);
            onPostCreated(post);

            // Reset
            setContent('');
            removeImage();
        } catch (err) {
            console.error('Post error:', err);
            setError('Erro ao publicar. Tente novamente.');
        } finally {
            setPosting(false);
        }
    };

    return (
        <>
            <div className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-4 mb-6">
                <div className="flex gap-3">
                    <Avatar
                        src={profile?.avatar_url}
                        alt={profile?.display_name || 'User'}
                        size="md"
                    />

                    <div className="flex-1 min-w-0">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="O que está acontecendo nos Sims? 🎮"
                            className="w-full bg-transparent text-sm text-white/90 placeholder-white/30 resize-none outline-none min-h-[60px]"
                            rows={2}
                            maxLength={MAX_CHARS + 10}
                        />

                        {/* Image Preview */}
                        {imagePreview && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative mt-2 rounded-[var(--radius-md)] overflow-hidden max-h-[300px]"
                            >
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full max-h-[300px] object-cover rounded-[var(--radius-md)]"
                                />
                                <button
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        )}

                        {error && (
                            <p className="text-xs text-[var(--accent-danger)] mt-2">{error}</p>
                        )}

                        {/* Actions Bar */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-[var(--accent-primary)] transition-colors cursor-pointer"
                                    title="Enviar imagem"
                                >
                                    <ImagePlus size={18} />
                                </button>
                                <button
                                    onClick={() => setShowGalleryPicker(true)}
                                    className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-[var(--accent-primary)] transition-colors cursor-pointer"
                                    title="Da minha galeria"
                                >
                                    <Images size={18} />
                                </button>
                                <EmojiPicker
                                    onSelect={(emoji) => setContent((prev) => prev + emoji)}
                                    size={18}
                                    position="bottom"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {content.length > 0 && (
                                    <span className={`text-xs ${charsLeft < 20 ? 'text-[var(--accent-warning)]' : 'text-white/30'} ${charsLeft < 0 ? 'text-[var(--accent-danger)]' : ''}`}>
                                        {charsLeft}
                                    </span>
                                )}
                                <GlassButton
                                    onClick={handleSubmit}
                                    disabled={!canPost}
                                    isLoading={posting}
                                    className="px-4 py-2 min-h-0 text-sm"
                                >
                                    <span className="flex items-center gap-2">
                                        <Send size={14} />
                                        Publicar
                                    </span>
                                </GlassButton>
                            </div>
                        </div>
                    </div>
                </div>

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.gif"
                    onChange={handleImageSelect}
                    className="hidden"
                />
            </div>

            {/* Gallery Picker Modal */}
            {showGalleryPicker && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => setShowGalleryPicker(false)}
                />
            )}
        </>
    );
}
