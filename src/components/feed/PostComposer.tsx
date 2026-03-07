import { useState, useRef, useEffect } from 'react';
import { ImagePlus, Images, Send, X, EyeOff } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { Avatar } from '@/components/ui/Avatar';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { MentionInput } from '@/components/ui/MentionInput';
import { useAuthStore } from '@/store/authStore';
import { createPost } from '@/lib/feedService';
import { processMentions } from '@/lib/notificationService';
import { processAndUploadFeedImage, uploadRawFile } from '@/lib/imageService';
import type { FeedPost } from '@/types';
import { GalleryPicker } from './GalleryPicker';

interface PostComposerProps {
    onPostCreated: (post: FeedPost) => void;
}

const MAX_CHARS = 280;
const MAX_IMAGES = 4;

type MediaItem =
    | { type: 'file'; file: File; preview: string }
    | { type: 'url'; url: string };

const PLACEHOLDER_PHRASES = [
    "O que está acontecendo nos Sims? 🎮",
    "🧬 Reticulando splines...",
    "🔮 Consultando o Oráculo Plumbob...",
    "✨ Preparando a vida perfeita...",
    "🏊 Limpando as piscinas...",
    "🪜 Tirando a escada da piscina...",
    "🦙 Encontrando a lhamacórnia...",
    "😊 Ajustando o humor dos Sims...",
    "🍽️ Escondendo os pratos sujos...",
    "🔥 Removendo o fogo do fogão...",
    "🎭 Programando drama aleatório...",
    "🧠 Conferindo os traços de personalidade...",
    "🚪 Instalando portas que realmente funcionam...",
    "🌱 Alimentando a Planta-Vaca...",
    "🧼 Ensinando Sims a lavar as mãos...",
    "👶 Colocando o bebê no lugar seguro...",
    "🌪️ Adicionando mais caos doméstico...",
    "👀 Preparando os vizinhos fofoqueiros...",
    "🎮 Ajustando o livre-arbítrio (ou não)...",
    "🔢 Calculando quantas vezes você vai cancelar a ação...",
    "🥤 Recolhendo copos espalhados pela casa...",
    "😭 Procurando o bebê que está chorando...",
    "🍝 Verificando se o Sim vai largar o prato no chão mesmo assim...",
    "💎 Polindo o Plumbob...",
    "📖 Carregando histórias dramáticas...",
    "👋 Ensaiando o \"Dag Dag!\"...",
    "💞 Preparando woohoo...",
    "🏗️ Instalando escadas sem corrimão...",
    "🐶 Dando banho no cachorro (mesmo ele não querendo)...",
    "🧱 Reiniciando Sims presos no chão..."
];

/**
 * Grid de preview no estilo X/Twitter: 1=full, 2=2 cols, 3=1 grande + 2 pequenas, 4=2x2
 */
function MediaPreviewGrid({ items, onRemove }: { items: MediaItem[]; onRemove: (index: number) => void }) {
    const n = items.length;
    const getPreview = (item: MediaItem) => item.type === 'file' ? item.preview : item.url;

    if (n === 0) return null;

    if (n === 1) {
        return (
            <div className="relative mt-2 rounded-[var(--radius-md)] overflow-hidden max-h-[400px]">
                <img
                    src={getPreview(items[0])}
                    alt="Preview"
                    className="w-full max-h-[400px] object-cover rounded-[var(--radius-md)]"
                />
                <button
                    type="button"
                    onClick={() => onRemove(0)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    if (n === 2) {
        return (
            <div className="grid grid-cols-2 gap-0.5 mt-2 rounded-[var(--radius-md)] overflow-hidden max-h-[300px]">
                {items.map((item, i) => (
                    <div key={i} className="relative aspect-square">
                        <img src={getPreview(item)} alt="" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        );
    }

    if (n === 3) {
        return (
            <div className="grid grid-cols-2 gap-0.5 mt-2 rounded-[var(--radius-md)] overflow-hidden max-h-[300px]">
                <div className="row-span-2 relative">
                    <img
                        src={getPreview(items[0])}
                        alt=""
                        className="w-full h-full min-h-[200px] object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => onRemove(0)}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="relative aspect-square">
                    <img src={getPreview(items[1])} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => onRemove(1)} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white cursor-pointer">
                        <X size={14} />
                    </button>
                </div>
                <div className="relative aspect-square">
                    <img src={getPreview(items[2])} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => onRemove(2)} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white cursor-pointer">
                        <X size={14} />
                    </button>
                </div>
            </div>
        );
    }

    // 4 images: 2x2 grid quadrada (estilo X/Twitter)
    return (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 mt-2 rounded-[var(--radius-md)] overflow-hidden aspect-square w-full max-h-[350px]">
            {items.map((item, i) => (
                <div key={i} className="relative min-h-0 overflow-hidden">
                    <img src={getPreview(item)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={() => onRemove(i)}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white cursor-pointer z-10"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}

/**
 * PostComposer — Campo de criação de posts com até 4 imagens (grid estilo X/Twitter).
 */
export function PostComposer({ onPostCreated }: PostComposerProps) {
    const { user, profile } = useAuthStore();
    const [content, setContent] = useState('');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [placeholder, setPlaceholder] = useState(PLACEHOLDER_PHRASES[0]);
    const fileRef = useRef<HTMLInputElement>(null);

    const [isSpoiler, setIsSpoiler] = useState(false);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * PLACEHOLDER_PHRASES.length);
        setPlaceholder(PLACEHOLDER_PHRASES[randomIndex]);
    }, []);

    const charsLeft = MAX_CHARS - content.length;
    const canPost = (content.trim().length > 0 || mediaItems.length > 0) && charsLeft >= 0;

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;

        const isGif = (f: File) => f.type === 'image/gif';
        const maxSize = (f: File) => (isGif(f) ? 5 * 1024 * 1024 : 15 * 1024 * 1024);

        const toAdd: MediaItem[] = [];
        for (let i = 0; i < files.length && mediaItems.length + toAdd.length < MAX_IMAGES; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                setError('Apenas imagens são permitidas.');
                e.target.value = '';
                return;
            }
            if (file.size > maxSize(file)) {
                setError(isGif(file) ? 'GIF muito grande. Máximo 5MB.' : 'Imagem muito grande. Máximo 15MB.');
                e.target.value = '';
                return;
            }
            toAdd.push({ type: 'file', file, preview: URL.createObjectURL(file) });
        }

        setMediaItems((prev) => [...prev, ...toAdd].slice(0, MAX_IMAGES));
        setError('');
        e.target.value = '';
    };

    const removeMedia = (index: number) => {
        setMediaItems((prev) => {
            const item = prev[index];
            if (item?.type === 'file' && item.preview) URL.revokeObjectURL(item.preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleGallerySelect = (url: string) => {
        if (mediaItems.length >= MAX_IMAGES) {
            setError(`Máximo de ${MAX_IMAGES} imagens.`);
            return;
        }
        setMediaItems((prev) => [...prev, { type: 'url' as const, url }].slice(0, MAX_IMAGES));
        setShowGalleryPicker(false);
        setError('');
    };

    const handleSubmit = async () => {
        if (!user || !canPost) return;
        setPosting(true);
        setError('');

        try {
            const imageUrls: string[] = [];
            const ts = Date.now();

            for (let i = 0; i < mediaItems.length; i++) {
                const item = mediaItems[i];
                if (item.type === 'url') {
                    imageUrls.push(item.url);
                    continue;
                }
                const file = item.file;
                const isGif = file.type === 'image/gif';
                const ext = isGif ? 'gif' : 'webp';
                const path = `${user.id}/${ts}_${i}.${ext}`;

                if (isGif) {
                    const result = await uploadRawFile(file, 'feed-images', path, 'image/gif');
                    imageUrls.push(result.url);
                } else {
                    const url = await processAndUploadFeedImage(file, 'feed-images', path);
                    imageUrls.push(url);
                }
            }

            const post = await createPost(user.id, content.trim() || null, imageUrls, isSpoiler);
            onPostCreated(post);

            if (content.trim()) {
                processMentions(content.trim(), user.id, 'mention_post', post.id).catch(console.error);
            }

            setContent('');
            setIsSpoiler(false);
            setMediaItems((prev) => {
                prev.forEach((item) => {
                    if (item.type === 'file' && item.preview) URL.revokeObjectURL(item.preview);
                });
                return [];
            });
        } catch (err) {
            console.error('Post error:', err);
            setError('Erro ao publicar. Tente novamente.');
        } finally {
            setPosting(false);
        }
    };

    return (
        <>
            <div className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-4 mb-6 relative z-20">

                <div className="flex gap-3">
                    <Avatar
                        src={profile?.avatar_url}
                        alt={profile?.display_name || 'User'}
                        size="md"
                    />

                    <div className="flex-1 min-w-0">
                        <MentionInput
                            value={content}
                            onChange={setContent}
                            placeholder={placeholder}
                            className="w-full bg-transparent text-sm text-white/90 placeholder-white/30 resize-none outline-none min-h-[60px]"
                            mode="textarea"
                            rows={2}
                            maxLength={MAX_CHARS + 10}
                        />

                        <MediaPreviewGrid items={mediaItems} onRemove={removeMedia} />

                        {error && (
                            <p className="text-xs text-[var(--accent-danger)] mt-2">{error}</p>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={mediaItems.length >= MAX_IMAGES}
                                    className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-[var(--accent-primary)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={`Enviar imagem (até ${MAX_IMAGES})`}
                                >
                                    <ImagePlus size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowGalleryPicker(true)}
                                    disabled={mediaItems.length >= MAX_IMAGES}
                                    className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-[var(--accent-primary)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Da minha galeria"
                                >
                                    <Images size={18} />
                                </button>
                                <EmojiPicker
                                    onSelect={(emoji) => setContent((prev) => prev + emoji)}
                                    size={18}
                                    position="bottom"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsSpoiler(!isSpoiler)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isSpoiler
                                            ? 'bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                                            : 'hover:bg-white/[0.06] text-white/40 hover:text-white/80'
                                        }`}
                                    title={isSpoiler ? "Remover spoiler" : "Marcar como spoiler"}
                                >
                                    <EyeOff size={18} />
                                </button>
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
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                />
            </div>

            {showGalleryPicker && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => setShowGalleryPicker(false)}
                />
            )}
        </>
    );
}
