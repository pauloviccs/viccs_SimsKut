import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, LinkIcon, Award } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { GlassInput } from '@/components/ui/GlassInput';
import { AvatarCropper } from '@/components/settings/AvatarCropper';
import { BannerCropper } from '@/components/settings/BannerCropper';
import { useAuthStore } from '@/store/authStore';
import { uploadAvatar, updateProfileAvatar } from '@/lib/avatarService';
import { updateProfile, uploadBanner, updateProfileBanner } from '@/lib/profileService';
import { fetchUserBadges, updateFeaturedBadges } from '@/lib/challengeQueries';
import { toast } from 'sonner';
import type { Profile } from '@/types';
import type { UserBadge } from '@/types/challenges';

interface ProfileEditModalProps {
    profile: Profile;
    onClose: () => void;
    onSave: (updated: Partial<Profile>) => void;
}

export function ProfileEditModal({ profile, onClose, onSave }: ProfileEditModalProps) {
    const { user, setProfile: setAuthProfile, profile: authProfile } = useAuthStore();

    const [displayName, setDisplayName] = useState(profile.display_name || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || '');
    const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState(profile.banner_url);

    // Novas states para Título e Emblemas
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [selectedTitle, setSelectedTitle] = useState(profile.display_title || '');
    const [featuredBadgeIds, setFeaturedBadgeIds] = useState<string[]>([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarBlobUrlRef = useRef<string | null>(null);
    const bannerBlobUrlRef = useRef<string | null>(null);

    const [cropAvatarFile, setCropAvatarFile] = useState<File | null>(null);
    const [cropBannerFile, setCropBannerFile] = useState<File | null>(null);
    const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
    const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);

    useEffect(() => {
        if (user) {
            fetchUserBadges(user.id).then(badges => {
                setUserBadges(badges);
                setFeaturedBadgeIds(badges.filter(b => b.is_featured).map(b => b.id));
            }).catch(console.error);
        }

        return () => {
            if (avatarBlobUrlRef.current) URL.revokeObjectURL(avatarBlobUrlRef.current);
            if (bannerBlobUrlRef.current) URL.revokeObjectURL(bannerBlobUrlRef.current);
        };
    }, [user]);

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setError('Avatar: apenas JPG ou PNG');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Avatar: máximo 10 MB');
            return;
        }
        setCropAvatarFile(file);
        setError('');
        e.target.value = '';
    };

    const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setError('Banner: apenas JPG ou PNG');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Banner: máximo 10 MB');
            return;
        }
        setCropBannerFile(file);
        setError('');
        e.target.value = '';
    };

    const handleAvatarCrop = (blob: Blob) => {
        if (avatarBlobUrlRef.current) URL.revokeObjectURL(avatarBlobUrlRef.current);
        avatarBlobUrlRef.current = URL.createObjectURL(blob);
        setAvatarPreview(avatarBlobUrlRef.current);
        setAvatarBlob(blob);
        setCropAvatarFile(null);
    };

    const handleBannerCrop = (blob: Blob) => {
        if (bannerBlobUrlRef.current) URL.revokeObjectURL(bannerBlobUrlRef.current);
        bannerBlobUrlRef.current = URL.createObjectURL(blob);
        setBannerPreview(bannerBlobUrlRef.current);
        setBannerBlob(blob);
        setCropBannerFile(null);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setError('');

        try {
            // Validações
            if (displayName.length > 50) throw new Error('Nome: máximo 50 caracteres');
            if (bio.length > 160) throw new Error('Bio: máximo 160 caracteres');
            if (websiteUrl && websiteUrl.length > 100) throw new Error('URL: máximo 100 caracteres');
            if (websiteUrl && !/^https?:\/\/.+/.test(websiteUrl)) throw new Error('URL inválida (use http:// ou https://)');

            const updates: Partial<Profile> = {};

            // Upload avatar se mudou (blob já recortado)
            let newAvatarUrl = profile.avatar_url;
            if (avatarBlob) {
                newAvatarUrl = await uploadAvatar(user.id, avatarBlob);
                await updateProfileAvatar(user.id, newAvatarUrl);
                updates.avatar_url = newAvatarUrl;
            }

            // Upload banner se mudou (blob já recortado)
            let newBannerUrl = profile.banner_url;
            if (bannerBlob) {
                newBannerUrl = await uploadBanner(user.id, bannerBlob);
                await updateProfileBanner(user.id, newBannerUrl);
                updates.banner_url = newBannerUrl;
            }

            // Atualizar texto
            const textUpdates: any = {};
            if (displayName !== (profile.display_name || '')) textUpdates.display_name = displayName;
            if (bio !== (profile.bio || '')) textUpdates.bio = bio || null;
            if (websiteUrl !== (profile.website_url || '')) textUpdates.website_url = websiteUrl || null;
            if (selectedTitle !== (profile.display_title || '')) textUpdates.display_title = selectedTitle || null;

            if (Object.keys(textUpdates).length > 0) {
                await updateProfile(user.id, textUpdates);
                Object.assign(updates, textUpdates);
            }

            // Atualizar Badges
            await updateFeaturedBadges(user.id, featuredBadgeIds);

            // Atualizar estado
            if (Object.keys(updates).length > 0 || featuredBadgeIds.length >= 0) {
                onSave(updates);
                // Atualizar authStore para sincronizar Sidebar/Navbar
                if (authProfile && Object.keys(updates).length > 0) {
                    setAuthProfile({ ...authProfile, ...updates });
                }
            }

            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative glass-heavy rounded-[var(--radius-lg)] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 glass-heavy rounded-t-[var(--radius-lg)] flex items-center justify-between px-4 py-3 border-b border-white/[0.08] z-10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-white/60 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                            <h2 className="text-lg font-semibold text-white/90">Editar perfil</h2>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                        </button>
                    </div>

                    {/* Banner Preview */}
                    <div className="relative aspect-[3/1] cursor-pointer group" onClick={() => bannerInputRef.current?.click()}>
                        {bannerPreview ? (
                            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#007AFF]/30 via-[#5865F2]/20 to-[#34C759]/30" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={24} className="text-white" />
                        </div>
                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleBannerSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Avatar Preview */}
                    <div className="px-4 -mt-12">
                        <div
                            className="relative w-24 h-24 rounded-full border-4 border-[#0a0a0f] overflow-hidden cursor-pointer group"
                            onClick={() => avatarInputRef.current?.click()}
                        >
                            <Avatar
                                src={avatarPreview}
                                alt={displayName || profile.username}
                                size="xl"
                                className="w-full h-full !border-0"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleAvatarSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Form Fields */}
                    <div className="p-4 space-y-4 mt-2">
                        {/* Display Name */}
                        <div>
                            <label className="block text-xs text-white/40 mb-1">Nome de Exibição</label>
                            <GlassInput
                                value={displayName}
                                onChange={(e: any) => setDisplayName(e.target.value)}
                                maxLength={50}
                                placeholder="Seu nome"
                            />
                            <span className="text-[10px] text-white/30 mt-0.5 block text-right">
                                {displayName.length}/50
                            </span>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-xs text-white/40 mb-1">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={160}
                                rows={3}
                                placeholder="Conte sobre você 🎮"
                                className="w-full px-3 py-2 rounded-[var(--radius-sm)] bg-white/[0.06] border border-white/10 text-sm text-white/90 placeholder-white/30 resize-none focus:outline-none focus:border-[var(--accent-primary)]/40 transition-colors"
                            />
                            <span className="text-[10px] text-white/30 mt-0.5 block text-right">
                                {bio.length}/160
                            </span>
                        </div>

                        {/* Website */}
                        <div>
                            <label className="block text-xs text-white/40 mb-1 flex items-center gap-1">
                                <LinkIcon size={12} /> Website
                            </label>
                            <GlassInput
                                value={websiteUrl}
                                onChange={(e: any) => setWebsiteUrl(e.target.value)}
                                maxLength={100}
                                placeholder="https://meusite.com"
                            />
                        </div>

                        {/* Separador */}
                        <div className="h-px bg-white/5 my-4" />

                        {/* Title Selector */}
                        <div>
                            <label className="block text-xs text-amber-400/80 uppercase font-semibold tracking-wider mb-2 flex items-center gap-1">
                                <Award size={12} /> Título do Perfil
                            </label>
                            <select
                                value={selectedTitle || ''}
                                onChange={(e) => setSelectedTitle(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-white/[0.06] border border-white/10 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-[var(--accent-primary)]/40 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-[#0f0f13] text-white">Nenhum</option>
                                {Array.from(new Set(userBadges.map(b => b.badge_title))).map(title => (
                                    <option key={title} value={title} className="bg-[#0f0f13] text-white">
                                        {title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-white/40 mt-1.5">Escolha um título obtido em desafios para exibir em seu perfil.</p>
                        </div>

                        {/* Badges Selector */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs text-amber-400/80 uppercase font-semibold tracking-wider flex items-center gap-1">
                                    <Award size={12} /> Emblemas em Destaque
                                </label>
                                <span className="text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full">{featuredBadgeIds.length}/5</span>
                            </div>

                            {userBadges.length === 0 ? (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                                    <p className="text-xs text-white/50">Você ainda não completou nenhum desafio para ganhar emblemas.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {userBadges.map(badge => {
                                        const isSelected = featuredBadgeIds.includes(badge.id);
                                        return (
                                            <div
                                                key={badge.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setFeaturedBadgeIds(prev => prev.filter(id => id !== badge.id));
                                                    } else if (featuredBadgeIds.length < 5) {
                                                        setFeaturedBadgeIds(prev => [...prev, badge.id]);
                                                    } else {
                                                        toast.error('Você já selecionou o limite máximo de 5 emblemas.');
                                                    }
                                                }}
                                                className={`aspect-square rounded-xl overflow-hidden cursor-pointer transition-all border-2 relative
                                                    ${isSelected
                                                        ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-95'
                                                        : 'border-white/5 hover:border-white/20 opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <img src={badge.badge_image_url} alt={badge.badge_title} className="w-full h-full object-cover" />
                                                {isSelected && (
                                                    <div className="absolute top-1 right-1 w-3 h-3 bg-amber-400 rounded-full border border-[#0f0f13]" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-xs text-[var(--accent-danger)] bg-[var(--accent-danger)]/10 rounded-[var(--radius-sm)] px-3 py-2">
                                {error}
                            </p>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Recorte de avatar (mesmo componente da página de configuração) */}
            {cropAvatarFile && (
                <AvatarCropper
                    file={cropAvatarFile}
                    onCrop={handleAvatarCrop}
                    onCancel={() => setCropAvatarFile(null)}
                />
            )}

            {/* Recorte de banner (3:1) */}
            {cropBannerFile && (
                <BannerCropper
                    file={cropBannerFile}
                    onCrop={handleBannerCrop}
                    onCancel={() => setCropBannerFile(null)}
                />
            )}
        </AnimatePresence>
    );
}
