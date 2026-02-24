import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * renderMentions — Transforma @username em links clicáveis.
 * Imagina como o Instagram: o @username fica azulzinho e clicável.
 * Recebe texto puro, retorna array de ReactNodes (mix de strings + Links).
 */

const MENTION_REGEX = /@([a-zA-Z0-9_#]+)/g;

export function renderMentions(text: string): ReactNode[] {
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset regex index
    MENTION_REGEX.lastIndex = 0;

    while ((match = MENTION_REGEX.exec(text)) !== null) {
        // Texto antes do @
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const username = match[1];
        parts.push(
            <Link
                key={`mention-${match.index}`}
                to={`/profile/${encodeURIComponent(username)}`}
                className="text-[var(--accent-primary)] hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
            >
                @{username}
            </Link>
        );

        lastIndex = match.index + match[0].length;
    }

    // Texto restante após o último @
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
}
