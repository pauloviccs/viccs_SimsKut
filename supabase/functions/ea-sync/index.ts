// Supabase Edge Function: ea-sync
// Proxy para a The Sims 4 Gallery (EA) com normalização dos dados.
// Importante: ajuste as URLs/formatos da API da EA conforme sua engenharia reversa.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Base real da API da Sims 4 Gallery (descoberta via DevTools).
const EA_GALLERY_BASE_URL = "https://thesims-api.ea.com";

type NormalizedEaItem = {
  ea_original_id: string;
  title: string;
  thumbnail_url: string | null;
  packs_needed: unknown;
  original_comments: unknown;
  download_count: number | null;
  favorite_count: number | null;
};

type DeepFetchRequest = {
  eaId: string;
  itemIds: string[];
};

async function getSupabaseUser(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[ea-sync] SUPABASE_URL ou SUPABASE_ANON_KEY não configurados no ambiente."
    );
    return { user: null, error: new Error("Supabase env vars missing") };
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  return { user, error };
}

async function fetchEaList(eaId: string): Promise<NormalizedEaItem[]> {
  // Por enquanto usamos o feed público de destaques (staff-picks).
  // O parâmetro eaId é ignorado até mapeamos o endpoint oficial de busca por EA ID.
  const url = `${EA_GALLERY_BASE_URL}/pt_BR/api/gallery/v1/feeds/staff-picks`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SimsKutBot/1.0; +https://simskut.example)",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error("[ea-sync] Erro ao buscar lista da EA:", res.status, res.statusText);
    throw new Error("EA list request failed");
  }

  const outer = await res.json();

  let payload: any;
  try {
    payload =
      typeof outer?.data === "string" ? JSON.parse(outer.data) : outer?.data ?? {};
  } catch (e) {
    console.error("[ea-sync] Falha ao fazer JSON.parse do campo data do feed:", e);
    throw new Error("EA list payload parse failed");
  }

  const results: any[] =
    payload?.exchange?.getlistmsg?.results && Array.isArray(payload.exchange.getlistmsg.results)
      ? payload.exchange.getlistmsg.results
      : [];

  return results.map((entry) => normalizeEaItem(entry?.metadata ?? entry));
}

async function fetchEaDetails(
  eaId: string,
  itemId: string
): Promise<NormalizedEaItem> {
  // Endpoint real de detalhes por remoteId (household/sim/blueprint).
  const url = `${EA_GALLERY_BASE_URL}/pt_BR/api/gallery/v1/sims/${encodeURIComponent(
    itemId
  )}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SimsKutBot/1.0; +https://simskut.example)",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error(
      "[ea-sync] Erro ao buscar detalhes da EA:",
      res.status,
      res.statusText
    );
    throw new Error("EA details request failed");
  }

  const json = await res.json();
  return normalizeEaItem(json);
}

function buildEaThumbnailUrl(
  remoteId: string | undefined,
  thumbnailInfo: unknown,
  imageUriType: string | undefined
): string | null {
  if (!remoteId) return null;

  // A API expõe apenas remoteId + thumbnailInfo + imageUriType, mas o
  // padrão exato de URL pública não é documentado. Mantemos nulo por ora.
  return null;
}

function normalizeEaItem(raw: any): NormalizedEaItem {
  // A metadata vinda dos feeds fica em entry.metadata; no endpoint de detalhes,
  // o objeto já é diretamente a metadata.
  const meta = raw?.metadata ?? raw ?? {};

  const id =
    meta.remoteId ??
    meta.remote_id ??
    meta.id ??
    meta.uuid ??
    crypto.randomUUID();

  // Usa nome da criação quando disponível; caso contrário tenta cair para a descrição
  // ou hashtags para evitar "Sem título" genérico sempre.
  const descriptionText =
    (typeof meta.description === "string" && meta.description.trim().length > 0
      ? meta.description
      : typeof meta.metadata?.descriptionHashtags === "string"
      ? meta.metadata.descriptionHashtags
      : "") ?? "";

  const titleCandidate =
    (typeof meta.name === "string" && meta.name.trim().length > 0
      ? meta.name
      : typeof meta.title === "string" && meta.title.trim().length > 0
      ? meta.title
      : "") || "";

  const fallbackFromDescription =
    descriptionText
      .split(/[.#,\n]/)[0]
      .trim() || "";

  const title =
    titleCandidate ||
    fallbackFromDescription ||
    "Criação da The Sims 4 Gallery";

  const rawDownloads =
    meta.downloads ??
    meta.downloadCount ??
    meta.metadata?.downloads ??
    meta.metadata?.downloadCount;

  const rawFavorites =
    meta.favorites ??
    meta.favoriteCount ??
    meta.metadata?.favorites ??
    meta.metadata?.favoriteCount;

  const download_count = (() => {
    if (rawDownloads == null || rawDownloads === "") return null;
    const n = Number(rawDownloads);
    return Number.isFinite(n) ? n : null;
  })();

  const favorite_count = (() => {
    if (rawFavorites == null || rawFavorites === "") return null;
    const n = Number(rawFavorites);
    return Number.isFinite(n) ? n : null;
  })();

  const packs_needed = meta.metadata?.skuBits ?? null;

  const original_comments =
    meta.description ??
    meta.metadata?.descriptionHashtags ??
    null;

  const thumbnail_url = buildEaThumbnailUrl(
    meta.remoteId,
    meta.metadata?.xti?.thumbnailInfo,
    meta.imageUriType
  );

  return {
    ea_original_id: String(id),
    title,
    thumbnail_url,
    packs_needed,
    original_comments,
    download_count,
    favorite_count,
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    const { user, error } = await getSupabaseUser(req);
    if (error || !user) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // POST /deep-fetch → deep fetch de items específicos
    if (pathname.endsWith("/deep-fetch") && req.method === "POST") {
      const body = (await req.json()) as DeepFetchRequest;
      if (!body?.eaId || !Array.isArray(body.itemIds) || body.itemIds.length === 0) {
        return new Response(
          JSON.stringify({
            error: "Missing eaId or itemIds",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Enforce a hard limit de segurança (além dos 50 na camada de app)
      const uniqueIds = [...new Set(body.itemIds)].slice(0, 50);

      const items = await Promise.all(
        uniqueIds.map((id) => fetchEaDetails(body.eaId, id))
      );

      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /?eaId=SimGuruGeorge → lista leve de criações
    if (req.method === "GET") {
      const eaId = url.searchParams.get("eaId");
      if (!eaId) {
        return new Response(
          JSON.stringify({ error: "Missing eaId query param" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const items = await fetchEaList(eaId);
      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  } catch (err) {
    console.error("[ea-sync] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

