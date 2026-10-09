"use client";

import { useEffect, useState } from "react";

// 9.10 (USER_001): angielski = główny język. Polski tylko z dopiskiem ?pl w adresie (jak LP Bruno).
export function useJezyk(): "en" | "pl" {
  const [j, setJ] = useState<"en" | "pl">("en");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("pl")) setJ("pl");
  }, []);
  return j;
}
