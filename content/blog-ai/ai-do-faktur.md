---
nr: 27
tytul: "AI do faktur: co zrobi program, a co ChatGPT"
opis: "AI do faktur w małej firmie: odczyt faktur kosztowych w programie, KSeF, zestawienia i przypomnienia z ChatGPT. Podział zadań i gotowe polecenia."
grupa: ai-w-pracy-biura
fraza: ai do faktur
data: 2026-11-25
zrodla: ksef-etapy, ksef-10000, fakturownia-ocr, fakturownia-ksef, wfirma-magic-box, wfirma-ai-decyzja, chatgpt-dpa, chatgpt-indywidualne, parp-poufne
tldr: "Faktury kosztowe najlepiej odczytuje program do faktur, bo ma odczyt dokumentów i połączenie z KSeF. Asystent AI, taki jak ChatGPT, przydaje się do zestawień, sprawdzania i maili o płatnościach. Decyzję zawsze zatwierdza człowiek."
---

W biurze leży stos faktur kosztowych. Ktoś przepisuje je ręcznie do programu. Ktoś inny pilnuje, kto zalega z płatnością.

AI pomaga przy obu zadaniach, ale nie tym samym narzędziem. Poniżej podział: co robi program do faktur, a co asystent AI.

## Które AI do faktur wybrać

Do wprowadzania faktur: program do faktur z odczytem dokumentów. Do analizy i korespondencji: asystent AI, na przykład ChatGPT, Gemini albo Copilot.

| Zadanie | Narzędzie | Dlaczego |
|---|---|---|
| odczyt faktury kosztowej | program do faktur | dane trafiają od razu do księgi |
| wysyłka i odbiór w KSeF | program do faktur | ma połączenie z systemem |
| zestawienie zaległych płatności | asystent AI | pracuje na wyeksportowanej tabeli |
| przypomnienie o płatności | asystent AI | pisze szkic maila |
| sprawdzenie faktury z umową | asystent AI | porównuje dwa dokumenty |

> Program wprowadza dane. Asystent AI pomaga je zrozumieć i działać.

## Co robią programy do faktur z AI

Popularne polskie programy już odczytują faktury same. Kilka przykładów ze stron producentów, stan na listopad 2026 roku:

- **Fakturownia.** Funkcja OCR, czyli odczyt tekstu z dokumentu, zapisuje dane z faktur kosztowych.
- **wFirma.** Narzędzie Magic Box przyjmuje masowo faktury zakupu i pliki JPK.

Inne programy mają podobne funkcje pod różnymi nazwami. W ustawieniach warto szukać haseł „odczyt faktur”, „OCR” albo „KSeF”.

wFirma zaznacza ważną rzecz. Funkcje AI mają wspierać, nie decydować. Zatwierdzenie albo korekta należy do użytkownika.

Fakturownia podaje też połączenie z KSeF w cenie 0 zł. To ważne, bo KSeF jest już obowiązkowy.

## Co AI ma wspólnego z KSeF

KSeF to Krajowy System e-Faktur. Od 1 kwietnia 2026 roku większość firm musi w nim wystawiać faktury. Największe firmy zaczęły 1 lutego.

Jest jeszcze ułatwienie dla najmniejszych firm. Do 31 grudnia 2026 roku faktury poza KSeF wolno wystawiać, jeśli ich suma w miesiącu nie przekracza 10 000 zł z VAT. Od stycznia to ułatwienie przestaje działać.

Dla biura to dobra wiadomość. Program połączony z KSeF sam pobiera faktury z systemu. Przepisywania jest mniej.

Szczegóły rozliczeń warto potwierdzić z księgową. Ten tekst nie zastępuje porady podatkowej.

## Zestawienie zaległych płatności z ChatGPT

Program do faktur pozwala zwykle wyeksportować listę faktur do Excela. Taką tabelę asystent AI zamienia w czytelne zestawienie.

```
Poniżej lista wystawionych faktur: numer, kontrahent, kwota, termin, status.
Zrób tabelę zaległych płatności od najstarszej.
Dodaj kolumnę: ile dni po terminie.
Pod tabelą wypisz 3 kontrahentów z największą zaległą kwotą.
Lista: [wkleić]
```

Przed wklejeniem warto usunąć dane osób prywatnych. Nazwy firm i kwoty zwykle wystarczą.

Więcej pracy na tabelach: [AI w Excelu](/blog/ai-w-excelu).

## Sprawdzenie faktury z umową albo ofertą

Asystent AI porówna fakturę z ustaleniami. Wyłapie inną cenę, inny termin albo pozycję, której nie było w umowie.

```
Porównaj fakturę z ofertą poniżej.
Wypisz różnice w tabeli: pozycja, w ofercie, na fakturze.
Jeśli wszystko się zgadza, napisz „brak różnic”.
Nie oceniaj, czy faktura jest poprawna podatkowo.
Oferta: [wkleić]
Faktura: [wkleić]
```

Ostatnia linijka polecenia jest ważna. Ocenę podatkową robi księgowa, nie AI.

Mail z przypomnieniem o płatności jest gotowy w tekście [AI do pisania maili](/blog/ai-do-pisania-maili).

## Czego nie wklejać do AI przy fakturach

Faktura od jednoosobowej firmy albo dla osoby prywatnej zawiera dane osobowe. PARP ostrzega, że pracownicy często wpisują do publicznych narzędzi AI poufne dane o klientach i finansach.

Dwie zasady wystarczą:

- **Konto firmowe, nie prywatne.** Treści z prywatnego ChatGPT mogą służyć do trenowania modeli, a plan firmowy daje umowę o przetwarzaniu danych.
- **Tylko potrzebne kolumny.** Do zestawienia wystarczy numer, firma, kwota i termin.

Szczegóły: [ChatGPT a RODO](/blog/chatgpt-a-rodo-dane-klientow). W sprawach danych osobowych decyduje inspektor ochrony danych albo prawnik.

## Plan na pierwszy tydzień

Wystarczy jedna osoba z biura i godzina dziennie.

1. Sprawdzić, czy program do faktur ma odczyt dokumentów i połączenie z KSeF.
2. Włączyć odczyt i wgrać 10 faktur kosztowych z ostatniego miesiąca.
3. Porównać odczytane dane z papierem: kwoty, numery, terminy.
4. Wyeksportować listę faktur i zrobić zestawienie zaległości poleceniem z tego tekstu.
5. Zapisać polecenia, które zadziałały, we wspólnym dokumencie.

Po tygodniu widać, ile ręcznego przepisywania zniknęło. Wtedy łatwiej zdecydować o kolejnych krokach.

Cały plan wdrożenia AI w firmie: [jak wdrożyć AI w firmie](/blog/jak-wdrozyc-ai-w-firmie).

## Najczęstsze pytania

### Czy ChatGPT wystawi fakturę?

Nie w KSeF. Fakturę wystawia program do faktur połączony z KSeF. ChatGPT może pomóc przygotować opis usługi albo sprawdzić dane przed wystawieniem.

### Czy odczyt faktur przez AI jest bezbłędny?

Nie. wFirma zaznacza, że AI tylko proponuje wartości, a zatwierdza człowiek. Przy każdej odczytanej fakturze warto sprawdzić kwotę i numer.

### Czy biuro rachunkowe może używać AI do faktur klientów?

Może, z umową z dostawcą i zgodnie z zasadami ochrony danych. Szerzej w tekście [AI w biurze rachunkowym](/blog/ai-w-biurze-rachunkowym).

### Od czego zacząć?

Od sprawdzenia, czy obecny program ma odczyt faktur i połączenie z KSeF. Potem jedno zestawienie zaległości z asystentem AI, raz w tygodniu, przez miesiąc.
