/**
 * Testy zdań dla metryk (12.10, W3 /brunowiedza). Bez bazy, bez klucza, 0 $.
 *
 *   node --no-warnings --import ./scripts/_ts-loader.mjs scripts/bruno-metryki-test.ts
 *
 * Każde zdanie = jedno oczekiwanie. Wynik „N/N" na końcu, kod wyjścia 1 przy błędzie.
 * Wzorce z kart `SalesAI/wiedza/techniki/` (sekcja „Jak trener rozpoznaje"), PL + EN.
 */
import type { Wypowiedz } from "@/lib/bruno/db";
import { czyPytanieOtwarte, klasyfikujOdpowiedz, policzMetryki, prosbaODecyzje, technikiObiekcjiW } from "@/lib/bruno/metryki";
import { policzObiekcje } from "@/lib/bruno/rubryka";
import type { ObiekcjeTechniki } from "@/lib/bruno/db";

let ok = 0;
let wszystkie = 0;
const bledy: string[] = [];
function test(nazwa: string, warunek: boolean) {
  wszystkie++;
  if (warunek) ok++;
  else bledy.push(nazwa);
}

// ——— Istniejące wzorce (jak w E34: test 8/8 zdań) ———
test("EN pytanie otwarte", czyPytanieOtwarte("How much are you paying right now?", "en"));
test("EN pytanie zamknięte", !czyPytanieOtwarte("Do you have a budget for this?", "en"));
test("EN prośba o decyzję", prosbaODecyzje("en").test("Let's get started Monday, does that work for you?"));
test("EN brak prośby", !prosbaODecyzje("en").test("I'll send you the proposal and we'll see."));
test("PL pytanie otwarte", czyPytanieOtwarte("Ile pan płaci teraz za prąd?", "pl"));
test("PL pytanie zamknięte", !czyPytanieOtwarte("Czy ma pan na to budżet?", "pl"));
test("PL prośba o decyzję", prosbaODecyzje("pl").test("Kiedy możemy podpisać pełnomocnictwo u notariusza?"));
test("PL brak prośby", !prosbaODecyzje("pl").test("Prześlę ofertę i się odezwę."));

// ——— W3: pierwsza odpowiedź po obiekcji (zgoda / kontra / argument / rabat / „ale") ———
const en1 = klasyfikujOdpowiedz("I get it. At that number that's a fair reaction. Compared to what does it feel high?", "en");
test("EN zgoda + pytanie", en1.zgoda && en1.pytanie && !en1.kontra && en1.ale === 0);
const en2 = klasyfikujOdpowiedz("But sir, it's really not expensive, our competitors charge about the same.", "en");
test("EN kontra „but”", en2.kontra && !en2.zgoda && en2.ale === 1);
const en3 = klasyfikujOdpowiedz("Our price includes installation and a five-year warranty, that's why it's higher.", "en");
test("EN argument", en3.argument && !en3.zgoda && !en3.kontra && !en3.pytanie);
const en4 = klasyfikujOdpowiedz("Okay, I can give you a discount if you sign today.", "en");
test("EN rabat", en4.rabat);
const en5 = klasyfikujOdpowiedz("Yeah, I understand. Honestly, that's fair.", "en");
test("EN zgoda po „yeah”", en5.zgoda);
const en6 = klasyfikujOdpowiedz("Okay, let me update your file. You're probably getting calls from everybody, right?", "en");
test("EN zgoda „let me update”", en6.zgoda);
const en7 = klasyfikujOdpowiedz("Well, actually that's not how it works, but I see your point.", "en");
test("EN kontra „well, actually” + ale 1", en7.kontra && en7.ale === 1);

const pl1 = klasyfikujOdpowiedz("Rozumiem, przy tej kwocie to naturalna reakcja. W porównaniu do czego wydaje się wysoka?", "pl");
test("PL zgoda + pytanie", pl1.zgoda && pl1.pytanie && !pl1.kontra && pl1.ale === 0);
const pl2 = klasyfikujOdpowiedz("Ale proszę pana, to wcale nie jest drogo, konkurencja ma podobnie.", "pl");
test("PL kontra „ale”", pl2.kontra && !pl2.zgoda && pl2.ale === 1);
const pl3 = klasyfikujOdpowiedz("Nasza cena zawiera montaż i pięcioletnią gwarancję, dlatego jest wyższa.", "pl");
test("PL argument", pl3.argument);
const pl4 = klasyfikujOdpowiedz("Mogę zejść 10 procent, jeśli podpiszemy dziś.", "pl");
test("PL rabat", pl4.rabat);
const pl5 = klasyfikujOdpowiedz("No jasne, ma pan rację. Z czym pan to porównuje?", "pl");
test("PL zgoda po „no jasne”", pl5.zgoda && pl5.pytanie);
const pl6 = klasyfikujOdpowiedz("Dobrze, zaznaczam w karcie. Pewnie dzwoni do pani cała masa firm, prawda?", "pl");
test("PL zgoda „zaznaczam w karcie”", pl6.zgoda);
const pl7 = klasyfikujOdpowiedz("Tak, ale u nas jest inaczej, bo mamy serwis.", "pl");
test("PL kontra „tak, ale”", pl7.kontra && pl7.ale === 1);

// ——— W3: techniki (frazy) ———
const t = (z: string, j: "en" | "pl") => technikiObiekcjiW(z, j);
test("EN coś oprócz ceny", t("Was there anything besides price that drove the decision?", "en").pytanie_poza_cena);
test("EN coś oprócz ceny 2", t("Other than the cost, what else played into it?", "en").pytanie_poza_cena);
test("EN skala 1-10", t("On a scale of 1 to 10, where are you?", "en").skala_1_10);
test("EN pytanie o lukę", t("What's keeping you at a seven instead of a nine?", "en").skala_1_10);
test("EN izolacja", t("Other than time, is there anything else keeping you from being 100 % sure?", "en").izolacja);
test("EN izolacja żona", t("If she were on the call right now and said go for it, would you be at 100 %?", "en").izolacja);
test("EN pieniądze na bok", t("Let's set money aside for a second. Is this what you need?", "en").izolacja);
test("EN izolacja partner", t("Besides letting your wife know, is there anything else?", "en").izolacja);
test("EN hipoteza", t("Hypothetically: you've seen both, and this was the last one. What decides it, the place or the terms?", "en").hipoteza_koniec);
test("EN hipoteza 2", t("Let's say you've seen them all. In the end, what decides it?", "en").hipoteza_koniec);
test("EN gdyby cena ta sama", t("If the money were the same, who would you rather have do it?", "en").gdyby_cena_ta_sama);
test("EN tie-down right?", t("You want serious buyers and less competition, right?", "en").tie_down);
test("EN tie-down fair enough?", t("Five minutes, so you actually have something to think about. Fair enough?", "en").tie_down);
test("EN tie-down make sense?", t("Does that make sense?", "en").tie_down);
const enNic = t("How much are you paying right now? Do you want the blue one?", "en");
test("EN brak technik", !enNic.pytanie_poza_cena && !enNic.skala_1_10 && !enNic.izolacja && !enNic.hipoteza_koniec && !enNic.gdyby_cena_ta_sama && !enNic.tie_down);

test("PL coś oprócz ceny", t("Czy było coś oprócz ceny, co wpłynęło na wybór?", "pl").pytanie_poza_cena);
test("PL coś oprócz ceny 2", t("Co jeszcze zdecydowało, poza samą ceną?", "pl").pytanie_poza_cena);
test("PL skala 1-10", t("W skali od 1 do 10, gdzie pani jest?", "pl").skala_1_10);
test("PL pytanie o lukę", t("Co trzyma panią na siódemce zamiast na dziewiątce?", "pl").skala_1_10);
test("PL izolacja", t("Poza czasem, czy jest coś jeszcze, co sprawia, że nie jest pani w 100 % pewna?", "pl").izolacja);
test("PL izolacja żona", t("Poza rozmową z żoną, jest coś jeszcze, co trzyma pana poniżej 100 %?", "pl").izolacja);
test("PL pieniądze na bok", t("Odłóżmy na chwilę pieniądze na bok.", "pl").izolacja);
test("PL gdyby żona na linii", t("Gdyby żona była teraz na linii i powiedziała „rób, co uważasz”, byłby pan na 100 %?", "pl").izolacja);
test("PL hipoteza", t("Hipotetycznie: obejrzał pan oba, a to było ostatnie. Co zdecyduje na końcu?", "pl").hipoteza_koniec);
test("PL hipoteza 2", t("Załóżmy, że sprawdził pan wszystkie oferty.", "pl").hipoteza_koniec);
test("PL gdyby cena ta sama", t("Gdyby cena była ta sama, u kogo wolałby pan to zrobić?", "pl").gdyby_cena_ta_sama);
test("PL tie-down prawda?", t("Chce pani poważnych kupujących i mniej konkurencji, prawda?", "pl").tie_down);
test("PL tie-down w porządku?", t("5 minut, żeby miał pan nad czym myśleć. W porządku?", "pl").tie_down);
const plNic = t("Ile pan płaci teraz za prąd? Jaki to dokładnie model?", "pl");
test("PL brak technik", !plNic.pytanie_poza_cena && !plNic.skala_1_10 && !plNic.izolacja && !plNic.hipoteza_koniec && !plNic.gdyby_cena_ta_sama && !plNic.tie_down);

// ——— W3: cała rozmowa przez policzMetryki ———
const trEn: Wypowiedz[] = [
  { rola: "klient", tekst: "Honestly, that's too expensive for what we get.", t: 10 },
  { rola: "handlowiec", tekst: "I get it. At that number that's a fair reaction. Compared to what does it feel high?", t: 14 },
  { rola: "klient", tekst: "Another company quoted us about 20 % less.", t: 20 },
  { rola: "handlowiec", tekst: "Good to know. What's in that quote, and what did they leave out? If the money were the same, who would you rather work with?", t: 24 },
  { rola: "klient", tekst: "Honestly, you guys. But I need to think about it.", t: 32 },
  { rola: "handlowiec", tekst: "No problem. Other than price, is there anything else keeping you from a yes? Let's get started Monday, does that work for you?", t: 36 },
];
const mEn = policzMetryki(trEn, 60, [], "en");
test("EN metryki: 2 obiekcje", mEn.obiekcje_klienta === 2);
test("EN metryki: 2 zgody", mEn.obiekcje_odp_zgoda === 2);
test("EN metryki: 0 kontr, 0 „but”", mEn.obiekcje_odp_kontra === 0 && mEn.kontra_ale_po_obiekcji === 0);
test("EN metryki: pytania po obiekcji", mEn.obiekcje_z_pytaniem === 2);
test("EN metryki: prośba po obiekcji", mEn.prosba_po_obiekcji);
test("EN metryki: gdyby cena + izolacja", mEn.gdyby_cena_ta_sama && mEn.izolacja && !mEn.skala_1_10);

const trPl: Wypowiedz[] = [
  { rola: "klient", tekst: "Szczerze, to wydaje mi się za drogie.", t: 10 },
  { rola: "handlowiec", tekst: "Ale proszę pana, to wcale nie jest drogo, konkurencja ma podobnie.", t: 14 },
  { rola: "klient", tekst: "Muszę to przemyśleć.", t: 20 },
  { rola: "handlowiec", tekst: "Rozumiem. Co konkretnie chce pan przemyśleć? Chce pan mieć pewność, że to zadziała, prawda?", t: 24 },
];
const mPl = policzMetryki(trPl, 40, [], "pl");
test("PL metryki: 2 obiekcje", mPl.obiekcje_klienta === 2);
test("PL metryki: 1 zgoda, 1 kontra", mPl.obiekcje_odp_zgoda === 1 && mPl.obiekcje_odp_kontra === 1);
test("PL metryki: 1 „ale”", mPl.kontra_ale_po_obiekcji === 1);
test("PL metryki: tie-down 1", mPl.tie_down === 1);
test("PL metryki: brak prośby po obiekcji", !mPl.prosba_po_obiekcji);

// ——— W3: policzObiekcje ———
const baza: ObiekcjeTechniki = {
  obiekcji: 1,
  zgoda_przed_odpowiedzia: false,
  pytanie_po_obiekcji: false,
  kontra_ale: 0,
  rabat_od_razu: false,
  pytanie_poza_cena: false,
  izolacja: false,
  skala: false,
  hipoteza: false,
  gdyby_cena_ta_sama: false,
  tie_down: false,
  dowod_z_liczba: false,
  ukryty_powod_odkryty: false,
  petla_drugie_podejscie: false,
};
test("ocena: bez obiekcji = ocena modelu", policzObiekcje({ ...baza, obiekcji: 0 }, 7) === 7);
test("ocena: wzorowo = 10", policzObiekcje({ ...baza, zgoda_przed_odpowiedzia: true, pytanie_po_obiekcji: true, izolacja: true, gdyby_cena_ta_sama: true, tie_down: true, dowod_z_liczba: true, ukryty_powod_odkryty: true, petla_drugie_podejscie: true }, 5) === 10);
test("ocena: zgoda + pytanie, zero ale = 6", policzObiekcje({ ...baza, zgoda_przed_odpowiedzia: true, pytanie_po_obiekcji: true }, 5) === 6);
test("ocena: zgoda + pytanie + jedna technika = 8", policzObiekcje({ ...baza, zgoda_przed_odpowiedzia: true, pytanie_po_obiekcji: true, skala: true }, 5) === 8);
test("ocena: argument + ale + rabat = 1", policzObiekcje({ ...baza, kontra_ale: 2, rabat_od_razu: true }, 8) === 1);
test("ocena: sam dowód bez zgody i pytania = max 4", policzObiekcje({ ...baza, dowod_z_liczba: true, tie_down: true, izolacja: true }, 9) <= 4);

console.log(`Testy metryk: ${ok}/${wszystkie}${bledy.length ? `\nBŁĘDY:\n- ${bledy.join("\n- ")}` : " ✓"}`);
if (bledy.length) process.exit(1);
