import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ImagePlus, Loader2 } from 'lucide-react';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';

interface PhotoUploadModalProps {
    files: File[];
    onClose: () => void;
    onUpload: (title: string, description: string) => Promise<void>;
    isUploading: boolean;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function PhotoUploadModal({ files, onClose, onUpload, isUploading }: PhotoUploadModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (files.length > 0) {
            const url = URL.createObjectURL(files[0]);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [files]);

    const handleSave = async () => {
        if (!title.trim()) return;
        await onUpload(title, description);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={!isUploading ? onClose : undefined}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={spring}
                className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-6 w-full max-w-md relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-white/90">
                        {files.length > 1 ? `Upload de ${files.length} Fotos` : 'Upload de Foto'}
                    </h3>
                    <button
                        onClick={!isUploading ? onClose : undefined}
                        disabled={isUploading}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/40 cursor-pointer disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                {previewUrl && (
                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/40 mb-5 relative flex items-center justify-center">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover opacity-80"
                        />
                        {files.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-sm font-medium text-white/90">
                                    + {files.length - 1} foto(s)
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    <GlassInput
                        label="Título da Foto"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Minha casa nova!"
                        disabled={isUploading}
                        maxLength={60}
                    />

                    <div>
                        <label className="text-[10px] font-medium text-[var(--accent-primary)] mb-1 block ml-1">
                            Descrição e Hashtags
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Conte mais sobre essa foto... #Sims #Construção"
                            className="w-full min-h-[100px] px-4 py-3 bg-white/[0.05] border border-white/12 rounded-[var(--radius-sm)] text-white text-sm backdrop-blur-md outline-none focus:border-[var(--accent-primary)]/50 resize-none transition-colors"
                            maxLength={500}
                            disabled={isUploading}
                        />
                        <div className="text-right mt-1">
                            <span className="text-[10px] text-white/30">
                                {description.length}/500
                            </span>
                        </div>
                    </div>

                    <GlassButton
                        onClick={handleSave}
                        isLoading={isUploading}
                        disabled={!title.trim() || isUploading}
                        className="w-full"
                    >
                        <span className="flex items-center gap-2">
                            {isUploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <ImagePlus size={16} />
                                    Publicar na Galeria
                                </>
                            )}
                        </span>
                    </GlassButton>
                </div>
            </motion.div>
        </motion.div>
    );
}
