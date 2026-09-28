// Wspólne dla /aisalesbrief: endpoint uploadu zakłada kubełek pod tą nazwą,
// endpoint ankiety podpisuje z niego linki do maila.
// Stała siedzi w lib, bo Next nie pozwala eksportować z pliku route.ts
// niczego poza handlerami i swoimi opcjami.
export const KUBELEK_NAGRANIA = "salesai-nagrania";
