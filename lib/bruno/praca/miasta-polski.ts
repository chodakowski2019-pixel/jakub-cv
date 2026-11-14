// 14.11 (USER_001): współrzędne miast do zakładki „Mapa” w panelu admina giełdy. Handlowiec wpisuje miasto
// wolnym tekstem, więc szukamy po nazwie bez polskich znaków i wielkości liter. Brak w słowniku = lista pod mapą.

/** [lat, lon] */
const MIASTA: Record<string, [number, number]> = {
  warszawa: [52.23, 21.01], krakow: [50.06, 19.94], lodz: [51.76, 19.46], wroclaw: [51.11, 17.03], poznan: [52.41, 16.93],
  gdansk: [54.35, 18.65], szczecin: [53.43, 14.55], bydgoszcz: [53.12, 18.01], lublin: [51.25, 22.57], bialystok: [53.13, 23.16],
  katowice: [50.26, 19.02], gdynia: [54.52, 18.53], czestochowa: [50.81, 19.12], radom: [51.4, 21.15], rzeszow: [50.04, 22.0],
  torun: [53.01, 18.6], sosnowiec: [50.29, 19.1], kielce: [50.87, 20.63], gliwice: [50.29, 18.67], olsztyn: [53.78, 20.48],
  zabrze: [50.32, 18.79], "bielsko-biala": [49.82, 19.04], bytom: [50.35, 18.92], "zielona gora": [51.94, 15.51], rybnik: [50.1, 18.55],
  "ruda slaska": [50.26, 18.86], opole: [50.67, 17.93], tychy: [50.12, 18.99], "gorzow wielkopolski": [52.73, 15.24], elblag: [54.16, 19.4],
  plock: [52.55, 19.71], "dabrowa gornicza": [50.32, 19.19], walbrzych: [50.77, 16.28], wloclawek: [52.65, 19.07], tarnow: [50.01, 20.99],
  chorzow: [50.3, 18.95], koszalin: [54.19, 16.17], kalisz: [51.76, 18.09], legnica: [51.21, 16.16], grudziadz: [53.48, 18.75],
  jaworzno: [50.2, 19.27], slupsk: [54.46, 17.03], "jastrzebie-zdroj": [49.96, 18.6], "nowy sacz": [49.62, 20.69], jelenia: [50.9, 15.73],
  "jelenia gora": [50.9, 15.73], siedlce: [52.17, 22.29], myslowice: [50.24, 19.14], konin: [52.22, 18.25], "piotrkow trybunalski": [51.41, 19.7],
  pila: [53.15, 16.74], inowroclaw: [52.8, 18.26], lubin: [51.4, 16.2], ostrow: [51.65, 17.81], "ostrow wielkopolski": [51.65, 17.81],
  suwalki: [54.1, 22.93], stargard: [53.34, 15.05], gniezno: [52.54, 17.6], "ostrowiec swietokrzyski": [50.93, 21.39], "siemianowice slaskie": [50.31, 19.03],
  glogow: [51.66, 16.08], pabianice: [51.66, 19.35], leszno: [51.84, 16.57], zamosc: [50.72, 23.25], lomza: [53.18, 22.06],
  zory: [50.04, 18.7], pruszkow: [52.17, 20.81], elk: [53.83, 22.36], tomaszow: [51.53, 20.01], "tomaszow mazowiecki": [51.53, 20.01],
  chelm: [51.14, 23.47], mielec: [50.29, 21.42], przemysl: [49.78, 22.77], "stalowa wola": [50.58, 22.05], "tczew": [54.09, 18.78],
  "kedzierzyn-kozle": [50.35, 18.21], kedzierzyn: [50.35, 18.21], biala: [52.03, 23.13], "biala podlaska": [52.03, 23.13], ostroleka: [53.08, 21.57],
  swidnica: [50.84, 16.49], belchatow: [51.37, 19.36], "swietochlowice": [50.29, 18.92], legionowo: [52.4, 20.93], "piekary slaskie": [50.38, 18.95],
  raciborz: [50.09, 18.22], zgierz: [51.86, 19.41], krosno: [49.69, 21.77], "starachowice": [51.04, 21.07], skierniewice: [51.96, 20.15],
  otwock: [52.1, 21.26], "wodzislaw slaski": [50.0, 18.46], "zawiercie": [50.49, 19.42], piaseczno: [52.08, 21.02], sopot: [54.44, 18.56],
  "kolobrzeg": [54.18, 15.58], "zakopane": [49.3, 19.95], "nowy targ": [49.48, 20.03], "oswiecim": [50.03, 19.21], "wieliczka": [49.99, 20.06],
  "marki": [52.33, 21.1], "zabki": [52.29, 21.11], "grodzisk mazowiecki": [52.11, 20.63], "minsk mazowiecki": [52.18, 21.56], "wolomin": [52.35, 21.24],
  "ciechanow": [52.88, 20.62], "mlawa": [53.11, 20.38], "kutno": [52.23, 19.36], "sieradz": [51.6, 18.73], "radomsko": [51.07, 19.45],
  "nysa": [50.47, 17.33], "brzeg": [50.86, 17.47], "olawa": [50.94, 17.29], boleslawiec: [51.26, 15.57],
  "zgorzelec": [51.15, 15.01], "swinoujscie": [53.91, 14.25], "police": [53.55, 14.57], "szczecinek": [53.71, 16.7], "chojnice": [53.7, 17.56],
  "starogard gdanski": [53.97, 18.53], "wejherowo": [54.61, 18.24], "rumia": [54.57, 18.39], "reda": [54.6, 18.35], "pruszcz gdanski": [54.26, 18.64],
  "malbork": [54.04, 19.03], "ilawa": [53.6, 19.57], "ostroda": [53.7, 19.96], "gizycko": [54.04, 21.76], "augustow": [53.84, 22.98],
  "hajnowka": [52.74, 23.58], "pulawy": [51.42, 21.97], "swidnik": [51.22, 22.7], "krasnik": [50.92, 22.22], "tarnobrzeg": [50.57, 21.68],
  "sandomierz": [50.68, 21.75], "debica": [50.05, 21.41], "jaslo": [49.75, 21.47], "sanok": [49.56, 22.2], "jaroslaw": [50.02, 22.68],
  "bochnia": [49.97, 20.43], "gorlice": [49.66, 21.16], "chrzanow": [50.14, 19.4], "olkusz": [50.28, 19.57], "bedzin": [50.33, 19.13],
  "czeladz": [50.32, 19.08], "mikolow": [50.17, 18.9], "knurow": [50.22, 18.66], "cieszyn": [49.75, 18.63], "zywiec": [49.69, 19.19],
  "wadowice": [49.88, 19.49], "lubliniec": [50.67, 18.69], "tarnowskie gory": [50.44, 18.86], "klodzko": [50.43, 16.66], "dzierzoniow": [50.73, 16.65],
  "polkowice": [51.5, 16.07], "zary": [51.64, 15.14], "zagan": [51.62, 15.32], "nowa sol": [51.8, 15.71], "swiebodzin": [52.25, 15.53],
  "miedzyrzecz": [52.44, 15.58], "wrzesnia": [52.33, 17.57], "sroda wielkopolska": [52.23, 17.28], "swarzedz": [52.41, 17.08], "lubon": [52.35, 16.89],
  "koscian": [52.08, 16.65], "krotoszyn": [51.7, 17.43], "jarocin": [51.97, 17.5], "turek": [52.02, 18.5], "kolo": [52.2, 18.64],
  "chodziez": [52.99, 16.92], "wagrowiec": [52.81, 17.2], "naklo nad notecia": [53.14, 17.6], "swiecie": [53.41, 18.45], "chelmno": [53.35, 18.43],
  "brodnica": [53.26, 19.4], "lipno": [52.84, 19.18], "aleksandrow kujawski": [52.88, 18.69], "plonsk": [52.62, 20.38], "pultusk": [52.7, 21.08],
  "wyszkow": [52.59, 21.46], "sochaczew": [52.23, 20.24], "zyrardow": [52.05, 20.45], "garwolin": [51.9, 21.61], "kozienice": [51.58, 21.55],
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();

/** Pierwsze rozpoznane miasto z wpisu („Kędzierzyn, Opole, Racibórz” → Kędzierzyn). */
export function wspolrzedneMiasta(wpis: string): { lat: number; lon: number } | null {
  for (const czesc of wpis.split(/[,;/]| i | lub | oraz /)) {
    const x = norm(czesc).replace(/^(m\.|miasto|okolice|woj\.)\s*/, "");
    const k = MIASTA[x] ?? MIASTA[x.split(" ")[0]];
    if (k) return { lat: k[0], lon: k[1] };
  }
  return null;
}
