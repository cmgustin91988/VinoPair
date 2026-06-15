type ProviderPayload = {
  matches?: Array<{
    provider?: string;
    name?: string;
    confidence?: number;
    url?: string;
    note?: string;
  }>;
  profile?: Record<string, unknown>;
};

type WineLookupRequest = {
  query: Record<string, string | string[] | undefined>;
};

type WineLookupResponse = {
  status: (code: number) => WineLookupResponse;
  json: (body: unknown) => void;
};

export default async function handler(request: WineLookupRequest, response: WineLookupResponse) {
  const query = String(request.query.q ?? "").trim();

  if (!query) {
    response.status(400).json({ matches: [], error: "Missing wine query." });
    return;
  }

  const providerUrl = process.env.WINE_PROVIDER_API_URL;
  const providerKey = process.env.WINE_PROVIDER_API_KEY;

  if (!providerUrl || !providerKey) {
    response.status(200).json({
      matches: [],
      profile: undefined,
      note: "No approved provider configured. Frontend will fall back to public source links."
    });
    return;
  }

  try {
    const upstream = await fetch(`${providerUrl}?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${providerKey}`,
        Accept: "application/json"
      }
    });

    if (!upstream.ok) {
      response.status(200).json({ matches: [], profile: undefined });
      return;
    }

    const payload = (await upstream.json()) as ProviderPayload;
    response.status(200).json({
      matches: payload.matches ?? [],
      profile: payload.profile
    });
  } catch {
    response.status(200).json({ matches: [], profile: undefined });
  }
}
