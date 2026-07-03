import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFreemium } from './useFreemium';

/**
 * Navegación de meses compartida por todas las vistas.
 *
 * Límites:
 * - Piso: el mes en que se registró el usuario (profile.created_at) —
 *   antes de eso no hay datos posibles.
 * - Freemium: si el mes anterior está fuera del historial del plan free,
 *   la flecha muestra el candado (isAtFreeLimit) para abrir el paywall.
 * - Techo: el mes actual.
 */
export function useMonthNavigation() {
  const { profile } = useAuth();
  const { isMonthLocked } = useFreemium();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const registered = profile?.created_at ? new Date(profile.created_at) : null;
  const floorYear = registered?.getFullYear() ?? null;
  const floorMonth = registered ? registered.getMonth() + 1 : null;

  const isAtRegistrationLimit =
    floorYear !== null && floorMonth !== null &&
    year === floorYear && month === floorMonth;

  const prevMonthYear = month === 1 ? year - 1 : year;
  const prevMonthNum = month === 1 ? 12 : month - 1;
  const isAtFreeLimit = !isAtRegistrationLimit && isMonthLocked(prevMonthYear, prevMonthNum);

  function prevMonth() {
    if (isAtRegistrationLimit) return;
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const n = new Date();
    if (year === n.getFullYear() && month === n.getMonth() + 1) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  return {
    year,
    month,
    prevMonth,
    nextMonth,
    /** true cuando ya no se puede retroceder más (mes de registro) */
    canGoPrev: !isAtRegistrationLimit,
    /** true cuando el mes anterior requiere premium */
    isAtFreeLimit,
  };
}
