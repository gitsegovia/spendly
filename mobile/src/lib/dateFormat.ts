const MONTHS: Record<string, string[]> = {
  es: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
};

export function formatDate(date: string, lang = 'es'): string {
  const parts = date.split('-');
  const m = parseInt(parts[1] ?? '1', 10);
  const d = parseInt(parts[2] ?? '1', 10);
  const labels = MONTHS[lang] ?? MONTHS['es']!;
  return `${d} ${labels[m - 1]}`;
}
