// 9.10 (USER_001): „Continue with Google” dla B2C. OAuth 2.0 (kod autoryzacji),
// zakres tylko openid + email + profile: bez weryfikacji aplikacji przez Google.
// Klucze w env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET. Bez nich przycisk się nie pokazuje.

export const CIASTECZKO_GOOGLE = "bruno_google_stan";

export function googleSkonfigurowany(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function adresPowrotu(origin: string): string {
  return `${origin}/api/bruno/google/powrot`;
}

export function linkDoGoogle(a: { stan: string; powrot: string }): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: a.powrot,
    response_type: "code",
    scope: "openid email profile",
    state: a.stan,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}

/**
 * Wymiana kodu na id_token. Token przychodzi prosto z serwera Google po HTTPS,
 * więc wystarczy sprawdzić odbiorcę (aud), wystawcę i potwierdzony e-mail.
 */
export async function daneZGoogle(a: { kod: string; powrot: string }): Promise<{ email: string; imie: string } | null> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: a.kod,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: a.powrot,
      grant_type: "authorization_code",
    }),
  });
  if (!r.ok) {
    console.error("[bruno google] token", r.status, (await r.text()).slice(0, 300));
    return null;
  }
  const { id_token } = (await r.json()) as { id_token?: string };
  if (!id_token) return null;
  try {
    const p = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString("utf8")) as {
      aud?: string; iss?: string; email?: string; email_verified?: boolean; given_name?: string; name?: string; exp?: number;
    };
    if (p.aud !== process.env.GOOGLE_CLIENT_ID) return null;
    if (p.iss !== "https://accounts.google.com" && p.iss !== "accounts.google.com") return null;
    if (!p.email || !p.email_verified) return null;
    if (p.exp && p.exp * 1000 < Date.now()) return null;
    return { email: p.email.trim().toLowerCase(), imie: (p.given_name ?? p.name ?? "").slice(0, 80) };
  } catch {
    return null;
  }
}
