// Simple Supabase REST client without external heavy dependencies

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseCredentials(): SupabaseConfig {
  const localUrl = localStorage.getItem('PFORPENCIL_SUPABASE_URL') || localStorage.getItem('FUNLEARN_SUPABASE_URL');
  const localKey = localStorage.getItem('PFORPENCIL_SUPABASE_ANON_KEY') || localStorage.getItem('FUNLEARN_SUPABASE_ANON_KEY');

  const url = (localUrl || (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ycmfuudgxutmkhhhpciu.supabase.co').trim();
  const anonKey = (localKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

  return { url, anonKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  localStorage.setItem('PFORPENCIL_SUPABASE_URL', url.trim());
  localStorage.setItem('PFORPENCIL_SUPABASE_ANON_KEY', anonKey.trim());
  localStorage.setItem('FUNLEARN_SUPABASE_URL', url.trim());
  localStorage.setItem('FUNLEARN_SUPABASE_ANON_KEY', anonKey.trim());
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('https://') && anonKey.length > 20);
}

/**
 * Universal fetcher for Supabase PostgREST endpoints
 */
export async function supabaseRestFetch(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
    customUrl?: string;
    customKey?: string;
  } = {}
) {
  const defaultCreds = getSupabaseCredentials();
  const baseUrl = options.customUrl || defaultCreds.url;
  const apiKey = options.customKey || defaultCreds.anonKey;

  if (!baseUrl || !apiKey) {
    throw new Error('Supabase credentials missing.');
  }

  const queryParams = options.params ? '?' + new URLSearchParams(options.params).toString() : '';
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/rest/v1/${table}${queryParams}`;

  const res = await fetch(endpoint, {
    method: options.method || 'GET',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation,resolution=merge-duplicates',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    const errorDetail = errorBody.details ? ` (${errorBody.details})` : errorBody.hint ? ` (${errorBody.hint})` : '';
    throw new Error((errorBody.message || `HTTP ${res.status}: ${res.statusText}`) + errorDetail);
  }

  return res.json().catch(() => null);
}

export interface KeyAnalysis {
  isValidJwt: boolean;
  role?: string;
  ref?: string;
  expDate?: string;
  isExpired?: boolean;
  mismatchWithUrl?: boolean;
  urlRef?: string;
  warning?: string;
}

/**
 * Parses and inspects the Supabase JWT anon key client-side to diagnose misconfigurations
 */
export function analyzeSupabaseKey(key: string, url: string): KeyAnalysis {
  const cleanKey = (key || '').replace(/[\s\u200B\uFEFF\u00A0\r\n\t]+/g, '').replace(/^["'`]|["'`]$/g, '');
  const cleanUrl = (url || '').trim().replace(/^["'`]|["'`]$/g, '').replace(/\/+$/, '').trim();

  let urlRef = '';
  try {
    const parsed = new URL(cleanUrl);
    urlRef = parsed.hostname.split('.')[0] || '';
  } catch {
    urlRef = '';
  }

  if (!cleanKey) {
    return { isValidJwt: false, urlRef };
  }

  const parts = cleanKey.split('.');
  if (parts.length !== 3 || !cleanKey.startsWith('ey')) {
    return {
      isValidJwt: false,
      urlRef,
      warning: 'The pasted text does not look like a Supabase API key (Supabase anon keys start with "eyJ..."). Make sure you did not paste your database password or account password.'
    };
  }

  if (parts[2].length < 43) {
    return {
      isValidJwt: false,
      urlRef,
      warning: `The API key signature appears truncated (${parts[2].length} characters instead of 43+). Please click the official "Copy" button in the Supabase Dashboard instead of dragging to select.`
    };
  }

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    const role = payload.role;
    const ref = payload.ref;
    const exp = payload.exp;
    const isExpired = exp ? exp * 1000 < Date.now() : false;
    const expDate = exp ? new Date(exp * 1000).toLocaleDateString() : undefined;
    const mismatchWithUrl = Boolean(ref && urlRef && ref !== urlRef);

    let warning = '';
    if (mismatchWithUrl) {
      warning = `Key belongs to project "${ref}", but URL is set to "${urlRef}". Both must belong to the same project!`;
    } else if (isExpired) {
      warning = `This API key expired on ${expDate}. Please generate a fresh key in your Supabase Dashboard.`;
    }

    return {
      isValidJwt: true,
      role,
      ref,
      expDate,
      isExpired,
      mismatchWithUrl,
      urlRef,
      warning
    };
  } catch {
    return {
      isValidJwt: false,
      urlRef,
      warning: 'Could not decode JWT payload. The key string might be truncated or copied incompletely.'
    };
  }
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{ 
  success: boolean; 
  message: string;
  details?: string;
  suggestedUrl?: string;
  isPausedPossible?: boolean;
}> {
  const defaultCreds = getSupabaseCredentials();
  const url = (customUrl ?? defaultCreds.url).trim().replace(/\/+$/, '');
  const anonKey = (customKey ?? defaultCreds.anonKey).replace(/[\s\u200B\uFEFF\u00A0\r\n\t]+/g, '').replace(/^["'`]|["'`]$/g, '');

  if (!url || !url.startsWith('https://')) {
    return {
      success: false,
      message: 'Invalid Supabase Project URL. Format must be https://<project-ref>.supabase.co'
    };
  }

  if (!anonKey || anonKey.length < 20) {
    return {
      success: false,
      message: 'Supabase anon public key is missing or too short. Please paste your key from Project Settings > API.'
    };
  }

  const analysis = analyzeSupabaseKey(anonKey, url);
  if (analysis.mismatchWithUrl && analysis.ref) {
    const suggestedUrl = `https://${analysis.ref}.supabase.co`;
    return {
      success: false,
      message: `Project Mismatch: Your anon key is for project "${analysis.ref}", but the Project URL is "${analysis.urlRef}".`,
      details: `Please update your Project URL to: ${suggestedUrl}`,
      suggestedUrl
    };
  }

  if (!analysis.isValidJwt && analysis.warning) {
    return {
      success: false,
      message: analysis.warning
    };
  }

  try {
    const tableEndpoint = `${url}/rest/v1/profiles?select=id&limit=1`;
    const tableRes = await fetch(tableEndpoint, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (tableRes.status === 401 || tableRes.status === 403) {
      const errJson = await tableRes.json().catch(() => null);
      const serverMessage = errJson?.message || errJson?.error_description || tableRes.statusText;
      const hint = errJson?.hint || '';

      return {
        success: false,
        message: `Authentication failed (HTTP ${tableRes.status}): ${serverMessage}`,
        details: hint ? `Supabase hint: ${hint}` : undefined,
        isPausedPossible: true
      };
    }

    if (tableRes.ok) {
      return {
        success: true,
        message: `Connection successful! Verified active Supabase database at ${new URL(url).hostname}. Tables are active and ready!`
      };
    }

    const errBody = await tableRes.json().catch(() => null);
    if (tableRes.status === 404 || tableRes.status === 400 || errBody?.code?.startsWith('PGRST')) {
      return {
        success: true,
        message: `Connection successful! Authenticated with ${new URL(url).hostname} as anon user. (Note: Tables are not yet created — please copy & run the SQL script in the SQL tab).`
      };
    }

    return {
      success: false,
      message: `Received unexpected status ${tableRes.status}: ${tableRes.statusText} from Supabase.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Network error connecting to Supabase: ${err?.message || 'Check your internet connection or project status.'}`
    };
  }
}
