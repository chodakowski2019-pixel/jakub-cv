// 4.11: pomocnik bez zależności od serwera (można importować w komponentach klienta).
/** Dopisuje `?jako=` do wewnętrznego linku, gdy szef jest w widoku handlowca. */
export function zJako(href: string, jako: string | null | undefined): string {
  if (!jako) return href;
  return `${href}${href.includes("?") ? "&" : "?"}jako=${encodeURIComponent(jako)}`;
}
