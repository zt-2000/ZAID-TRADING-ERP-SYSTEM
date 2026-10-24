import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseDiagnostics {
  publicConfigPresent: boolean;
  urlHost: string | null;
  clientInitialized: boolean;
  authHealthOk: boolean;
  hasActiveSession: boolean;
  sessionUserEmail: string | null;
  tableReadSuccess: boolean;
  tableReadError: string | null;
  testedTableName: string;
  activeStorageEngine: 'Local Persistent Store (Active)' | 'Supabase Cloud Database (Live)';
}

let supabaseInstance: SupabaseClient | null = null;

export const normalizeSupabaseUrl = (rawUrl: string | null | undefined): string | null => {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  const match = trimmed.match(/https?:\/\/[a-z0-9_-]+\.supabase\.co/i);
  if (match) return match[0];
  return trimmed;
};

export const getSupabaseConfig = () => {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL || null;
  const url = normalizeSupabaseUrl(rawUrl);
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || null;

  return {
    url,
    anonKey,
    hasConfig: Boolean(url && anonKey && !url.includes('your-project'))
  };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey, hasConfig } = getSupabaseConfig();
  if (!hasConfig || !url || !anonKey) return null;

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

/**
 * Runs a safe, non-destructive diagnostic check against the Supabase instance.
 * Never prints secrets, keys, or passwords.
 */
export const runSupabaseDiagnostics = async (): Promise<SupabaseDiagnostics> => {
  const { url, hasConfig } = getSupabaseConfig();

  let urlHost: string | null = null;
  if (url) {
    try {
      urlHost = new URL(url).host;
    } catch {
      urlHost = 'invalid-url';
    }
  }

  const result: SupabaseDiagnostics = {
    publicConfigPresent: hasConfig,
    urlHost,
    clientInitialized: false,
    authHealthOk: false,
    hasActiveSession: false,
    sessionUserEmail: null,
    tableReadSuccess: false,
    tableReadError: null,
    testedTableName: 'products',
    activeStorageEngine: 'Local Persistent Store (Active)'
  };

  if (!hasConfig) {
    result.tableReadError = 'Configuration missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)';
    return result;
  }

  const client = getSupabaseClient();
  if (!client) {
    result.tableReadError = 'Supabase client failed to initialize';
    return result;
  }
  result.clientInitialized = true;

  // 1. Check Auth health / session
  try {
    const { data: sessionData, error: sessionErr } = await client.auth.getSession();
    if (!sessionErr && sessionData?.session) {
      result.hasActiveSession = true;
      result.sessionUserEmail = sessionData.session.user?.email || 'authenticated-user';
    } else {
      result.hasActiveSession = false;
    }
    result.authHealthOk = true;
  } catch (err) {
    result.authHealthOk = false;
  }

  // 2. Perform safe, harmless read on public table (testing 'products')
  try {
    const { data, error, status } = await client
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (!error && status >= 200 && status < 300) {
      result.tableReadSuccess = true;
      result.activeStorageEngine = 'Supabase Cloud Database (Live)';
    } else if (error) {
      result.tableReadSuccess = false;
      // Capture error code & message without exposing credentials
      result.tableReadError = `Status ${status}: ${error.code || 'UNKNOWN'} — ${error.message}`;
    }
  } catch (err) {
    result.tableReadSuccess = false;
    result.tableReadError = err instanceof Error ? err.message : String(err);
  }

  return result;
};

export const checkSupabaseConnection = async (): Promise<{ connected: boolean; message: string }> => {
  const diag = await runSupabaseDiagnostics();
  if (diag.tableReadSuccess) {
    return { connected: true, message: `Connected to Supabase (${diag.urlHost}) with live tables.` };
  }
  if (diag.clientInitialized && diag.authHealthOk) {
    return {
      connected: false,
      message: `Supabase instance reachable (${diag.urlHost}), but table '${diag.testedTableName}' not found (${diag.tableReadError}). Local persistent store active.`
    };
  }
  return {
    connected: false,
    message: diag.tableReadError || 'Supabase not reachable. Local persistent store active.'
  };
};
