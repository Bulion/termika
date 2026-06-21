# Termika

> Nauka teorii lotniczej, która zostaje w głowie.

[![Licencja: GPL-3.0](https://img.shields.io/badge/Licencja-GPL--3.0-blue.svg)](LICENSE)
&nbsp;**🇵🇱 Polski** · [🇬🇧 English](README.en.md)

**Termika** to otwarta aplikacja webowa do nauki teorii lotniczej do egzaminów na licencje pilota.
Pierwszą obsługiwaną licencją (MVP) jest **SPL** - licencja pilota szybowcowego. Aplikacja jest
w pełni „data-driven": kolejne licencje i tematy dodaje się jako dane, bez zmian w kodzie.

Działa w przeglądarce, **offline** (PWA), **bez kont i bez backendu** - całość Twoich postępów
zostaje na Twoim urządzeniu.

## Dlaczego Termika

Większość stron do nauki oferuje wyłącznie testy wielokrotnego wyboru. „Przeklikanie" bazy pytań
słabo uczy - łatwo zapamiętać wzór odpowiedzi zamiast zrozumieć materiał.

Termika **dobiera metodę nauki do typu wiedzy**: inaczej uczy się skrótów, inaczej wartości
liczbowych, a jeszcze inaczej decyzji w locie. Egzamin to dopiero sprawdzian na końcu, a nie
jedyne narzędzie nauki.

## Co potrafi

### Nauka dopasowana do typu wiedzy

- **Fiszki z powtórkami rozłożonymi w czasie** (algorytm FSRS) - aktywne przypominanie i ocena
  trudności; materiał wraca dokładnie wtedy, gdy zaczynasz go zapominać.
- **Trener skrótów** - skróty lotnicze w obie strony (skrót → znaczenie i znaczenie → skrót).
- **Kojarzenie pojęć z wartościami** - limity, minima, prędkości i progi „do wyklikania z głowy".
- **Scenariusze decyzyjne** - sytuacje w locie, w których planujesz reakcję, a potem porównujesz
  ją z wzorcową listą kontrolną.

### Ćwiczenia na czas (generowane parametrycznie)

Wartości są losowane przy każdym podejściu, więc nie da się ich po prostu zapamiętać:

- przeliczenia jednostek, reguły nawigacyjne, paliwo i masa,
- kursy: **deklinacja i dewiacja** (rzeczywisty ↔ magnetyczny ↔ kompasowy),
- **trójkąt wiatru** (strona wiatru E6B): prędkość względem ziemi i kurs do utrzymania,
- osiągi: wysokość ciśnieniowa i gęstościowa, zasięg ślizgu, temperatura ISA,
- obliczenia szybowcowe: wydłużenie skrzydła, współczynnik obciążenia i prędkość przeciągnięcia
  w zakręcie.

### Quizy aktywnego przypominania

- **Alfabet fonetyczny ICAO**, **kody METAR/TAF** oraz zestawy **kluczowych faktów** dla każdego
  przedmiotu - odpowiedź się wpisuje, a nie wybiera.

### Interaktywny komputer E6B

Wierna, w pełni interaktywna replika wiatrakowego kalkulatora nawigacyjnego (przelicznik
logarytmiczny + strona wiatru), przystosowana do sterowania dotykiem, otwierana jako płynny
panel obok pytań.

### Egzamin / symulacja ULC

- **Oficjalna baza pytań ULC LKE (1354 pytania)** z **własnym, niezależnie zweryfikowanym kluczem
  odpowiedzi**, oraz mniejszy zestaw kuratorski.
- Tryb per-przedmiot, a do każdego pytania uzasadnienie i odniesienie do przepisu lub zasady.

### Twoje dane zostają u Ciebie

- Postępy zapisywane lokalnie (IndexedDB), **eksport i import do pliku JSON**.
- **Offline** (PWA), pełna responsywność (telefon/tablet/desktop, dowolny układ), **motyw jasny
  i ciemny**, interfejs **PL/EN**.

## Wiarygodność i zastrzeżenia

- Treść pytań egzaminacyjnych pochodzi z **oficjalnej, publicznej bazy ULC** i została
  zweryfikowana co do treści z oficjalnym dokumentem PDF.
- **Klucz odpowiedzi jest nasz**: wygenerowany niezależnie przez model językowy i poddany kontroli
  krzyżowej; pytania sporne rozstrzygał osobny, silniejszy model. Pojedyncze pozycje oznaczono
  jako wymagające weryfikacji.
- Termika jest **nieoficjalną pomocą w nauce** i nie jest powiązana z ULC. Nie zastępuje
  oficjalnych materiałów ani szkolenia - w razie wątpliwości zawsze sprawdzaj źródło.

## Licencja

Kod i treści autorskie: **GPL-3.0-or-later** (zob. [LICENSE](LICENSE)). Oficjalne pytania ULC
pozostają publicznym materiałem urzędowym.

---

## Rozwój (development)

### Stos technologiczny

- **SvelteKit 2 / Svelte 5** (runy) + **adapter-static** (SPA, hostowanie na GitHub Pages)
- **ts-fsrs** (powtórki), **Dexie** (IndexedDB), **Zod** (walidacja danych)
- **Paraglide** (i18n PL/EN), **vite-plugin-pwa** (offline), **convert-units**, **Chart.js**
- Testy: **Vitest** (jednostkowe + komponentowe w przeglądarce), **Playwright** (E2E)
- Jakość: **ESLint**, **Prettier**, **stylelint**, **svelte-check**, hooki **Husky**

### Szybki start

```bash
git clone <repo>
cd licencjeLotnicze
npm install        # instaluje zależności i hooki gita
npm run dev        # serwer deweloperski
```

Produkcyjnie:

```bash
npm run build      # statyczny build do ./build
npm run preview    # lokalny podgląd builda
```

### Przydatne skrypty

| Skrypt                                                       | Opis                                             |
| ------------------------------------------------------------ | ------------------------------------------------ |
| `npm run dev` / `build` / `preview`                          | tryb deweloperski / build / podgląd              |
| `npm run check`                                              | sprawdzanie typów (svelte-check)                 |
| `npm run lint` / `format`                                    | Prettier + ESLint + stylelint                    |
| `npm run test:unit` / `test:component` / `test:e2e` / `test` | testy                                            |
| `npm run messages`                                           | kompilacja tłumaczeń Paraglide                   |
| `npm run gen:e6b`                                            | generowanie statycznych grafik SVG komputera E6B |
| `npm run assemble:content`                                   | montaż treści z danych źródłowych                |

### Struktura projektu

```
src/lib/content   treść data-driven: decki, taksonomia (przedmioty + cele), schematy Zod
src/lib/drills    silnik ćwiczeń na czas + dane JSON
src/lib/quiz      silnik quizów (wpisywana odpowiedź) + dane JSON
src/lib/engine    scheduler FSRS, Dexie, budowa sesji, postępy
src/lib/e6b       interaktywny komputer E6B
src/lib/exam      silnik egzaminu i źródła pytań
src/routes        strony: nauka, ćwiczenia, egzamin, postępy
static/external   ulc-spl.json - oficjalna baza pytań SPL
```

### Zasady pracy

- Treść jest **danymi** - nowe pytania, fiszki czy ćwiczenia dodaje się przez pliki JSON
  walidowane schematami Zod, bez zmian w kodzie silnika.
- Każdy commit przechodzi **lint i pełne testy** (wymuszone hookiem `pre-commit`).
- Stylistyka ma **jedno źródło prawdy** (design tokens); motywy to nadpisanie zestawu zmiennych.
- Pull requesty i zgłoszenia są mile widziane.
