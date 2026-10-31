import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 31.10: mapa witryny działa na żywo i czyta artykuły bloga z dysku, więc pliki .md muszą trafić do funkcji.
  outputFileTracingIncludes: { "/sitemap.xml": ["./content/bruno-blog/**/*"] },
  // 30.10 (USER_001): film z salesbruno.pl/demo bez indeksowania (także sam plik wideo i okładka).
  async headers() {
    return [{ source: "/bruno/:plik(demo-film-.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
