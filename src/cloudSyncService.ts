import type { UserPreferences, Wine } from "./pairingService";

export type CloudSession = {
  accessToken: string;
  refreshToken?: string;
  email: string;
  userId: string;
};

export type CloudState = {
  inventory: Wine[];
  preferences: UserPreferences;
  updated_at?: string;
};

const sessionKey = "vinopair.cloudSession";

function getSupabaseConfig() {
  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const url = viteEnv?.VITE_SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = viteEnv?.VITE_SUPABASE_ANON_KEY;

  return url && anonKey ? { url, anonKey } : null;
}

export function cloudSyncAvailable() {
  return Boolean(getSupabaseConfig());
}

export function getStoredCloudSession(): CloudSession | null {
  try {
    const raw = localStorage.getItem(sessionKey);
    return raw ? (JSON.parse(raw) as CloudSession) : null;
  } catch {
    return null;
  }
}

export function storeCloudSession(session: CloudSession | null) {
  if (!session) {
    localStorage.removeItem(sessionKey);
    return;
  }

  localStorage.setItem(sessionKey, JSON.stringify(session));
}

export async function signInWithEmail(email: string, password: string) {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(config.anonKey),
    body: JSON.stringify({ email, password })
  });

  return sessionFromAuthResponse(response, email);
}

export async function signUpWithEmail(email: string, password: string) {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(config.anonKey),
    body: JSON.stringify({ email, password })
  });

  return sessionFromAuthResponse(response, email);
}

export async function loadCloudState(session: CloudSession): Promise<CloudState | null> {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/vinopair_profiles?user_id=eq.${session.userId}&select=*`, {
    headers: restHeaders(config.anonKey, session.accessToken)
  });

  if (!response.ok) {
    throw new Error("Could not load your cloud cellar.");
  }

  const rows = (await response.json()) as Array<{
    inventory?: Wine[];
    preferences?: UserPreferences;
    updated_at?: string;
  }>;
  const row = rows[0];

  if (!row?.inventory || !row.preferences) return null;

  return {
    inventory: row.inventory,
    preferences: row.preferences,
    updated_at: row.updated_at
  };
}

export async function saveCloudState(session: CloudSession, state: CloudState) {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/vinopair_profiles`, {
    method: "POST",
    headers: {
      ...restHeaders(config.anonKey, session.accessToken),
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      user_id: session.userId,
      inventory: state.inventory,
      preferences: state.preferences,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error("Could not save your cloud cellar.");
  }
}

function requireSupabaseConfig() {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Cloud sync is not configured yet.");
  }
  return config;
}

function authHeaders(anonKey: string) {
  return {
    apikey: anonKey,
    "Content-Type": "application/json"
  };
}

function restHeaders(anonKey: string, accessToken: string) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };
}

async function sessionFromAuthResponse(response: Response, fallbackEmail: string): Promise<CloudSession> {
  if (!response.ok) {
    throw new Error("Sign in failed. Check your email and password.");
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    user?: { id?: string; email?: string };
  };

  if (!payload.access_token || !payload.user?.id) {
    throw new Error("Confirm your email, then sign in again.");
  }

  const session = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    email: payload.user.email ?? fallbackEmail,
    userId: payload.user.id
  };
  storeCloudSession(session);
  return session;
}
