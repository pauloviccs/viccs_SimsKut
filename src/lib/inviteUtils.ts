/**
 * Gera um código de convite único no formato SIMS-XXXX-XXXX
 * Análogo a: um ticket de loteria — único, aleatório, impossível de adivinhar.
 *
 * Caracteres excluídos: I, O, 1, 0 (confusão visual)
 */
export function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = (len: number) =>
        Array.from(
            { length: len },
            () => chars[Math.floor(Math.random() * chars.length)]
        ).join('');
    return `SIMS-${segment(4)}-${segment(4)}`;
}

/**
 * Valida o formato de um código de convite
 */
export function isValidInviteFormat(code: string): boolean {
    return /^SIMS-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code);
}
