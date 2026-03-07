import { useState } from 'react';
import { FileImage, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../../ui/GlassCard';
import { GlassButton } from '../../ui/GlassButton';

interface MilestoneUploadModalProps {
    milestoneTitle: string;
    onClose: () => void;
    onSubmit: (media1: File, media2?: File, note?: string) => Promise<void>;
}

export function MilestoneUploadModal({ milestoneTitle, onClose, onSubmit }: MilestoneUploadModalProps) {
    const [file1, setFile1] = useState<File | null>(null);
    const [file2, setFile2] = useState<File | null>(null);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError('Arquivo excede o limite de 10MB.');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(file.type)) {
            setError('Formato não suportado. Use JPG, PNG, WEBP, MP4 ou WEBM.');
            return;
        }

        setError(null);
        setFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file1) {
            setError('A primeira mídia é obrigatória.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            await onSubmit(file1, file2 || undefined, note);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer upload. Tente novamente.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg"
            >
                <GlassCard className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-white/5">
                        <h2 className="text-xl font-bold text-white mb-1">Registrar Conquista</h2>
                        <p className="text-sm text-white/60">{milestoneTitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-2 items-center text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Midia 1 */}
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Primeira mídia (Obrigatória)
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors overflow-hidden relative">
                                    {file1 ? (
                                        <div className="absolute inset-0 p-4 flex items-center justify-center text-center bg-black/40">
                                            <p className="text-sm text-white font-medium break-all">{file1.name}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <FileImage className="w-8 h-8 text-white/40 mb-2" />
                                            <p className="text-xs text-white/60 text-center">
                                                Arraste ou clique para selecionar<br />
                                                <span className="text-[10px]">Máx 10MB (JPG/PNG/WEBP/MP4)</span>
                                            </p>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(e) => handleFileChange(e, setFile1)} />
                                </label>
                            </div>

                            {/* Midia 2 */}
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Segunda mídia (Opcional)
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-white/10 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors overflow-hidden relative">
                                    {file2 ? (
                                        <div className="absolute inset-0 p-4 flex items-center justify-center text-center bg-black/40">
                                            <p className="text-sm text-white font-medium break-all">{file2.name}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center">
                                            <p className="text-xs text-white/40">Adicionar evidência extra</p>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(e) => handleFileChange(e, setFile2)} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Nota (Opcional)</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none custom-scrollbar"
                                placeholder="Conte algo sobre essa etapa..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <GlassButton type="button" onClick={onClose} variant="ghost" disabled={isSubmitting}>
                                Cancelar
                            </GlassButton>
                            <GlassButton type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-500 border-none">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Conquista'}
                            </GlassButton>
                        </div>
                    </form>
                </GlassCard>
            </motion.div>
        </div>
    );
}
