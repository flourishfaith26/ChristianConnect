export type LanguageCode = 'en' | 'es' | 'fr' | 'pt' | 'ko' | 'sw';

export const LANGUAGES: { code: LanguageCode; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    welcome: 'Welcome to ChristianConnect',
    community: 'Faith Community & Fellowship',
    events: 'Events & Church Calendar',
    giving: 'Partner Giving & Subscriptions',
    journal: 'Private Faith Journal',
    stories: 'Christian Stories',
  },
  es: {
    welcome: 'Bienvenido a ChristianConnect',
    community: 'Comunidad de Fe y Compañerismo',
    events: 'Eventos y Calendario de la Iglesia',
    giving: 'Donaciones y Suscripciones',
    journal: 'Diario de Fe Privado',
    stories: 'Historias Cristianas',
  },
  fr: {
    welcome: 'Bienvenue sur ChristianConnect',
    community: 'Communauté de Foi et Fraternité',
    events: 'Événements et Calendrier de l’Église',
    giving: 'Dons et Abonnements',
    journal: 'Journal de Foi Privé',
    stories: 'Histoires Chrétiennes',
  },
  pt: {
    welcome: 'Bem-vindo ao ChristianConnect',
    community: 'Comunidade de Fé e Comunhão',
    events: 'Eventos e Calendário da Igreja',
    giving: 'Doações e Assinaturas',
    journal: 'Diário de Fé Privado',
    stories: 'Histórias Cristãs',
  },
  ko: {
    welcome: '크리스천커넥트에 오신 것을 환영합니다',
    community: '믿음의 공동체와 교제',
    events: '교회 행사 및 달력',
    giving: '후원 및 구독',
    journal: '비밀 기도 일기',
    stories: '크리스천 스토리',
  },
  sw: {
    welcome: 'Karibu ChristianConnect',
    community: 'Jamii ya Imani na Ushirika',
    events: 'Matukio na Kalenda ya Kanisa',
    giving: 'Michango na Usajili',
    journal: 'Dajara la Siri la Imani',
    stories: 'Hadithi za Kikristo',
  },
};

export function getTranslation(lang: LanguageCode, key: string): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}
