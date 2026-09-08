export const SUPPORTED_BRANDS_BY_COUNTRY = {
  no: ['borsen', 'dagbladet', 'dinside', 'elbil24', 'kk', 'seher', 'sol'],
  se: [
    'allas',
    'elle',
    'femina',
    'hant',
    'mabra',
    'motherhood',
    'recept',
    'residence',
    'svenskdam',
  ],
  dk: [
    'billedbladet',
    'familiejournal',
    'femina',
    'isabellas',
    'seoghoer',
    'spisbedre',
    'udeoghjemme',
  ],
  fi: ['femina', 'seiska'],
} as const;

export type SupportedCountry = keyof typeof SUPPORTED_BRANDS_BY_COUNTRY;

export const DEFAULT_LANGUAGE_BY_COUNTRY: Record<SupportedCountry, string> = {
  no: 'Norwegian Bokmål',
  se: 'Swedish',
  dk: 'Danish',
  fi: 'Finnish',
};

export interface SupportedSite {
  brand: string;
  country: SupportedCountry;
}

export const isSupportedCountry = (
  country: string,
): country is SupportedCountry => country in SUPPORTED_BRANDS_BY_COUNTRY;

export const isSupportedBrand = (
  brand: string,
  country: SupportedCountry,
): boolean =>
  (SUPPORTED_BRANDS_BY_COUNTRY[country] as readonly string[]).includes(brand);
