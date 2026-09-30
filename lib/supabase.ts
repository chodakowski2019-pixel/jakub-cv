import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Klient Supabase z kluczem serwisowym. Tylko serwer.
//
// Tworzony leniwie, przy pierwszym użyciu. Wersja tworzona przy wczytaniu
// modułu wywracała całą stronę, gdy jakikolwiek komponent kliencki pociągnął
// ten plik przez łańcuch importów: w przeglądarce nie ma SUPABASE_URL, więc
// `createClient` rzucał „supabaseUrl is required" jeszcze przed narysowaniem
// czegokolwiek (30.09, panel Bruno). Teraz taki import jest nieszkodliwy,
// a błąd pojawia się dopiero przy realnym zapytaniu, po stronie serwera.

let klient: SupabaseClient | null = null;

function polacz(): SupabaseClient {
  if (!klient) {
    klient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return klient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_cel, wlasciwosc) {
    const c = polacz();
    const wartosc = Reflect.get(c, wlasciwosc, c);
    return typeof wartosc === "function" ? wartosc.bind(c) : wartosc;
  },
});
