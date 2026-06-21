export type E6bLocale = 'pl' | 'en';

export interface E6bStrings {
	front: string;
	back: string;
	reset: string;
	viewComputer: string;
	viewResults: string;
	tasAtDot: string;
	solveFind: string;
	solveWind: string;
	subtitle: string;
	targetTas: string;
	tasArc: string;
	hitOk: string;
	hitMiss: string;
	liveReadout: string;
	underIndex: string;
	gsUnderCentre: string;
	dotFromCentre: string;
	dotAngle: string;
	right: string;
	left: string;
	mathCheck: string;
	windFrom: string;
	windKt: string;
	tc: string;
	tasKt: string;
	stepsFindTitle: string;
	stepsFind: string[];
	stepsWindTitle: string;
	stepsWind: string[];
	task: string;
	taskTsd: string;
	taskFuel: string;
	gs: string;
	distance: string;
	timeMin: string;
	setDialsGs: string;
	burn: string;
	fuelGal: string;
	setDialsBurn: string;
	dialReadout: string;
	speedRate: string;
	underCursorA: string;
	underCursorB: string;
	cursorHint: string;
	offWheel: string;
	windAngleSpeed: string;
	headwind: string;
	crosswind: string;
	temperature: string;
	markerHint: string;
	howItWorksTitle: string;
	howItWorks: string[];
	timeResult: string;
	fuelResult: string;
}

const pl: E6bStrings = {
	front: 'Przód - przelicznik',
	back: 'Tył - wiatr',
	reset: 'Wyzeruj',
	viewComputer: 'Komputer',
	viewResults: 'Wyniki',
	tasAtDot: 'TAS pod kropką',
	solveFind: 'Szukam GS i WCA (znam wiatr)',
	solveWind: 'Szukam wiatru (znam GS i znos)',
	subtitle: 'Interaktywna replika - przeciągaj tarcze, kursor i kropkę wiatru',
	targetTas: 'Cel: TAS',
	tasArc: 'TAS (łuk docelowy)',
	hitOk: '✓ kropka na łuku TAS',
	hitMiss: 'przesuń siatkę, aż kropka trafi na niebieski łuk',
	liveReadout: 'Odczyt na żywo',
	underIndex: 'Pod indeksem',
	gsUnderCentre: 'Łuk pod środkiem (GS)',
	dotFromCentre: 'Kropka od środka',
	dotAngle: 'Kąt kropki (WCA)',
	right: '(w prawo)',
	left: '(w lewo)',
	mathCheck: 'Sprawdzenie matematyczne',
	windFrom: 'Wiatr z (°)',
	windKt: 'Wiatr (kt)',
	tc: 'TC (°)',
	tasKt: 'TAS (kt)',
	stepsFindTitle: 'Szukasz GS i WCA:',
	stepsFind: [
		'Obróć tarczę: kierunek wiatru pod TRUE INDEX.',
		'Przesuń siatkę, by środek stał na okrągłej linii, np. 100.',
		'Przeciągnij czerwoną kropkę w górę o tyle węzłów, ile wynosi prędkość wiatru.',
		'Obróć tarczę: kurs (TC) pod TRUE INDEX.',
		'Przesuń siatkę, aż kropka trafi na łuk równy TAS.',
		'Odczyt: GS = łuk pod środkiem, WCA = kąt kropki.'
	],
	stepsWindTitle: 'Szukasz wiatru (odwrotnie):',
	stepsWind: [
		'Ustaw kurs (TC) pod TRUE INDEX.',
		'Przesuń siatkę, aż GS będzie pod środkiem.',
		'Postaw kropkę na przecięciu linii WCA i łuku TAS.',
		'Obróć tarczę, aż kropka znajdzie się pionowo nad środkiem.',
		'Pod indeksem: kierunek wiatru; odległość kropki = prędkość.'
	],
	task: 'Zadanie',
	taskTsd: 'Czas / prędkość / dystans',
	taskFuel: 'Paliwo / zużycie / czas',
	gs: 'GS (kt)',
	distance: 'Dystans (NM)',
	timeMin: 'Czas (min)',
	setDialsGs: 'Ustaw tarcze (GS pod RATE)',
	burn: 'Zużycie (GPH)',
	fuelGal: 'Paliwo (gal)',
	setDialsBurn: 'Ustaw tarcze (GPH pod RATE)',
	dialReadout: 'Odczyt z tarczy',
	speedRate: 'Prędkość/rate (A pod RATE)',
	underCursorA: 'Pod kursorem - A',
	underCursorB: 'Pod kursorem - B/czas',
	cursorHint: 'Niebieski kursor przeciągasz, by precyzyjnie odczytać wartość naprzeciw.',
	offWheel: 'Skale poza kołem',
	windAngleSpeed: 'Wiatr: kąt / prędkość',
	headwind: 'Składowa czołowa',
	crosswind: 'Składowa boczna',
	temperature: 'Temperatura',
	markerHint: 'Przeciągnij marker w siatce wiatru (lewy górny róg) i wskaźnik temperatury (dół).',
	howItWorksTitle: 'Jak to działa:',
	howItWorks: [
		'Skala A (zewnętrzna) stoi; skala B na dysku obraca się.',
		'Strzałka RATE 60 to wskaźnik tempa (kt, GPH).',
		'Ustaw rate pod prędkością - każdy dystans na A ma swój czas na B.',
		'Wartości są logarytmiczne: 12 może znaczyć 1,2 / 12 / 120.'
	],
	timeResult: 'Czas = {v} min (kursor pokazuje wynik na skali B)',
	fuelResult: 'Paliwo = {v} gal'
};

const en: E6bStrings = {
	front: 'Front - slide rule',
	back: 'Back - wind',
	reset: 'Reset',
	viewComputer: 'Computer',
	viewResults: 'Results',
	tasAtDot: 'TAS at the dot',
	solveFind: 'Find GS and WCA (wind known)',
	solveWind: 'Find the wind (GS and drift known)',
	subtitle: 'Interactive replica - drag the dials, cursor and wind dot',
	targetTas: 'Target: TAS',
	tasArc: 'TAS (target arc)',
	hitOk: '✓ dot on the TAS arc',
	hitMiss: 'slide the grid until the dot meets the blue arc',
	liveReadout: 'Live readout',
	underIndex: 'Under the index',
	gsUnderCentre: 'Arc under centre (GS)',
	dotFromCentre: 'Dot from centre',
	dotAngle: 'Dot angle (WCA)',
	right: '(right)',
	left: '(left)',
	mathCheck: 'Maths check',
	windFrom: 'Wind from (°)',
	windKt: 'Wind (kt)',
	tc: 'TC (°)',
	tasKt: 'TAS (kt)',
	stepsFindTitle: 'Finding GS and WCA:',
	stepsFind: [
		'Turn the dial: wind direction under the TRUE INDEX.',
		'Slide the grid so the centre sits on a round line, e.g. 100.',
		'Drag the red dot up by as many knots as the wind speed.',
		'Turn the dial: course (TC) under the TRUE INDEX.',
		'Slide the grid until the dot reaches the arc equal to TAS.',
		'Read off: GS = arc under the centre, WCA = dot angle.'
	],
	stepsWindTitle: 'Finding the wind (reverse):',
	stepsWind: [
		'Set the course (TC) under the TRUE INDEX.',
		'Slide the grid until GS is under the centre.',
		'Place the dot at the intersection of the WCA line and the TAS arc.',
		'Turn the dial until the dot is vertically above the centre.',
		'Under the index: wind direction; dot distance = speed.'
	],
	task: 'Task',
	taskTsd: 'Time / speed / distance',
	taskFuel: 'Fuel / burn / time',
	gs: 'GS (kt)',
	distance: 'Distance (NM)',
	timeMin: 'Time (min)',
	setDialsGs: 'Set the dials (GS under RATE)',
	burn: 'Burn (GPH)',
	fuelGal: 'Fuel (gal)',
	setDialsBurn: 'Set the dials (GPH under RATE)',
	dialReadout: 'Dial readout',
	speedRate: 'Speed/rate (A under RATE)',
	underCursorA: 'Under the cursor - A',
	underCursorB: 'Under the cursor - B/time',
	cursorHint: 'Drag the blue cursor to read a value off precisely.',
	offWheel: 'Off-wheel scales',
	windAngleSpeed: 'Wind: angle / speed',
	headwind: 'Headwind component',
	crosswind: 'Crosswind component',
	temperature: 'Temperature',
	markerHint: 'Drag the marker in the wind grid (top-left) and the temperature pointer (bottom).',
	howItWorksTitle: 'How it works:',
	howItWorks: [
		'Scale A (outer) is fixed; scale B on the disc rotates.',
		'The RATE 60 arrow is the rate index (kt, GPH).',
		'Set the rate under the speed - every distance on A has its time on B.',
		'Values are logarithmic: 12 can mean 1.2 / 12 / 120.'
	],
	timeResult: 'Time = {v} min (the cursor shows the result on scale B)',
	fuelResult: 'Fuel = {v} gal'
};

export const E6B_STRINGS: Record<E6bLocale, E6bStrings> = { pl, en };
