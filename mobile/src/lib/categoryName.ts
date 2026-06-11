const CATEGORY_KEYS: Record<string, string> = {
  'Comida': 'categories.food',
  'Servicios': 'categories.services',
  'Educación': 'categories.education',
  'Transporte': 'categories.transport',
  'Salud': 'categories.health',
  'Entretenimiento': 'categories.entertainment',
  'Otro': 'categories.other',
  'Salario': 'categories.salary',
  'Freelance': 'categories.freelance',
  'Otro ingreso': 'categories.income_other',
};

export function categoryLabel(name: string, t: (key: string) => string): string {
  return CATEGORY_KEYS[name] ? t(CATEGORY_KEYS[name]) : name;
}
