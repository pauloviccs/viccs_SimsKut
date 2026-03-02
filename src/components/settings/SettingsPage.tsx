import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Save, AlertTriangle, User, Hash, Palette, RotateCcw, Bell } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarCropper } from './AvatarCropper';
import { ZenGradientPicker } from './ZenGradientPicker';
import { useAuthStore } from '@/store/authStore';
import { uploadAvatar, updateProfileAvatar, updateProfileInfo } from '@/lib/avatarService';
import { useNavigate } from 'react-router-dom';
import { fetchProfile, signOut } from '@/lib/authService';
import { useThemeStore } from '@/store/themeStore';
import { normalizeZenThemeConfig, REFERENCE_DARK_MODE_THEME } from '@/store/themeStore';
import { ensureNotificationPermission, subscribeToPush } from '@/lib/pushClient';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

/**
 * SettingsPage — Painel de configurações do perfil.
 * Imagina como o vestiário do jogo: onde você customiza seu avatar e nome.
 */
export function SettingsPage() {
    const { user, profile, setProfile, logout } = useAuthStore();
    const theme = useThemeStore((s) => s.theme);
    const resetTheme = useThemeStore((s) => s.resetTheme);
    const setTheme = useThemeStore((s) => s.setTheme);
    const navigate = useNavigate();

    // Form state
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [username, setUsername] = useState(() => {
        const full = profile?.username || '';
        const hashIndex = full.lastIndexOf('#');
        return hashIndex > 0 ? full.substring(0, hashIndex) : full;
    });
    const [tag, setTag] = useState(() => {
        const full = profile?.username || '';
        const hashIndex = full.lastIndexOf('#');
        return hashIndex > 0 ? full.substring(hashIndex + 1) : '';
    });

    // UI state
    const [saving, setSaving] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [zenMessage, setZenMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [notifMessage, setNotifMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
    const [cropFile, setCropFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotifPermission(Notification.permission);
        }
    }, []);

    const tagAlreadyChanged = profile?.tag_changed ?? false;

    // === Avatar Upload ===
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validação básica
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Selecione um arquivo de imagem.' });
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Imagem muito grande. Máximo 10MB.' });
                return;
            }
            setCropFile(file);
        }
        // Reset input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
    };

    const handleCropComplete = async (blob: Blob) => {
        if (!user) return;
        setCropFile(null);
        setSavingAvatar(true);
        setMessage(null);

        try {
            const url = await uploadAvatar(user.id, blob);
            await updateProfileAvatar(user.id, url);

            // Atualiza o store
            const newProfile = await fetchProfile(user.id);
            if (newProfile) setProfile(newProfile);

            setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
        } catch (err) {
            console.error('Avatar upload error:', err);
            setMessage({ type: 'error', text: 'Erro ao salvar foto. Tente novamente.' });
        } finally {
            setSavingAvatar(false);
        }
    };

    // === Profile Info Save ===
    const handleSaveInfo = async () => {
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            const newUsername = tag ? `${username}#${tag}` : username;
            const hasTagChanged = !tagAlreadyChanged && tag !== getOriginalTag();

            const updateData: Record<string, unknown> = {
                display_name: displayName.trim(),
                username: newUsername.trim(),
            };

            if (hasTagChanged && tag) {
                updateData.tag_changed = true;
            }

            await updateProfileInfo(user.id, updateData as any);

            // Atualiza o store
            const newProfile = await fetchProfile(user.id);
            if (newProfile) setProfile(newProfile);

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (err) {
            console.error('Profile update error:', err);
            setMessage({ type: 'error', text: 'Erro ao salvar. Tente novamente.' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            logout();
            await signOut();
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const handleSaveZenBackground = async () => {
        if (!user) return;
        setZenMessage(null);
        try {
            // Sempre reativar o fundo Zen ao aplicar pelo picker (permite voltar do Dark Mode sólido)
            const themeToSave = { ...theme, enabled: true };
            setTheme(themeToSave);
            await updateProfileInfo(user.id, { zen_background: themeToSave });
            const newProfile = await fetchProfile(user.id);
            if (newProfile) {
                setProfile(newProfile);
                if (newProfile.zen_background) {
                    useThemeStore.getState().setTheme(normalizeZenThemeConfig(newProfile.zen_background));
                }
            }
            setZenMessage({ type: 'success', text: 'Fundo Zen aplicado e salvo!' });
        } catch (err) {
            console.error('Zen background save error:', err);
            setZenMessage({ type: 'error', text: 'Erro ao salvar fundo. Tente novamente.' });
        }
    };

    const handleToggleNotifications = async () => {
        setNotifMessage(null);
        setNotifLoading(true);
        try {
            const perm = await ensureNotificationPermission();
            setNotifPermission(perm);
            if (perm === 'granted') {
                const ok = await subscribeToPush();
                if (ok) {
                    setNotifMessage({ type: 'success', text: 'Notificações ativadas! Você receberá avisos mesmo com o app fechado.' });
                } else {
                    setNotifMessage({ type: 'success', text: 'Notificações ativadas para esta aba.' });
                }
            } else if (perm === 'denied') {
                setNotifMessage({ type: 'error', text: 'Permissão negada. Habilite nas configurações do navegador.' });
            }
        } catch (err) {
            console.error('Notification permission error:', err);
            setNotifMessage({ type: 'error', text: 'Não foi possível ativar. Tente novamente.' });
        } finally {
            setNotifLoading(false);
        }
    };

    const handleResetToDefaultBackground = async () => {
        if (!user) return;
        setZenMessage(null);
        try {
            resetTheme();
            await updateProfileInfo(user.id, { zen_background: REFERENCE_DARK_MODE_THEME });
            const newProfile = await fetchProfile(user.id);
            if (newProfile) setProfile(newProfile);
            setZenMessage({ type: 'success', text: 'Fundo restaurado para o padrão (Dark Mode).' });
        } catch (err) {
            console.error('Reset background error:', err);
            setZenMessage({ type: 'error', text: 'Erro ao restaurar fundo. Tente novamente.' });
        }
    };

    function getOriginalTag(): string {
        const full = profile?.username || '';
        const hashIndex = full.lastIndexOf('#');
        return hashIndex > 0 ? full.substring(hashIndex + 1) : '';
    }

    return (
        <div className="space-y-6">
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold"
            >
                Configurações
            </motion.h1>

            {/* === Avatar Section === */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.1 }}
            >
                <GlassCard className="p-6">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-white/80">
                        <Camera size={18} className="text-[var(--accent-primary)]" />
                        Foto de Perfil
                    </h2>

                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <Avatar
                                src={profile?.avatar_url}
                                alt={profile?.display_name || 'User'}
                                size="xl"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={savingAvatar}
                                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                            >
                                <Camera size={22} className="text-white/80" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <GlassButton
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                                isLoading={savingAvatar}
                                className="text-sm"
                            >
                                {savingAvatar ? 'Salvando...' : 'Trocar Foto'}
                            </GlassButton>
                            <p className="text-[11px] text-white/30">
                                JPG, PNG ou WebP. Máx. 10MB. Será recortada em 300×300.
                            </p>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </GlassCard>
            </motion.div>

            {/* === Profile Info Section === */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.2 }}
            >
                <GlassCard className="p-6">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-white/80">
                        <User size={18} className="text-[var(--accent-primary)]" />
                        Informações do Perfil
                    </h2>

                    <div className="space-y-4">
                        <GlassInput
                            label="Nome de Exibição"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Seu nome visível no SimsKut"
                        />

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <GlassInput
                                    label="Usuário"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="simskuter"
                                />
                            </div>
                            <div className="w-[120px]">
                                <GlassInput
                                    label={
                                        <span className="flex items-center gap-1">
                                            <Hash size={12} />
                                            Tag
                                        </span>
                                    }
                                    value={tag}
                                    onChange={(e) => {
                                        // Só números, max 4 dígitos
                                        const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setTag(clean);
                                    }}
                                    placeholder="0001"
                                    disabled={tagAlreadyChanged}
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        {tagAlreadyChanged && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/20"
                            >
                                <AlertTriangle size={14} className="text-[var(--accent-warning)] mt-0.5 shrink-0" />
                                <p className="text-xs text-[var(--accent-warning)]/80">
                                    Sua tag já foi alterada anteriormente. Não é possível alterar novamente.
                                </p>
                            </motion.div>
                        )}

                        {/* Message */}
                        {message && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-xs px-4 py-2.5 rounded-lg ${message.type === 'success'
                                    ? 'text-[var(--accent-success)] bg-[var(--accent-success)]/10'
                                    : 'text-[var(--accent-danger)] bg-[var(--accent-danger)]/10'
                                    }`}
                            >
                                {message.text}
                            </motion.p>
                        )}

                        <GlassButton
                            onClick={handleSaveInfo}
                            isLoading={saving}
                            className="w-full mt-2"
                        >
                            <span className="flex items-center gap-2">
                                <Save size={16} />
                                Salvar Alterações
                            </span>
                        </GlassButton>
                    </div>
                </GlassCard>
            </motion.div>

            {/* === Aparência & Customização (Zen Gradient) === */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.25 }}
            >
                <GlassCard className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h2 className="text-base font-semibold flex items-center gap-2 text-white/80">
                            <Palette size={18} className="text-[var(--accent-primary)]" />
                            Aparência & Customização
                        </h2>
                        <button
                            type="button"
                            onClick={handleResetToDefaultBackground}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/15 hover:border-white/25 transition-all duration-200"
                            title="Restaurar fundo padrão (Dark Mode)"
                        >
                            <RotateCcw size={14} strokeWidth={2} />
                            Retornar ao Dark Mode
                        </button>
                    </div>
                    <p className="text-sm text-white/50 mb-4">
                        Personalize o fundo do aplicativo (apenas na versão Desktop).
                    </p>
                    <ZenGradientPicker onSave={handleSaveZenBackground} />
                    {zenMessage && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-xs mt-3 px-4 py-2.5 rounded-lg ${zenMessage.type === 'success'
                                ? 'text-[var(--accent-success)] bg-[var(--accent-success)]/10'
                                : 'text-[var(--accent-danger)] bg-[var(--accent-danger)]/10'
                                }`}
                        >
                            {zenMessage.text}
                        </motion.p>
                    )}
                </GlassCard>
            </motion.div>

            {/* === Notificações === */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.3 }}
            >
                <GlassCard className="p-6">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-white/80">
                        <Bell size={18} className="text-[var(--accent-primary)]" />
                        Notificações
                    </h2>
                    <p className="text-sm text-white/50 mb-4">
                        Receba avisos quando alguém curtir, comentar ou interagir com seu conteúdo, mesmo com o app fechado.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <button
                            type="button"
                            onClick={handleToggleNotifications}
                            disabled={notifLoading || notifPermission === 'granted'}
                            className={`
                                inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                                transition-all duration-200 cursor-pointer
                                ${notifPermission === 'granted'
                                    ? 'bg-[var(--accent-success)]/20 text-[var(--accent-success)] border border-[var(--accent-success)]/30 cursor-default'
                                    : 'bg-white/10 text-white/90 hover:bg-white/15 border border-white/20 hover:border-white/30'
                                }
                                disabled:opacity-70 disabled:cursor-not-allowed
                            `}
                        >
                            <Bell size={16} />
                            {notifPermission === 'granted'
                                ? 'Notificações ativadas'
                                : notifLoading
                                    ? 'Ativando...'
                                    : 'Ativar notificações do sistema'
                            }
                        </button>
                        {notifPermission === 'denied' && (
                            <p className="text-xs text-white/40">
                                Permissão bloqueada. Abra as configurações do site no navegador para permitir.
                            </p>
                        )}
                    </div>
                    {notifMessage && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-xs mt-3 px-4 py-2.5 rounded-lg ${notifMessage.type === 'success'
                                ? 'text-[var(--accent-success)] bg-[var(--accent-success)]/10'
                                : 'text-[var(--accent-danger)] bg-[var(--accent-danger)]/10'
                                }`}
                        >
                            {notifMessage.text}
                        </motion.p>
                    )}
                </GlassCard>
            </motion.div>

            {/* === Avatar Cropper Modal === */}
            {cropFile && (
                <AvatarCropper
                    file={cropFile}
                    onCrop={handleCropComplete}
                    onCancel={() => setCropFile(null)}
                />
            )}

            {/* === Mobile Logout Button === */}
            <div className="md:hidden mt-8">
                <GlassButton
                    variant="danger"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2"
                >
                    <AlertTriangle size={18} />
                    Sair da Conta
                </GlassButton>
            </div>
        </div>
    );
}
