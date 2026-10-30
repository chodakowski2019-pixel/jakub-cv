import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 30.10 (USER_001): film z salesbruno.pl/demo bez indeksowania (także sam plik wideo i okładka).
  async headers() {
    return [{ source: "/bruno/:plik(demo-film-.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
