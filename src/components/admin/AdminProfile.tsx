import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Camera } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarCropper } from '@/components/settings/AvatarCropper';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';
import { uploadAvatar, updateProfileAvatar } from '@/lib/avatarService';
import { fetchProfile } from '@/lib/authService';

export function AdminProfile() {
    const { profile, user, setProfile } = useAuthStore();
    const [username, setUsername] = useState(profile?.username || '');
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Campos de senha
    const [newPassword, setNewPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');

    // Avatar
    const [cropFile, setCropFile] = useState<File | null>(null);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    username,
                    display_name: displayName,
                    bio,
                })
                .eq('id', user?.id)
                .select()
                .single();

            if (error) throw error;
            setProfile(data);
            setMessage('✅ Perfil salvo com sucesso!');
        } catch (err) {
            console.error(err);
            setMessage('❌ Erro ao salvar perfil');
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        if (newPassword.length < 8) {
            setPasswordMessage('Senha deve ter pelo menos 8 caracteres');
            return;
        }

        setPasswordSaving(true);
        setPasswordMessage('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) throw error;
            setPasswordMessage('✅ Senha alterada com sucesso!');
            setNewPassword('');
        } catch (err) {
            console.error(err);
            setPasswordMessage('❌ Erro ao alterar senha');
        } finally {
            setPasswordSaving(false);
        }
    }

    // === Avatar handlers (mesma lógica do SettingsPage) ===
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setMessage('❌ Selecione um arquivo de imagem.');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setMessage('❌ Imagem muito grande. Máximo 10MB.');
                return;
            }
            setCropFile(file);
        }
        e.target.value = '';
    };

    const handleCropComplete = async (blob: Blob) => {
        if (!user) return;
        setCropFile(null);
        setSavingAvatar(true);
        setMessage('');

        try {
            const url = await uploadAvatar(user.id, blob);
            await updateProfileAvatar(user.id, url);

            // Atualiza o store — sincroniza avatar em toda a app
            const newProfile = await fetchProfile(user.id);
            if (newProfile) setProfile(newProfile);

            setMessage('✅ Foto de perfil atualizada!');
        } catch (err) {
            console.error('Avatar upload error:', err);
            setMessage('❌ Erro ao salvar foto. Tente novamente.');
        } finally {
            setSavingAvatar(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Info */}
                <GlassCard variant="premium" className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative group">
                            <Avatar
                                src={profile?.avatar_url}
                                alt={displayName || username || 'Admin'}
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
                        <div>
                            <p className="font-bold">{displayName || username}</p>
                            <p className="text-xs text-white/35">
                                {user?.email}
                            </p>
                            {savingAvatar && (
                                <p className="text-xs text-[var(--accent-primary)] mt-1">
                                    Salvando foto...
                                </p>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
                        <GlassInput
                            label="Nome de Usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <GlassInput
                            label="Nome de Exibição"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                        <GlassInput
                            label="Bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />

                        {message && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-white/60"
                            >
                                {message}
                            </motion.p>
                        )}

                        <GlassButton type="submit" isLoading={saving} className="w-full mt-2">
                            <span className="flex items-center justify-center gap-2">
                                <Save size={16} />
                                Salvar Perfil
                            </span>
                        </GlassButton>
                    </form>
                </GlassCard>

                {/* Change Password */}
                <GlassCard variant="premium" className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Alterar Senha</h2>

                    <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                        <GlassInput
                            label="Nova Senha"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />

                        {passwordMessage && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-white/60"
                            >
                                {passwordMessage}
                            </motion.p>
                        )}

                        <GlassButton
                            type="submit"
                            variant="secondary"
                            isLoading={passwordSaving}
                            className="w-full mt-2"
                        >
                            Alterar Senha
                        </GlassButton>
                    </form>
                </GlassCard>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Avatar Cropper Modal */}
            {cropFile && (
                <AvatarCropper
                    file={cropFile}
                    onCrop={handleCropComplete}
                    onCancel={() => setCropFile(null)}
                />
            )}
        </div>
    );
}
