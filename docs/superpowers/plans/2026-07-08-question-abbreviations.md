# Question Abbreviations in Glossary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add every genuine aviation abbreviation found in committed question content (~150 curated entries) to `src/lib/quiz/data/abbreviations.json`, with guard tests for glossary data integrity.

**Architecture:** Pure content change. Entries appended to the existing quiz-set file flow automatically into the tooltip map (`buildGlossary`), the `/study/glossary` page (`glossaryGroups`), and the "Skróty lotnicze" drill. Two new invariant tests in `src/lib/glossary/data.spec.ts`.

**Tech Stack:** JSON content validated by `quizSetSchema` (zod), Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-08-question-abbreviations-glossary-design.md`.
- Existing 22 pairs in `abbreviations.json` unchanged; new entries appended after them, sorted alphabetically by `a.pl`.
- `static/external/ulc-spl.json` and `McqQuestion.svelte` (`glossary={false}`) NOT modified.
- Entry format: `id` = `abbr-` + token lowercased, spaces and non-ascii transliterated to ascii-with-hyphens (PAN PAN → `abbr-pan-pan`, PAŻP → `abbr-pazp`); `b.pl` = canonical expansion (English for international terms, Polish for Polish institutions/notation); every entry has `hint.pl` AND `hint.en`.
- `keywordsB` for every expansion of 3+ significant words: one group per distinctive content word, with spelling variants where common (organisation/organization); filler words (of, the, for, and, w, do) never used as keywords.
- No em-dash in content; Polish diacritics correct in Polish text.
- Conventional commits, no AI attribution. Pre-commit hook (prettier + svelte-check + unit suite) is slow; let it finish.
- Full suite `npm test` must stay green, including glossary e2e and drills e2e.

---

### Task 1: Glossary data-integrity guard tests

**Files:**

- Modify: `src/lib/glossary/data.spec.ts` (append a describe block)

**Interfaces:**

- Consumes: `glossaryGroups` from `./data`, raw JSON imports of the three source files.
- Produces: regression net for Task 2 (duplicate tokens across source files, missing hints in abbreviations.json).

- [ ] **Step 1: Append the guard tests**

Add imports at the top of `src/lib/glossary/data.spec.ts` (alongside existing imports):

```ts
import aeroTerms from './aero-terms.json';
import abbreviations from '../quiz/data/abbreviations.json';
import metarCodes from '../quiz/data/metar-codes.json';
```

Append the describe block:

```ts
describe('glossary source data integrity', () => {
	it('has no duplicate terms across the three source files', () => {
		const tokens = [
			...aeroTerms.map((p) => p.a.pl),
			...abbreviations.pairs.map((p) => p.a.pl),
			...metarCodes.pairs.map((p) => p.a.pl)
		];
		const duplicates = tokens.filter((t, i) => tokens.indexOf(t) !== i);
		expect(duplicates).toEqual([]);
	});

	it('gives every abbreviation pair a hint for its tooltip', () => {
		const missing = abbreviations.pairs.filter((p) => !p.hint).map((p) => p.a.pl);
		expect(missing).toEqual([]);
	});
});
```

If TypeScript rejects the JSON imports' shape, cast via the existing `Pair` pattern used in `data.ts` (`as { pairs: { a: { pl: string }; hint?: unknown }[] }`).

- [ ] **Step 2: Run the tests - both must PASS on current data**

Run: `npx vitest run --project=server src/lib/glossary/data.spec.ts`
Expected: PASS (these are invariants that already hold; they exist to catch Task 2 mistakes).

- [ ] **Step 3: Commit**

```bash
git add src/lib/glossary/data.spec.ts
git commit -m "test: guard glossary term uniqueness and abbreviation hints"
```

---

### Task 2: Author the curated entries

**Files:**

- Modify: `src/lib/quiz/data/abbreviations.json` (append to `pairs` after the existing 22)

**Interfaces:**

- Consumes: existing `pairs` array; `quizSetSchema` validates on load.
- Produces: ~150 new pairs, alphabetical by `a.pl`, every one with `hint.pl` + `hint.en`.

The complete curated entry set follows, grouped by domain for review; in the JSON they are appended as ONE alphabetically-sorted-by-`a.pl` sequence. Format per line: `TOKEN | b.pl | hint.pl | hint.en` (+ `acceptB`/`keywordsB` notes where non-obvious; the Global Constraints keywordsB rule applies to all 3+ word expansions).

**Institutions and bodies:**

```
ICAO | International Civil Aviation Organization | Organizacja Międzynarodowego Lotnictwa Cywilnego, agenda ONZ ustanawiająca normy (konwencja chicagowska) | UN agency setting worldwide civil aviation standards ; keywordsB [[international],[civil],[aviation],[organization|organisation]]
ULC | Urząd Lotnictwa Cywilnego | polski nadzór lotniczy: licencje, rejestry, nadzór nad bezpieczeństwem | Polish Civil Aviation Authority
EASA | European Union Aviation Safety Agency | Agencja UE ds. Bezpieczeństwa Lotniczego; wydaje Part-FCL, CS itd. | EU aviation safety agency issuing Part-FCL and CS rules
PANSA | Polska Agencja Żeglugi Powietrznej | angielski akronim PAŻP; zapewnia służby żeglugi powietrznej w FIR Warszawa | Polish Air Navigation Services Agency
PAŻP | Polska Agencja Żeglugi Powietrznej | zapewnia służby żeglugi powietrznej w FIR Warszawa (ang. PANSA) | Polish Air Navigation Services Agency (Polish acronym)
PKBWL | Państwowa Komisja Badania Wypadków Lotniczych | polska komisja badająca wypadki i incydenty lotnicze | Polish aircraft accident investigation commission
WMO | World Meteorological Organization | Światowa Organizacja Meteorologiczna, agenda ONZ | UN agency for meteorology
IMGW | Instytut Meteorologii i Gospodarki Wodnej | polska państwowa służba meteorologiczna | Polish national meteorological service
UKE | Urząd Komunikacji Elektronicznej | polski urząd wydający świadectwa radiooperatora | Polish telecom authority issuing radio operator certificates
ITU | International Telecommunication Union | Międzynarodowy Związek Telekomunikacyjny; przydziela pasma częstotliwości | UN agency allocating radio frequency bands
ECAC | European Civil Aviation Conference | Europejska Konferencja Lotnictwa Cywilnego | intergovernmental European civil aviation body
AOPA | Aircraft Owners and Pilots Association | stowarzyszenie właścicieli i pilotów statków powietrznych | aircraft owners and pilots association
NACA | National Advisory Committee for Aeronautics | poprzednik NASA; stąd oznaczenia profili lotniczych (np. NACA 4412) | US body known for airfoil designations, predecessor of NASA
AGARD | Advisory Group for Aerospace Research and Development | grupa badawcza NATO ds. lotnictwa i kosmonautyki | NATO aerospace research group
BFU | Bundesstelle für Flugunfalluntersuchung | niemiecka komisja badania wypadków lotniczych | German aircraft accident investigation board
JAR | Joint Aviation Requirements | dawne wspólne europejskie przepisy lotnicze (JAA), poprzednik przepisów EASA | former joint European aviation requirements preceding EASA
SES | Single European Sky | Jednolita Europejska Przestrzeń Powietrzna, program UE | EU single European sky programme
ERC | European Resuscitation Council | Europejska Rada Resuscytacji; wytyczne pierwszej pomocy i RKO | European Resuscitation Council issuing CPR guidelines
```

**Licensing, training, medical certification:**

```
FCL | Flight Crew Licensing | Part-FCL: unijne przepisy licencjonowania załóg lotniczych | EU flight crew licensing rules (Part-FCL)
SPL | Sailplane Pilot Licence | licencja pilota szybowcowego | sailplane (glider) pilot licence ; acceptB ["Sailplane Pilot License"]
LAPL | Light Aircraft Pilot Licence | licencja pilota lekkich statków powietrznych; także uproszczone orzeczenie "LAPL medical" | light aircraft pilot licence and the simplified LAPL medical
PPL | Private Pilot Licence | licencja pilota turystycznego | private pilot licence ; acceptB ["Private Pilot License"]
BPL | Balloon Pilot Licence | licencja pilota balonowego | balloon pilot licence
CPL | Commercial Pilot Licence | licencja pilota zawodowego | commercial pilot licence
ATPL | Airline Transport Pilot Licence | licencja pilota liniowego | airline transport pilot licence
MED | Part-MED | unijne wymagania medyczne: orzeczenia lotniczo-lekarskie dla załóg | EU aircrew medical requirements (Part-MED)
AME | Aero-Medical Examiner | lekarz orzecznik medycyny lotniczej | aviation medical examiner
GMP | General Medical Practitioner | lekarz ogólny; w niektórych państwach może wydać orzeczenie LAPL | general practitioner, may issue LAPL medicals in some states
ATO | Approved Training Organisation | zatwierdzony ośrodek szkolenia lotniczego | approved training organisation ; acceptB ["Approved Training Organization"]
ORA | Organisation Requirements for Aircrew | Part-ORA: wymagania dla organizacji lotniczych (m.in. ATO) | EU organisation requirements for aircrew (Part-ORA)
FI | Flight Instructor | instruktor lotniczy; szybowcowy to FI(S) | flight instructor, FI(S) for sailplanes
FSTD | Flight Simulation Training Device | szkoleniowe urządzenie symulacji lotu | flight simulation training device
IR | Instrument Rating | uprawnienie do lotów według wskazań przyrządów | instrument rating
EIR | En-route Instrument Rating | uprawnienie do lotu IFR po trasie, bez podejść instrumentalnych | en-route instrument rating
TMG | Touring Motor Glider | motoszybowiec turystyczny | touring motor glider
ARC | Airworthiness Review Certificate | poświadczenie przeglądu zdatności do lotu; potwierdza ważność świadectwa zdatności | airworthiness review certificate validating the certificate of airworthiness
AMC | Acceptable Means of Compliance / Airspace Management Cell | 1) akceptowalne sposoby spełnienia przepisów EASA; 2) komórka zarządzania przestrzenią powietrzną (publikuje AUP) | 1) EASA acceptable means of compliance; 2) airspace management cell
AOC | Air Operator Certificate | certyfikat przewoźnika lotniczego | air operator certificate
KNC | kabina niskich ciśnień | komora do badania odporności na niedotlenienie wysokościowe | hypobaric (low-pressure) chamber
PIC | Pilot In Command | pilot dowódca statku powietrznego | pilot in command
```

**Airspace and air traffic services:**

```
ATS | Air Traffic Services | służby ruchu lotniczego: kontrola, informacja powietrzna, służba alarmowa | air traffic services
FIS | Flight Information Service | służba informacji powietrznej | flight information service
AFIS | Aerodrome Flight Information Service | lotniskowa służba informacji powietrznej | aerodrome flight information service
AIS | Aeronautical Information Service | służba informacji lotniczej; publikuje AIP i NOTAM | aeronautical information service
FIR | Flight Information Region | rejon informacji powietrznej; polski to FIR Warszawa (EPWW) | flight information region
CTR | Control Zone | strefa kontrolowana lotniska, od ziemi do określonej granicy pionowej | aerodrome control zone
TMA | Terminal Manoeuvring Area | rejon kontrolowany lotniska lub węzła lotnisk | terminal manoeuvring area
CTA | Control Area | obszar kontrolowany | control area
ATZ | Aerodrome Traffic Zone | strefa ruchu lotniskowego wokół lotniska niekontrolowanego | aerodrome traffic zone
MATZ | Military Aerodrome Traffic Zone | strefa ruchu lotniskowego lotniska wojskowego | military aerodrome traffic zone
MCTR | Military Control Zone | wojskowa strefa kontrolowana lotniska | military control zone
TSA | Temporary Segregated Area | strefa czasowo wydzielona; wlot w czasie aktywności zabroniony | temporary segregated area
TRA | Temporary Reserved Area | strefa czasowo rezerwowana; wlot możliwy za zgodą organu | temporary reserved area
CBA | Cross-Border Area | strefa transgraniczna po obu stronach granicy państwa | cross-border segregated area
RMZ | Radio Mandatory Zone | strefa obowiązkowej łączności radiowej | radio mandatory zone
ADIZ | Air Defence Identification Zone | strefa identyfikacji obrony powietrznej | air defence identification zone
FUA | Flexible Use of Airspace | koncepcja elastycznego użytkowania przestrzeni powietrznej | flexible use of airspace concept
AUP | Airspace Use Plan | dobowy plan użytkowania przestrzeni powietrznej publikowany przez AMC | daily airspace use plan
UUP | Updated Airspace Use Plan | śróddobowa aktualizacja planu AUP | updated airspace use plan
ASM | Airspace Management | zarządzanie przestrzenią powietrzną | airspace management
ATM | Air Traffic Management | zarządzanie ruchem lotniczym: ATC, ASM i przepływ ruchu | air traffic management
CNS | Communication Navigation Surveillance | służby łączności, nawigacji i dozorowania | communication, navigation and surveillance services
SAR | Search and Rescue | służba poszukiwania i ratownictwa lotniczego | search and rescue
MRT | Military Route | trasa lotnictwa wojskowego (element FUA) | military training route
ARP | Aerodrome Reference Point | punkt odniesienia lotniska; jego nominalne położenie geograficzne | aerodrome reference point
TWR | Tower | organ kontroli lotniska (wieża) | aerodrome control tower
APP | Approach Control | organ kontroli zbliżania | approach control unit
ACC | Area Control Centre | ośrodek kontroli obszaru | area control centre
GND | Ground | kontrola ruchu naziemnego; na mapach: poziom ziemi | ground control; ground level on charts
RWY | Runway | droga startowa | runway
SVFR | Special VFR | lot specjalny VFR w CTR poniżej VMC, za zezwoleniem ATC | special VFR flight in a control zone below VMC
VMC | Visual Meteorological Conditions | warunki meteorologiczne dla lotów z widocznością | visual meteorological conditions
IMC | Instrument Meteorological Conditions | warunki wymagające lotu według przyrządów | instrument meteorological conditions
VLOS | Visual Line Of Sight | operacje bezzałogowców w zasięgu widoczności wzrokowej | drone operations within visual line of sight
BVLOS | Beyond Visual Line Of Sight | operacje bezzałogowców poza zasięgiem widoczności wzrokowej | drone operations beyond visual line of sight
```

**Rules and publications:**

```
SERA | Standardised European Rules of the Air | ujednolicone europejskie przepisy ruchu lotniczego | standardised European rules of the air
PANS | Procedures for Air Navigation Services | procedury ICAO dla służb żeglugi powietrznej | ICAO procedures for air navigation services
AIP | Aeronautical Information Publication | Zbiór Informacji Lotniczych państwa | aeronautical information publication
IAIP | Integrated Aeronautical Information Package | Zintegrowany Pakiet Informacji Lotniczych: AIP, suplementy, NOTAM, AIC | integrated aeronautical information package
GEN | General | część ogólna AIP (np. tabele wschodów słońca w GEN 2.7) | the general part of the AIP
ENR | En-Route | część trasowa AIP: przestrzeń, strefy, trasy | the en-route part of the AIP
AD | Airworthiness Directive / Aerodromes | 1) dyrektywa zdatności, prawnie obowiązkowa; 2) część lotniskowa AIP | 1) mandatory airworthiness directive; 2) the aerodromes part of the AIP
CS | Certification Specifications | specyfikacje certyfikacyjne EASA; szybowce to CS-22 | EASA certification specifications, CS-22 for sailplanes
TSO | Technical Standard Order | norma techniczna wyposażenia lotniczego | technical standard order for aviation equipment
SB | Service Bulletin | biuletyn serwisowy producenta; zwykle zalecenie, obowiązkowy gdy nakazany przez AD | manufacturer's service bulletin
AFM | Aircraft Flight Manual | instrukcja użytkowania w locie | aircraft flight manual
IUL | Instrukcja Użytkowania w Locie | polska nazwa instrukcji AFM | Polish term for the aircraft flight manual
POH | Pilot's Operating Handbook | podręcznik operacyjny pilota, odpowiednik AFM | pilot's operating handbook
FM | Flight Manual | instrukcja lotu (krótsza forma AFM) | flight manual
FPL | Flight Plan | plan lotu (formularz ICAO) | ICAO flight plan form
EPWA | kod ICAO lotniska Chopina w Warszawie | czteroliterowy wskaźnik lokalizacji ICAO; EP oznacza Polskę | ICAO location indicator of Warsaw Chopin Airport
EPWW | kod ICAO FIR Warszawa | wskaźnik lokalizacji polskiego rejonu informacji powietrznej | ICAO location indicator of the Warsaw FIR
SP | znaki rejestracyjne Polski | prefiks znaków rozpoznawczych polskich statków powietrznych (SP-) | Polish aircraft registration prefix
```

**Radio and surveillance:**

```
VHF | Very High Frequency | fale metrowe 30-300 MHz; łączność lotnicza 118-136,975 MHz | very high frequency band used for air-ground voice
UHF | Ultra High Frequency | fale decymetrowe 300-3000 MHz, głównie łączność wojskowa | ultra high frequency band
UKF | fale ultrakrótkie | polska nazwa pasma VHF | Polish term for the VHF band
MF | Medium Frequency | fale średnie 300-3000 kHz | medium frequency band
AM | Amplitude Modulation | modulacja amplitudy, stosowana w lotniczej łączności VHF | amplitude modulation used in aviation VHF
DSB | Double SideBand | modulacja dwuwstęgowa (DSB-AM, oznaczenie A3E) | double sideband modulation (DSB-AM)
PTT | Push To Talk | przycisk nadawania radiostacji; łączność simpleksowa | push-to-talk transmit switch
SQ | Squelch | blokada szumów odbiornika | receiver squelch
AFTN | Aeronautical Fixed Telecommunication Network | stała lotnicza sieć telekomunikacyjna (depesze, plany lotu) | aeronautical fixed telecommunication network
SSR | Secondary Surveillance Radar | radar wtórny; odpytuje transponder (kody squawk) | secondary surveillance radar
SPI | Special Position Identification | impuls specjalnej identyfikacji nadawany funkcją IDENT | special position identification pulse
STBY | Standby | tryb czuwania transpondera: zasilony, nie odpowiada | transponder standby mode
IDENT | Identification | funkcja transpondera wysyłająca SPI na żądanie SQUAWK IDENT | transponder ident function
SQUAWK | kod transpondera | polecenie ustawienia kodu transpondera, np. squawk 7000 | transponder code setting instruction
CRM | Crew Resource Management | zarządzanie zasobami załogi: komunikacja, decyzje, współpraca | crew resource management
```

**Radio phraseology calls:**

```
MAYDAY | wezwanie w niebezpieczeństwie | sygnał zagrożenia, nadawany trzykrotnie; bezwzględne pierwszeństwo | distress call, spoken three times
PAN PAN | wezwanie pilności | sytuacja pilna bez bezpośredniego zagrożenia życia | urgency call
ROGER | odebrałem | potwierdzenie odbioru całej transmisji; nie oznacza zgody | I have received all of your last transmission
WILCO | wykonam | zrozumiałem i wykonam polecenie (will comply) | I understand and will comply
AFFIRM | tak | potwierdzenie twierdzące w frazeologii | yes in radiotelephony
UNABLE | nie mogę wykonać | odmowa wykonania polecenia | cannot comply with the instruction
SAY AGAIN | powtórz | prośba o powtórzenie transmisji lub jej części | request to repeat the transmission
READ BACK | powtórz treść | polecenie powtórzenia otrzymanej treści w celu potwierdzenia | repeat the message back for confirmation
STAND BY | czekaj | poczekaj, wywołam ponownie | wait and I will call you
WORDS TWICE | słowa dwukrotnie | przy trudnej łączności każde słowo nadawane jest dwa razy | each word sent twice due to difficult communications
BREAK | przerwa | oddziela części depeszy lub depesze do różnych adresatów | separator between message portions
BLIND | transmisja w ciemno | nadawanie bez potwierdzenia odbioru przy braku łączności zwrotnej | blind transmission without acknowledgement
SOS | sygnał niebezpieczeństwa | międzynarodowy telegraficzny sygnał alarmowy (Morse) | international Morse distress signal
```

**Alert phases:**

```
INCERFA | faza niepewności | pierwsza faza alarmowa: niepewność co do bezpieczeństwa statku | uncertainty phase
ALERFA | faza alarmowa | druga faza: obawa o bezpieczeństwo statku powietrznego | alert phase
DETRESFA | faza niebezpieczeństwa | trzecia faza: uzasadniona pewność zagrożenia; uruchamia SAR | distress phase
```

**Meteorology:**

```
ISA | International Standard Atmosphere | atmosfera wzorcowa: 15°C i 1013,25 hPa na poziomie morza, gradient 0,65°C/100 m | international standard atmosphere
DALR | Dry Adiabatic Lapse Rate | gradient suchoadiabatyczny, około 1°C/100 m | dry adiabatic lapse rate, about 3°C per 1000 ft
SALR | Saturated Adiabatic Lapse Rate | gradient wilgotnoadiabatyczny, około 0,6°C/100 m | saturated adiabatic lapse rate
CCL | Convective Condensation Level | poziom kondensacji konwekcyjnej; podstawa chmur konwekcyjnych | convective condensation level
SWC | Significant Weather Chart | mapa istotnych zjawisk pogody | significant weather chart
GAFOR | General Aviation Forecast | prognoza obszarowa dla lotnictwa ogólnego z kodami warunków VFR | general aviation area forecast
SIGMET | Significant Meteorological Information | ostrzeżenie przed groźnymi zjawiskami pogody | significant weather warning
AIRMET | Airmen's Meteorological Information | ostrzeżenie o zjawiskach istotnych dla lotów na małych wysokościach | weather advisory for low-level flights
SPECI | Special Report | specjalna depesza obserwacyjna wydawana przy istotnej zmianie pogody | special weather report issued on significant change
TREND | prognoza TREND | dwugodzinna prognoza zmian dołączana do METAR (BECMG, TEMPO, NOSIG) | two-hour landing forecast appended to a METAR
SYNOP | depesza synoptyczna | kod obserwacji naziemnych stacji synoptycznych WMO | WMO surface synoptic observation code
CAT | Clear Air Turbulence | turbulencja w czystym powietrzu, bez chmur, np. przy prądzie strumieniowym | clear air turbulence
```

**Pressure settings and Q-codes:**

```
QNH | ciśnienie zredukowane do poziomu morza | nastawa wysokościomierza wskazująca wysokość nad poziomem morza | altimeter setting giving altitude above mean sea level
QFE | ciśnienie na poziomie lotniska | nastawa wskazująca wysokość względną nad lotniskiem | altimeter setting giving height above the aerodrome
QNE | ciśnienie standardowe | nastawa 1013,25 hPa; wysokościomierz wskazuje poziom lotu | standard setting 1013.25 hPa for flight levels
QFF | ciśnienie zredukowane meteorologicznie | ciśnienie sprowadzone do poziomu morza według temperatury rzeczywistej; mapy synoptyczne | MSL pressure reduced with actual temperature for synoptic charts
QDM | namiar magnetyczny do stacji | kierunek magnetyczny od statku powietrznego do stacji | magnetic bearing to the station
QDR | namiar magnetyczny od stacji | kierunek magnetyczny od stacji do statku; przeciwny do QDM | magnetic bearing from the station
```

**Time and navigation:**

```
UTC | Coordinated Universal Time | uniwersalny czas skoordynowany, odniesienie czasowe w lotnictwie | coordinated universal time
CET | Central European Time | czas środkowoeuropejski (UTC+1); Polska zimą | central European time, UTC+1
CEST | Central European Summer Time | czas środkowoeuropejski letni (UTC+2) | central European summer time, UTC+2
LMT | Local Mean Time | lokalny średni czas słoneczny | local mean time
ETE | Estimated Time Enroute | przewidywany czas przelotu odcinka lub trasy | estimated time en route
NM | Nautical Mile | mila morska: 1852 m, jedna minuta łuku południka | nautical mile, 1852 m
FL | Flight Level | poziom lotu: wysokość ciśnieniowa przy 1013,25 hPa w setkach stóp | flight level in hundreds of feet at standard setting
MSL | Mean Sea Level | średni poziom morza | mean sea level
MSA | Minimum Safe Altitude | minimalna bezpieczna wysokość bezwzględna | minimum safe altitude
MEF | Maximum Elevation Figure | najwyższy punkt terenu lub przeszkody w polu mapy VFR, w setkach stóp AMSL | maximum elevation figure on VFR charts
HDG | Heading | kurs: kierunek osi podłużnej statku powietrznego | heading
TRK | Track | ścieżka: rzeczywisty kierunek drogi nad ziemią | track over the ground
DTK | Desired Track | droga zadana: zaplanowany kierunek linii drogi | desired track
TH | True Heading | kurs rzeczywisty, od północy geograficznej | true heading
MH | Magnetic Heading | kurs magnetyczny | magnetic heading
CH | Compass Heading | kurs busoli | compass heading
TC | True Course | kąt drogi rzeczywistej (planowany kurs względem północy geograficznej) | true course
TT | True Track | droga rzeczywista od północy geograficznej | true track
MT | Magnetic Track | droga magnetyczna od północy magnetycznej | magnetic track
VAR | Variation | deklinacja magnetyczna: kąt między północą geograficzną a magnetyczną | magnetic variation
DEV | Deviation | dewiacja: błąd kompasu od pól magnetycznych statku | compass deviation
WCA | Wind Correction Angle | poprawka na wiatr: kąt między kursem a linią drogi | wind correction angle
TVMDC | True Variation Magnetic Deviation Compass | mnemonik kolejności przeliczania kursów | heading conversion order mnemonic
ANDS | Accelerate North Dive South | mnemonik błędu akceleracyjnego kompasu na kursach E/W | compass acceleration error mnemonic
UNOS | Undershoot North Overshoot South | mnemonik błędu zakrętowego kompasu | compass turning error mnemonic
KB | kurs busoli | kurs odczytany z busoli, przed poprawkami | compass heading in Polish navigation notation
KM | kurs magnetyczny | kurs busoli z uwzględnioną dewiacją | magnetic heading in Polish navigation notation
KR | kurs rzeczywisty | kurs magnetyczny z uwzględnioną deklinacją | true heading in Polish navigation notation
KDM | kąt drogi magnetycznej | kierunek linii drogi względem północy magnetycznej | magnetic track angle in Polish notation
KDR | kąt drogi rzeczywistej | kierunek linii drogi względem północy geograficznej | true track angle in Polish notation
NKDM | nakazany kąt drogi magnetycznej | zaplanowany kąt drogi względem północy magnetycznej | required magnetic track in Polish notation
NKDG | nakazany kąt drogi geograficznej | zaplanowany kąt drogi względem północy geograficznej | required true track in Polish notation
DME | Distance Measuring Equipment | radioodległościomierz: pomiar odległości skośnej od stacji | distance measuring equipment
GPS | Global Positioning System | satelitarny system wyznaczania pozycji | global positioning system
```

**Aerodynamics, mass and balance, airframe, fuel:**

```
MAC | Mean Aerodynamic Chord | średnia cięciwa aerodynamiczna; położenie środka ciężkości podaje się w %MAC | mean aerodynamic chord
MGC | Mean Geometric Chord | średnia cięciwa geometryczna: S/b | mean geometric chord
AR | Aspect Ratio | wydłużenie skrzydła: b²/S | wing aspect ratio
CL | Lift Coefficient | współczynnik siły nośnej (odpowiednik Cz) | lift coefficient
CD | Drag Coefficient | współczynnik siły oporu (odpowiednik Cx) | drag coefficient
SC | środek ciężkości | punkt przyłożenia wypadkowej siły ciężkości; położenie w %MAC lub od punktu DATUM | centre of gravity (Polish abbreviation)
MTOM | Maximum Take-Off Mass | maksymalna masa startowa | maximum take-off mass
TE | Total Energy | kompensacja energii całkowitej wariometru | total energy variometer compensation
VW | prędkość maksymalna za wyciągarką | ograniczenie prędkości przy starcie z wyciągarki | maximum winch-launch speed
VT | prędkość maksymalna za holem | ograniczenie prędkości przy starcie za samolotem holującym | maximum aerotow speed
VB | prędkość w silnej turbulencji | prędkość obliczeniowa przy maksymalnym podmuchu | design gust (rough air) speed
ASI | Airspeed Indicator | prędkościomierz | airspeed indicator
AVGAS | Aviation Gasoline | benzyna lotnicza; AVGAS 100LL jest barwiona na niebiesko | aviation gasoline
MOGAS | Motor Gasoline | benzyna samochodowa dopuszczona dla niektórych silników lotniczych | automotive gasoline approved for some aero engines
CO | tlenek węgla | czad: bezwonny gaz; ryzyko zatrucia przy nieszczelnym ogrzewaniu kabiny | carbon monoxide
CO2 | dwutlenek węgla | produkt oddychania; hiperwentylacja nadmiernie wypłukuje CO2 | carbon dioxide
OC | ubezpieczenie odpowiedzialności cywilnej | obowiązkowa polisa OC statku powietrznego | third-party liability insurance
```

**Human performance and medicine:**

```
TUC | Time of Useful Consciousness | czas użytecznej świadomości po utracie dopływu tlenu | time of useful consciousness
GLOC | G-induced Loss Of Consciousness | utrata przytomności wywołana przeciążeniem +Gz | g-induced loss of consciousness
LOC | Loss Of Consciousness | utrata przytomności; sekwencja: greyout, blackout, LOC | loss of consciousness
AGSM | Anti-G Straining Manoeuvre | manewr napięciowy zwiększający tolerancję przeciążeń | anti-g straining manoeuvre
DCS | Decompression Sickness | choroba dekompresyjna: pęcherzyki azotu przy spadku ciśnienia | decompression sickness
SD | Spatial Disorientation | dezorientacja przestrzenna | spatial disorientation
PTSD | Post-Traumatic Stress Disorder | zespół stresu pourazowego | post-traumatic stress disorder
RKO | resuscytacja krążeniowo-oddechowa | podstawowe zabiegi ratujące życie: uciśnięcia klatki i oddechy ratownicze | cardiopulmonary resuscitation (CPR) ; acceptB ["CPR"]
BLS | Basic Life Support | podstawowe zabiegi resuscytacyjne | basic life support
ATLS | Advanced Trauma Life Support | zaawansowane postępowanie ratunkowe w urazach | advanced trauma life support
IMSAFE | Illness Medication Stress Alcohol Fatigue Emotion | lista kontrolna samooceny gotowości pilota do lotu | pilot fitness self-check mnemonic
SHEL | Software Hardware Environment Liveware | model interfejsów człowiek-system w lotnictwie | human-factors interface model
DECIDE | Detect Estimate Choose Identify Do Evaluate | model podejmowania decyzji lotniczych | aeronautical decision-making mnemonic
```

- [ ] **Step 1: Append the entries**

Convert every line above to a pair object using the Global Constraints rules. Example conversion for the first line:

```json
{
	"id": "abbr-icao",
	"a": { "pl": "ICAO" },
	"b": { "pl": "International Civil Aviation Organization" },
	"keywordsB": [["international"], ["civil"], ["aviation"], ["organization", "organisation"]],
	"hint": {
		"pl": "Organizacja Międzynarodowego Lotnictwa Cywilnego, agenda ONZ ustanawiająca normy (konwencja chicagowska)",
		"en": "UN agency setting worldwide civil aviation standards"
	}
}
```

Append all entries to `pairs` after the existing 22, sorted alphabetically by `a.pl` (Polish collation: PAŻP after PANSA is fine by simple codepoint sort).

- [ ] **Step 2: Validate**

Run: `npx vitest run --project=server src/lib/glossary/data.spec.ts src/lib/quiz`
Expected: PASS - schema holds, no duplicate tokens, every pair hinted.

- [ ] **Step 3: Sanity-check coverage**

Run a scratchpad scan (same regex as the spec) confirming every curated token above now resolves in the glossary and none of the three source files contains a duplicate. Expected: 0 curated tokens missing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/quiz/data/abbreviations.json
git commit -m "feat: add question-bank aviation abbreviations to glossary"
```

---

### Task 3: Full verification and exclusion report

- [ ] **Step 1: Full suite**

Run: `npm test`
Expected: unit + component + e2e all PASS (glossary page, tooltips, drills).

- [ ] **Step 2: Report exclusions to the user**

Present the excluded-token report (categories: caps-emphasis ordinary words; phonetic alphabet and number pronunciations; callsign fragments and placeholders; coordinate axes and formula symbols; general non-aviation knowledge; unidentifiable tokens for rescue: IKCSP, CTO, RAC, INS, AWC, MPO, AHAC, POA, FNL, FRL, STD, VSB, GM, KE, KP). Also report the ULC bank typo MADAY (should be MAYDAY).
