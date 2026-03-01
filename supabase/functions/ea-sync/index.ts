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

// Base aproximada — substitua pelos endpoints reais da EA Gallery.
const EA_GALLERY_BASE_URL = "https://gallery.services.ea.com/api";

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
  // TODO: ajuste a URL e o shape do JSON conforme a API real.
  const url = `${EA_GALLERY_BASE_URL}/search?eaId=${encodeURIComponent(eaId)}`;
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

  const json = await res.json();
  const items: any[] = Array.isArray(json?.items) ? json.items : [];
  return items.map(normalizeEaItem);
}

async function fetchEaDetails(
  eaId: string,
  itemId: string
): Promise<NormalizedEaItem> {
  // TODO: ajuste a URL de detalhes conforme a API real.
  const url = `${EA_GALLERY_BASE_URL}/items/${encodeURIComponent(
    itemId
  )}?eaId=${encodeURIComponent(eaId)}`;
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

function normalizeEaItem(raw: any): NormalizedEaItem {
  // Tenta mapear campos comuns; ajuste conforme o shape real do JSON da EA.
  const id =
    raw?.id ??
    raw?.itemId ??
    raw?.item_id ??
    raw?.gallery_id ??
    crypto.randomUUID();

  const title =
    raw?.title ??
    raw?.name ??
    raw?.lotName ??
    raw?.displayName ??
    "Sem título";

  const thumb =
    raw?.thumbnailUrl ??
    raw?.thumbnail_url ??
    raw?.images?.[0]?.url ??
    null;

  const packs =
    raw?.packs ??
    raw?.packs_needed ??
    raw?.dlcs ??
    raw?.expansions ??
    null;

  const comments =
    raw?.comments ??
    raw?.original_comments ??
    raw?.commentThread ??
    null;

  const downloads =
    typeof raw?.downloadCount === "number"
      ? raw.downloadCount
      : typeof raw?.downloads === "number"
      ? raw.downloads
      : null;

  const favorites =
    typeof raw?.favoriteCount === "number"
      ? raw.favoriteCount
      : typeof raw?.favorites === "number"
      ? raw.favorites
      : null;

  return {
    ea_original_id: String(id),
    title,
    thumbnail_url: thumb,
    packs_needed: packs,
    original_comments: comments,
    download_count: downloads,
    favorite_count: favorites,
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

