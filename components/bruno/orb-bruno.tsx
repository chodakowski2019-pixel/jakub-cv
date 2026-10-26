// 26.10 (USER_001: „lepsza kula, nowocześniejsza”): kula Bruno w CSS, bez canvasa i bez koloru typu klienta.
// Warstwy: poświata (oddycha), rdzeń z obracającym się gradientem stożkowym (płynne złote smugi, rozmyte),
// drugi gradient w przeciwną stronę, szklany odblask i cienka obwódka. Tempo: czeka (wolno), słucha, mówi (szybko + puls).
export type TempoOrb = "czeka" | "slucha" | "mowi";

export default function OrbBruno({ tempo = "czeka", className = "" }: { tempo?: TempoOrb; className?: string }) {
  return (
    <div className={`orb-bruno orb-${tempo} ${className}`} aria-hidden>
      <div className="orb-poswiata" />
      <div className="orb-rdzen">
        <div className="orb-smuga orb-smuga-1" />
        <div className="orb-smuga orb-smuga-2" />
        <div className="orb-srodek" />
      </div>
      <div className="orb-odblask" />
      <div className="orb-obwodka" />
    </div>
  );
}
