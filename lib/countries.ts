export type Country = {
  code: string;
  name: string;
  schengen: boolean;
  deFacto?: boolean;
};

const SCHENGEN: Array<[string, string]> = [
  ["AT", "Austria"],
  ["BE", "Belgium"],
  ["BG", "Bulgaria"],
  ["HR", "Croatia"],
  ["CZ", "Czechia"],
  ["DK", "Denmark"],
  ["EE", "Estonia"],
  ["FI", "Finland"],
  ["FR", "France"],
  ["DE", "Germany"],
  ["GR", "Greece"],
  ["HU", "Hungary"],
  ["IS", "Iceland"],
  ["IT", "Italy"],
  ["LV", "Latvia"],
  ["LI", "Liechtenstein"],
  ["LT", "Lithuania"],
  ["LU", "Luxembourg"],
  ["MT", "Malta"],
  ["NL", "Netherlands"],
  ["NO", "Norway"],
  ["PL", "Poland"],
  ["PT", "Portugal"],
  ["RO", "Romania"],
  ["SK", "Slovakia"],
  ["SI", "Slovenia"],
  ["ES", "Spain"],
  ["SE", "Sweden"],
  ["CH", "Switzerland"],
];

const DE_FACTO: Array<[string, string]> = [
  ["MC", "Monaco"],
  ["SM", "San Marino"],
  ["VA", "Vatican City"],
];

const OTHER: Array<[string, string]> = [
  ["GB", "United Kingdom"],
  ["US", "United States"],
  ["CA", "Canada"],
  ["JP", "Japan"],
  ["TH", "Thailand"],
  ["MX", "Mexico"],
  ["AE", "United Arab Emirates"],
  ["IE", "Ireland"],
  ["CY", "Cyprus"],
  ["GE", "Georgia"],
  ["TR", "Türkiye"],
  ["AL", "Albania"],
  ["ME", "Montenegro"],
  ["RS", "Serbia"],
];

export const COUNTRIES: Country[] = [
  ...SCHENGEN.map(([code, name]) => ({ code, name, schengen: true })),
  ...DE_FACTO.map(([code, name]) => ({ code, name, schengen: true, deFacto: true })),
  ...OTHER.map(([code, name]) => ({ code, name, schengen: false })),
].sort((a, b) => a.name.localeCompare(b.name));

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string): Country | undefined {
  return BY_CODE.get(code);
}

export function isSchengen(code: string): boolean {
  return BY_CODE.get(code)?.schengen === true;
}

export function countryName(code: string): string {
  return BY_CODE.get(code)?.name ?? code;
}
