import Link from "next/link";
import { Twarz } from "@/components/bruno/panel-ui";
import { tDla, type Jezyk } from "@/lib/bruno/i18n";
import type { Plan, Kryt } from "@/lib/bruno/plan-treningu";

// 8.11 (USER_001 pkt 9: „szef ma widzieć plan treningu każdego handlowca”): sekcja w Statystykach zespołu.
// Plan układa Bruno (lib/bruno/plan-treningu.ts); szef widzi postęp dnia, następny trening z powodem i opanowane kryteria.

const NAZWY: Record<Kryt, [string, string]> = { otwarcie: ["Opening", "Otwarcie"], pytania: ["Questions", "Pytania"], obiekcje: ["Objections", "Obiekcje"], zamkniecie: ["Closing", "Zamknięcie"], pewnosc: ["Confidence", "Pewność"] };

export default function PlanZespolu({ jezyk, wiersze }: { jezyk: Jezyk; wiersze: { email: string; imie: string; zdjecie: string | null; plan: Plan | null }[] }) {
  const t = tDla(jezyk);
  return (
    <section className="p-karta" style={{ marginTop: 16 }}>
      <div className="p-karta-hd" style={{ padding: "18px 20px 6px" }}>
        <div>
          <h2>{t("Today's training plan", "Plan treningu na dziś")}</h2>
          <p>{t("Bruno picks 5 sessions per rep: real meetings first, then the stage they lose, client objections, low scores, stalled deals.", "Bruno układa 5 treningów na handlowca: najpierw prawdziwe spotkania, potem etap, na którym traci, obiekcje klientów, niskie oceny, deale, które stoją.")}</p>
        </div>
      </div>
      <div className="p-tabela-wrap">
        <table className="p-tabela">
          <thead>
            <tr>
              <th>{t("Rep", "Handlowiec")}</th>
              <th>{t("Today", "Dziś")}</th>
              <th>{t("Next session", "Następny trening")}</th>
              <th>{t("Mastered", "Opanowane")}</th>
            </tr>
          </thead>
          <tbody>
            {wiersze.map((w) => {
              const n = w.plan?.pozycje.find((p) => !p.zrobione) ?? null;
              const ile = w.plan?.zrobione ?? 0;
              const z = w.plan?.pozycje.length ?? 0;
              return (
                <tr key={w.email}>
                  <td>
                    <Link href={`/bruno/szef/${encodeURIComponent(w.email)}`} className="p-osoba">
                      <Twarz src={w.zdjecie} imie={w.imie} rozmiar={30} />
                      <span className="min-w-0"><b>{w.imie}</b></span>
                    </Link>
                  </td>
                  <td>
                    <span className="pk-etap-cela">
                      <span className={ile >= z && z ? "p-ok-t" : ""}>{ile}/{z}</span>
                      <span className="pk-etapy-kropki" aria-hidden>
                        {(w.plan?.pozycje ?? []).map((p) => <i key={p.nr} className={p.zrobione ? "on" : ""} style={p.zrobione ? { background: "var(--p-ok)" } : undefined} />)}
                      </span>
                    </span>
                  </td>
                  <td>
                    {n ? (
                      <span className="pk-zadanie">
                        <span>{n.tytul}</span>
                        <small title={n.dlaczego}>{n.dlaczego}</small>
                      </span>
                    ) : w.plan ? (
                      <span className="p-ok-t">{t("All done", "Wszystko zrobione")}</span>
                    ) : (
                      <span className="p-cichy">–</span>
                    )}
                  </td>
                  <td>{w.plan?.opanowane.length ? w.plan.opanowane.map((k) => NAZWY[k][jezyk === "pl" ? 1 : 0]).join(", ") : <span className="p-cichy">{t("none yet", "jeszcze nic")}</span>}</td>
                </tr>
              );
            })}
            {!wiersze.length && (
              <tr>
                <td colSpan={4} className="p-cichy" style={{ textAlign: "center", padding: 24 }}>{t("No reps yet.", "Brak handlowców.")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
