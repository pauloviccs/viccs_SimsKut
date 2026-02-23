import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '❌ VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas.\n' +
        '→ Local: crie o arquivo .env.local com as chaves\n' +
        '→ Vercel: adicione as variáveis em Settings → Environment Variables'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
