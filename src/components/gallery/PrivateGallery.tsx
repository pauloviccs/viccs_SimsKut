import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Upload, FolderPlus, Folder, MoreHorizontal, Pencil, Trash2,
    ArrowLeft, Globe, EyeOff, Loader2, ImagePlus, X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { useAuthStore } from '@/store/authStore';
import {
    getFolders, createFolder, renameFolder, deleteFolder,
    getPhotos, addPhoto, deletePhoto, toggleVisibility,
} from '@/lib/galleryService';
import { processAndUpload } from '@/lib/imageService';
import { PhotoUploadModal } from './PhotoUploadModal';
import { PhotoLightbox } from './PhotoLightbox';
import type { GalleryFolder, Photo } from '@/types';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function PrivateGallery() {
    const { user } = useAuthStore();
    const [folders, setFolders] = useState<GalleryFolder[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentFolder, setCurrentFolder] = useState<GalleryFolder | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [editingFolder, setEditingFolder] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [pendingUploads, setPendingUploads] = useState<File[]>([]);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Load folders
    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getFolders(user.id)
            .then(setFolders)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    // Load photos when folder changes
    useEffect(() => {
        if (!user || !currentFolder) return;
        setLoading(true);
        getPhotos(user.id, currentFolder.id)
            .then(setPhotos)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user, currentFolder]);

    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;
        try {
            const folder = await createFolder(user.id, newFolderName);
            setFolders((prev) => [folder, ...prev]);
            setNewFolderName('');
            setShowNewFolder(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleRenameFolder = async (folderId: string) => {
        if (!editName.trim()) return;
        try {
            await renameFolder(folderId, editName);
            setFolders((prev) => prev.map((f) =>
                f.id === folderId ? { ...f, name: editName.trim() } : f
            ));
            setEditingFolder(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm('Deletar pasta e todas as fotos?')) return;
        try {
            await deleteFolder(folderId);
            setFolders((prev) => prev.filter((f) => f.id !== folderId));
            setMenuOpen(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length) {
            setPendingUploads(files);
        }
        e.target.value = '';
    };

    const handleConfirmUpload = async (title: string, description: string) => {
        if (!user || !currentFolder || !pendingUploads.length) return;
        setUploading(true);
        try {
            for (const file of pendingUploads) {
                if (!file.type.startsWith('image/')) continue;
                const ts = Date.now();
                const path = `${user.id}/${currentFolder.id}/${ts}.webp`;
                const result = await processAndUpload(file, 'gallery-images', path);
                const photo = await addPhoto(user.id, result.url, result.thumbnailUrl, currentFolder.id, title, description);
                setPhotos((prev) => [photo, ...prev]);
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
            setPendingUploads([]);
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        try {
            await deletePhoto(photoId);
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleVisibility = async (photo: Photo) => {
        try {
            const updated = await toggleVisibility(photo.id, photo.visibility === 'private');
            setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, visibility: updated.visibility } : p));
        } catch (err) {
            console.error('Toggle visibility error:', err);
        }
    };

    // ===== FOLDER VIEW =====
    if (currentFolder) {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => { setCurrentFolder(null); setPhotos([]); }}
                        className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-2xl font-bold flex-1">{currentFolder.name}</h1>
                    <GlassButton
                        variant="primary"
                        onClick={() => fileRef.current?.click()}
                        isLoading={uploading}
                    >
                        <span className="flex items-center gap-2">
                            <Upload size={16} />
                            Upload
                        </span>
                    </GlassButton>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={28} className="animate-spin text-white/30" />
                    </div>
                ) : photos.length === 0 ? (
                    <GlassCard className="text-center py-12">
                        <ImagePlus size={40} className="mx-auto mb-4 text-white/30" />
                        <h2 className="text-lg font-semibold text-white/70 mb-2">Pasta vazia</h2>
                        <p className="text-sm text-white/40">Faça upload de fotos para esta pasta.</p>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <AnimatePresence>
                            {photos.map((photo) => (
                                <motion.div
                                    key={photo.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative group rounded-[var(--radius-md)] overflow-hidden aspect-square glass-heavy border border-white/10"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img
                                        src={photo.thumbnail_url || photo.url}
                                        alt={photo.title || photo.description || 'Foto'}
                                        loading="lazy"
                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleToggleVisibility(photo); }}
                                            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
                                            title={photo.visibility === 'public' ? 'Tornar privada' : 'Tornar pública'}
                                        >
                                            {photo.visibility === 'public' ? <Globe size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                                            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-[var(--accent-danger)] hover:text-[var(--accent-danger)] cursor-pointer"
                                            title="Deletar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    {photo.visibility === 'public' && (
                                        <div className="absolute top-2 left-2">
                                            <Globe size={12} className="text-[var(--accent-success)]" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Lightbox do PrivateGallery */}
                <AnimatePresence>
                    {selectedPhoto && (
                        <PhotoLightbox
                            photo={selectedPhoto}
                            onClose={() => setSelectedPhoto(null)}
                            onPhotoUpdate={(updated) => {
                                setSelectedPhoto(updated);
                                setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Upload Modal */}
                <AnimatePresence>
                    {pendingUploads.length > 0 && (
                        <PhotoUploadModal
                            files={pendingUploads}
                            onClose={() => setPendingUploads([])}
                            onUpload={handleConfirmUpload}
                            isUploading={uploading}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ===== FOLDER LIST =====
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Minha Galeria</h1>
                <GlassButton variant="primary" onClick={() => setShowNewFolder(true)}>
                    <span className="flex items-center gap-2">
                        <FolderPlus size={16} />
                        Nova Pasta
                    </span>
                </GlassButton>
            </div>

            {/* New Folder Input */}
            <AnimatePresence>
                {showNewFolder && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                    >
                        <GlassCard className="p-4 flex gap-3 items-end">
                            <div className="flex-1">
                                <GlassInput
                                    label="Nome da Pasta"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                    placeholder="Ex: Screenshots, Builds..."
                                />
                            </div>
                            <GlassButton onClick={handleCreateFolder} className="mb-0.5">Criar</GlassButton>
                            <GlassButton variant="secondary" onClick={() => setShowNewFolder(false)} className="mb-0.5">
                                <X size={16} />
                            </GlassButton>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={28} className="animate-spin text-white/30" />
                </div>
            ) : folders.length === 0 ? (
                <GlassCard className="text-center py-12">
                    <Camera size={40} className="mx-auto mb-4 text-white/30" />
                    <h2 className="text-lg font-semibold text-white/70 mb-2">Sua galeria está vazia</h2>
                    <p className="text-sm text-white/40">
                        Crie uma pasta para organizar suas fotos! 🖼️
                    </p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {folders.map((folder) => (
                        <motion.div
                            key={folder.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={spring}
                            className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 cursor-pointer hover:border-white/20 transition-colors group"
                            onClick={() => {
                                if (editingFolder !== folder.id) setCurrentFolder(folder);
                            }}
                        >
                            {/* Cover — overflow apenas na capa para manter cantos */}
                            <div className="aspect-video bg-white/[0.02] flex items-center justify-center overflow-hidden rounded-t-[var(--radius-lg)]">
                                {folder.cover_url ? (
                                    <img src={folder.cover_url} alt={folder.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Folder size={32} className="text-white/15" />
                                )}
                            </div>

                            {/* Info — área do nome e menu (dropdown abre acima, fora do card) */}
                            <div className="relative p-3 flex items-center gap-2 rounded-b-[var(--radius-lg)]">
                                {editingFolder === folder.id ? (
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.id)}
                                        onBlur={() => handleRenameFolder(folder.id)}
                                        className="flex-1 bg-transparent text-sm text-white/90 outline-none border-b border-white/20"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <>
                                        <Folder size={14} className="text-white/30 shrink-0" />
                                        <span className="text-sm font-medium text-white/80 truncate flex-1">
                                            {folder.name}
                                        </span>
                                        <span className="text-[10px] text-white/30">{folder.photo_count}</span>
                                    </>
                                )}

                                {/* Menu: dropdown abre para cima (bottom-full) para não sobrepor o card */}
                                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={() => setMenuOpen(menuOpen === folder.id ? null : folder.id)}
                                        className="w-7 h-7 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-white/0 group-hover:text-white/30 transition-colors cursor-pointer"
                                        aria-label="Abrir menu da pasta"
                                    >
                                        <MoreHorizontal size={14} />
                                    </button>
                                    {menuOpen === folder.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute right-0 bottom-full mb-1 glass-popup rounded-[var(--radius-sm)] border border-white/10 py-1 z-[100] min-w-[130px] shadow-xl"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingFolder(folder.id);
                                                    setEditName(folder.name);
                                                    setMenuOpen(null);
                                                }}
                                                className="w-full px-3 py-2 text-xs text-white/90 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                                            >
                                                <Pencil size={12} /> Renomear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteFolder(folder.id)}
                                                className="w-full px-3 py-2 text-xs text-[var(--accent-danger)] hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                                            >
                                                <Trash2 size={12} /> Deletar
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
