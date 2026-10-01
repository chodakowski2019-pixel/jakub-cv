// Przejście między ekranami panelu (USER_001 1.10): nowy ekran wjeżdża
// z prawej strony. template.tsx montuje się od nowa przy każdej nawigacji,
// więc animacja odpala się za każdym przejściem (layout.tsx by się nie odpalił).
export default function BrunoTemplate({ children }: { children: React.ReactNode }) {
  return <div className="bruno-ekran">{children}</div>;
}
