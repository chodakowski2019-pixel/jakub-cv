// 25.10 (USER_001): podgląd panelu w stylu Kancelarii Asset (kancelaria-asset.pl): biel, granat #060513,
// fiolet #5E52F8, lawenda #F0EEFF. Tylko localhost: BRUNO_MOTYW=asset npx next dev -p 3001.
// Kolory: app/bruno/motyw-asset.css.
export const motywAsset = () => process.env.BRUNO_MOTYW === "asset";
// 27.10 (USER_001: „Rinesk wygrywa, przerób Bruno na taki”): motyw RINESK = DOMYŚLNY (app/bruno/motyw-rinesk.css,
// pasek components/bruno/pasek-rinesk.tsx, panel components/bruno/panel-rinesk.tsx).
// Stary czarno-złoty: BRUNO_MOTYW=zloty. Asset (BRUNO_MOTYW=asset) działa tylko razem ze złotym = już nieużywany.
export const motywRinesk = () => process.env.BRUNO_MOTYW !== "zloty";
