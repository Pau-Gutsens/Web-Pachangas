// Constantes oficiales de EGOL Fantasy (según EGOL_FANTASY.md sección 12)
// Todas las constantes van en este archivo. Nada de números mágicos por el código.

export const PRESUPUESTO_INICIAL = 100000;   // 100 M€ expresados en K€
export const PRECIO_BASE = 20000;            // 20 M€ expresados en K€
export const PRECIO_REDONDEO = 10;           // K€
export const PRECIO_SENS = 2.5;              // % por punto sobre la media
export const PRECIO_VAR_MAX = 15;            // % tope por partido
export const MAX_PLANTILLA = 6;              // 5 titulares + 1 reserva
export const TITULARES = 5;
export const CAPITAN_MULT = 2;
export const TOPE_OBJ = 20;                  // puntos en bruto para el máximo de Estadísticas
export const PUNTOS = {
  GOL: 3,
  ASISTENCIA: 1,
  AUTOGOL: -2,
  SALVADA: 2,
  VICTORIA: 3,
  EMPATE: 1,
  MVP: 3
} as const;
export const SALVADA_MAX = 3;
export const MIN_VOTANTES = 4;
export const MIN_VOTOS_POR_GRUPO = 2;
export const VOTOS_NEUTRO = 5;
export const VOTACION_HORAS = 48;
export const CORRECCION_HORAS = 24;
export const CROMO_K = 2;
export const CROMO_MIN_PACHANGAS = 3;
export const ZONA_HORARIA = "Europe/Madrid";
