import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * renderMentions — Transforma @username em links clicáveis.
 * Imagina como o Instagram: o @username fica azulzinho e clicável.
 * Recebe texto puro, retorna array de ReactNodes (mix de strings + Links).
 */

const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;
const HASHTAG_REGEX = /#([a-zA-Z0-9_À-ÿ]+)/g;
/** URLs http(s); evita capturar pontuação final */
const URL_REGEX = /https?:\/\/[^\s\])\}>"']+/gi;

const MENTION_CLASS =
    'inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-white/5 border border-white/10 text-[var(--accent-primary)] hover:bg-white/10 hover:text-white transition-all font-medium whitespace-nowrap';

const HASHTAG_CLASS =
    'inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-white/5 border border-white/10 text-[var(--accent-primary)] hover:bg-white/10 hover:text-white transition-all font-medium whitespace-nowrap';

/** Link com comportamento spoiler: oculto até o usuário clicar para revelar */
function SpoilerLink({ url }: { url: string }) {
    const [revealed, setRevealed] = useState(false);

    if (revealed) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${MENTION_CLASS} break-all`}
                onClick={(e) => e.stopPropagation()}
            >
                {url}
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
            className="inline-flex items-center px-2 py-1 mx-0.5 rounded-md bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70 transition-all text-sm cursor-pointer"
            title="Clique para revelar o link"
        >
            🔗 Link oculto
        </button>
    );
}

type Segment =
    | { start: number; end: number; type: 'mention'; username: string }
    | { start: number; end: number; type: 'hashtag'; tag: string }
    | { start: number; end: number; type: 'url'; url: string };

function getSegments(text: string): Segment[] {
    const segments: Segment[] = [];

    let m: RegExpExecArray | null;

    MENTION_REGEX.lastIndex = 0;
    while ((m = MENTION_REGEX.exec(text)) !== null) {
        segments.push({ start: m.index, end: m.index + m[0].length, type: 'mention', username: m[1] });
    }

    HASHTAG_REGEX.lastIndex = 0;
    while ((m = HASHTAG_REGEX.exec(text)) !== null) {
        segments.push({ start: m.index, end: m.index + m[0].length, type: 'hashtag', tag: m[1] });
    }

    URL_REGEX.lastIndex = 0;
    while ((m = URL_REGEX.exec(text)) !== null) {
        segments.push({ start: m.index, end: m.index + m[0].length, type: 'url', url: m[0] });
    }

    segments.sort((a, b) => a.start - b.start);

    const merged: Segment[] = [];
    let lastEnd = 0;
    for (const seg of segments) {
        if (seg.start < lastEnd) continue;
        merged.push(seg);
        lastEnd = seg.end;
    }

    return merged;
}

/**
 * Renderiza conteúdo de post: @menções e #hashtags clicáveis + links como spoiler (revelar ao clicar).
 */
export function renderPostContent(text: string): ReactNode[] {
    const segments = getSegments(text);
    if (segments.length === 0) return [text];

    const parts: ReactNode[] = [];
    let lastIndex = 0;

    for (const seg of segments) {
        if (seg.start > lastIndex) {
            parts.push(text.slice(lastIndex, seg.start));
        }

        if (seg.type === 'mention') {
            parts.push(
                <Link
                    key={`mention-${seg.start}`}
                    to={`/profile/${encodeURIComponent(seg.username)}`}
                    className={MENTION_CLASS}
                    onClick={(e) => e.stopPropagation()}
                >
                    @{seg.username}
                </Link>
            );
        } else if (seg.type === 'hashtag') {
            parts.push(
                <Link
                    key={`hashtag-${seg.start}`}
                    to={`/community/hashtag/${encodeURIComponent(seg.tag)}`}
                    className={HASHTAG_CLASS}
                    onClick={(e) => e.stopPropagation()}
                >
                    #{seg.tag}
                </Link>
            );
        } else if (seg.type === 'url') {
            parts.push(<SpoilerLink key={`url-${seg.start}`} url={seg.url} />);
        }
        lastIndex = seg.end;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}

export function renderMentions(text: string): ReactNode[] {
    // Para renderMentions apenas da galeria, repassamos pro parser completo
    // Que agora unifica tanto menções quanto hashtags
    return renderPostContent(text);
}
