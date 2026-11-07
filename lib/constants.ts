/**
 * Configuración de puntuación y reglas de negocio de EGOL Fantasy
 * Basado en CAMBIOS_PUNTUACION.md
 */

export const SCORING_CONSTANTS = {
  // Puntuación Objetiva
  OBJETIVO: {
    GOAL: 3,
    ASSIST: 1,
    OWN_GOAL: -2,
    WIN: 3,
    DRAW: 1,
    LOSS: 0,
    MVP: 3,
    TOPE_OBJ: 20,
    OBJETIVO_MODO: "tope" as "tope" | "ranking", // "tope" o "ranking"
  },

  // Puntuación Subjetiva
  SUBJETIVO: {
    MIN_VOTANTES_PARA_NEUTRO: 4,
    NEUTRO: 5,
    PESO_COMPAÑEROS: 0.5,
    PESO_RIVALES: 0.5,
  },

  // Mercado
  MERCADO: {
    MAX_VARIACION: 0.15, // 15%
  },
};
