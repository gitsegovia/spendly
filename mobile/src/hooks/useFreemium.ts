import { useAuth } from '../contexts/AuthContext';

const FREE_MONTHS = 3;

export function useFreemium() {
  const { profile } = useAuth();
  const isPremium = profile?.plan === 'premium';

  // Devuelve true si ese year/month está fuera del historial permitido para free
  function isMonthLocked(year: number, month: number): boolean {
    if (isPremium) return false;
    const now = new Date();
    // Mes más antiguo permitido: (FREE_MONTHS - 1) meses atrás del mes actual
    const oldest = new Date(now.getFullYear(), now.getMonth() - (FREE_MONTHS - 1), 1);
    return new Date(year, month - 1, 1) < oldest;
  }

  return { isPremium, isMonthLocked };
}
