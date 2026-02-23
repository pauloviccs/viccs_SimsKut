import { supabase } from './supabaseClient';
import type { Family, Sim, SimTrait } from '@/types';

/**
 * familyService — Backend das Famílias Sims.
 * Imagina como o Create-a-Sim: cadastra, edita e gerencia seus personagens.
 */

// ======== FAMÍLIAS ========

export async function getFamilies(userId: string): Promise<Family[]> {
    const { data, error } = await supabase
        .from('families')
        .select('*, sims(count)')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((f: any) => ({
        ...f,
        sims_count: f.sims?.[0]?.count ?? 0,
    }));
}

export async function createFamily(userId: string, name: string): Promise<Family> {
    const { data, error } = await supabase
        .from('families')
        .insert({ owner_id: userId, family_name: name.trim() })
        .select()
        .single();

    if (error) throw error;
    return { ...data, sims_count: 0 };
}

export async function deleteFamily(familyId: string): Promise<void> {
    const { error } = await supabase.from('families').delete().eq('id', familyId);
    if (error) throw error;
}

// ======== SIMS ========

export async function getSims(familyId: string): Promise<Sim[]> {
    const { data, error } = await supabase
        .from('sims')
        .select('*, traits:sim_traits(*)')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createSim(
    familyId: string,
    sim: { name: string; photo_url?: string; profession?: string; bio?: string }
): Promise<Sim> {
    const { data, error } = await supabase
        .from('sims')
        .insert({
            family_id: familyId,
            name: sim.name.trim(),
            photo_url: sim.photo_url || null,
            profession: sim.profession?.trim() || null,
            bio: sim.bio?.trim() || null,
        })
        .select()
        .single();

    if (error) throw error;
    return { ...data, traits: [] };
}

export async function updateSim(
    simId: string,
    updates: { name?: string; photo_url?: string; profession?: string; bio?: string }
): Promise<void> {
    const clean: Record<string, unknown> = {};
    if (updates.name !== undefined) clean.name = updates.name.trim();
    if (updates.photo_url !== undefined) clean.photo_url = updates.photo_url;
    if (updates.profession !== undefined) clean.profession = updates.profession.trim() || null;
    if (updates.bio !== undefined) clean.bio = updates.bio.trim() || null;

    const { error } = await supabase.from('sims').update(clean).eq('id', simId);
    if (error) throw error;
}

export async function deleteSim(simId: string): Promise<void> {
    const { error } = await supabase.from('sims').delete().eq('id', simId);
    if (error) throw error;
}

// ======== TRAITS ========

export async function addTrait(
    simId: string,
    traitType: 'quality' | 'skill',
    value: string,
    level = 1
): Promise<SimTrait> {
    const { data, error } = await supabase
        .from('sim_traits')
        .insert({ sim_id: simId, trait_type: traitType, value: value.trim(), level })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeTrait(traitId: string): Promise<void> {
    const { error } = await supabase.from('sim_traits').delete().eq('id', traitId);
    if (error) throw error;
}
