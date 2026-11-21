import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 31.10: mapa witryny działa na żywo i czyta artykuły bloga z dysku, więc pliki .md muszą trafić do funkcji.
  outputFileTracingIncludes: { "/sitemap.xml": ["./content/bruno-blog/**/*", "./content/blog-ai/**/*", "./content/narzedzia-ai/**/*"] },
  // 21.11 (USER_001: „bez podglądu, to ma być podstrona”): blog o AI = /blog, katalog narzędzi AI = /ai (app/blog, app/ai).
  // Stare adresy podglądu z tego samego dnia przekierowane na stałe.
  async redirects() {
    return [
      { source: "/podglad/blog-ai", destination: "/blog", permanent: true },
      { source: "/podglad/blog-ai/:sciezka*", destination: "/blog/:sciezka*", permanent: true },
      { source: "/podglad/narzedzia-ai", destination: "/ai", permanent: true },
      { source: "/podglad/narzedzia-ai/:sciezka*", destination: "/ai/:sciezka*", permanent: true },
      // Domeny Bruno: katalog i angielski /blog należą do jakubchodakowski.com (salesbruno.pl/blog = blog Bruno, bez zmian).
      { source: "/ai/:sciezka*", has: [{ type: "host", value: "(?:www\\.)?salesbruno\\.(?:pl|com)" }], destination: "https://jakubchodakowski.com/ai/:sciezka*", permanent: true },
      { source: "/blog/:sciezka*", has: [{ type: "host", value: "(?:www\\.)?salesbruno\\.com" }], destination: "https://jakubchodakowski.com/blog/:sciezka*", permanent: true },
    ];
  },
  // 30.10 (USER_001): film z salesbruno.pl/demo bez indeksowania (także sam plik wideo i okładka).
  async headers() {
    return [{ source: "/bruno/:plik(demo-film-.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
