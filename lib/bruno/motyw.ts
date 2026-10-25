// 25.10 (USER_001): podgląd panelu w stylu Kancelarii Asset (kancelaria-asset.pl): biel, granat #060513,
// fiolet #5E52F8, lawenda #F0EEFF. Tylko localhost: BRUNO_MOTYW=asset npx next dev -p 3001.
// Bez zmiennej panel zostaje czarno-złoty. Kolory: app/bruno/motyw-asset.css.
export const motywAsset = () => process.env.BRUNO_MOTYW === "asset";
