import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Missing configuration is a visible setup state, never a fake-data fallback.
function validBackendUrl(value: string | undefined) {
  try {
    const parsed = new URL(value ?? '');
    return (
      parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))
    );
  } catch {
    return false;
  }
}
export const isBackendConfigured =
  validBackendUrl(url) && !!key && !url?.includes('your-project') && !key.includes('your-anon-key');
export const supabase = isBackendConfigured ? createClient(url, key) : null;
export function backend() {
  if (!supabase) throw new Error('errors.configuration');
  return supabase;
}
