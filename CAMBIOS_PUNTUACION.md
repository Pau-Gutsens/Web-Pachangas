# Nuevo sistema de puntuación por jornada (EGOL Fantasy)

> Para Claude Code. **Sustituye a `CAMBIOS_NOTAS.md`** y a las secciones de puntuación y bonus de portería de `CONTEXTO_APP.md`. Lee `lib/scoring.ts`, `lib/db.ts`, `components/AdminView.tsx` y `components/MatchDayView.tsx` antes de tocar nada. Explícame el plan en 10 líneas y luego implementa por fases. Todos los números son constantes en un único archivo de configuración.

## Resumen
Cada jugador puntúa entre **0 y 20** en cada pachanga:

`puntos = parte_subjetiva (0-10) + parte_objetiva (0-10)`, ambos redondeados a entero.

Los puntos de cada manager son la suma de los puntos de sus jugadores alineados, como hasta ahora.

## 1. Acta del admin (lo mínimo)
Lo apunta quien está descansando durante el partido, así que solo:
- Cada **gol**: goleador y, si hubo, asistente (un toque por gol).
- **Autogoles**.
- El resultado se calcula solo de los goles.

**Eliminar:** paradas, goles encajados por jugador, casilla de portero y el bonus por tramos de portería. Defensas y porteros puntúan por la parte subjetiva.

## 2. Parte subjetiva (ranking, 0-10)
1. Cuando se cierra el acta se abre la votación. Votan solo los usuarios **convocados** a esa pachanga.
2. Cada votante **ordena a todos los demás participantes de la pachanga** (incluidos invitados), del 1 (mejor) al `m`. No se incluye a sí mismo, no se pueden repetir posiciones y el ranking debe estar completo. En móvil: lista que se reordena arrastrando.
3. `n` = número de participantes de la pachanga y `m = n - 1` = jugadores que ordena cada votante.
4. Posición media de un jugador, **mezclando compañeros y rivales**:
   - `P_comp` = media de las posiciones que le dieron sus compañeros de equipo.
   - `P_riv` = media de las posiciones que le dieron los rivales.
   - `P = 0.5 * P_comp + 0.5 * P_riv`. Si uno de los dos grupos tiene menos de 2 votos, `P` = media de todas las posiciones.
5. `N_subj = 10 * (m - P) / (m - 1)`, redondeado a entero.
   Ejemplo: 12 participantes (`m = 11`), posiciones recibidas 3, 7, 9, 7 y 11 → `P = 7.4` → `N_subj = 10 * (11 - 7.4) / 10 = 3.6` → **4**.
6. Si hay menos de **4 votantes** en total, la parte subjetiva de todos es **5** (neutral) y se avisa en pantalla.
7. Votos anónimos. Nadie ve quién votó qué (tampoco el admin).

## 3. Parte objetiva (0-10)
Puntos en bruto de cada jugador:
- Gol +3, asistencia +1, autogol −2.
- Victoria +3, empate +1, derrota 0.
- **MVP +3**: el MVP es el jugador con mejor `N_subj` de la pachanga (empate: el de más puntos en bruto). No hay votación aparte.

Conversión a 0-10, con un tope para que una goleada no se dispare:
`N_obj = 10 * clamp(bruto, 0, TOPE_OBJ) / TOPE_OBJ`, con `TOPE_OBJ = 20`, redondeado a entero.

Constante `OBJETIVO_MODO`:
- `"tope"` (por defecto): la fórmula de arriba. Conserva la diferencia entre 8 goles y 3 goles.
- `"ranking"`: se ordena a los jugadores por puntos en bruto (los empates comparten posición media) y se aplica `N = 10 * (n - P) / (n - 1)`. Compacta mucho más las diferencias.

## 4. Ciclo de la jornada
- La votación se cierra cuando han votado todos los convocados o a las **48 h**, lo que ocurra antes.
- Los puntos finales y la clasificación se publican al cerrar la votación. Mientras tanto, la clasificación muestra "pendiente de votos".
- La nota media del cromo se muestra como media de temporada de `N_subj`, ajustada con `(suma + 2 * media_del_grupo) / (pachangas + 2)`, y solo desde 3 pachangas; antes se muestra "—".

## 5. Valor de los jugadores en el mercado
- Variación tras cada jornada: `variacion_% = 15 * (puntos - media_de_puntos_de_esa_jornada) / 10`, limitada a **±15 %**.
- La media de la jornada es el punto neutro: con 0 puntos baja casi lo máximo y con 20 puntos sube lo máximo. Así el mercado no se infla ni se deprime globalmente.
- Valores en millones sin decimales extraños, como ahora.

## 6. Datos en bruto y recálculo
- Guarda siempre los **datos en bruto**: cada gol (goleador y asistente), autogoles, resultado y cada ranking de voto completo. Nunca guardes solo los puntos finales.
- Los puntos de jugadores y managers, y los precios, **se calculan a partir de esos datos y de las constantes de configuración**. Si se cambia una constante (por ejemplo `TOPE_OBJ`), se recalcula todo el historial.
- Los partidos de este grupo suelen tener más de 5 goles por equipo (el del 6 de noviembre fue 15-11). Con 3 o 4 pachangas reales conviene revisar `TOPE_OBJ` y, si hace falta, probar `OBJETIVO_MODO`.

## 7. Descartado a propósito (no implementar)
- Paradas y goles encajados por jugador, casilla de portero y bonus por tramos de portería: no se pueden apuntar en directo y premiaban a quien menos tiempo estaba en portería.
- Bonus de equipo por encajar pocos goles: siempre hay más de 5 goles por equipo.
- Votación separada de MVP: se deriva de la parte subjetiva.

## 8. Tests obligatorios
- Fórmula subjetiva: el ejemplo de 12 participantes da 4; mejor posible = 10; peor posible = 0.
- Mezcla compañeros/rivales y caso de menos de 2 votos en un grupo.
- Menos de 4 votantes → 5 para todos.
- Un votante no puede votarse a sí mismo ni dejar ranking incompleto o con repetidos; un manager que no jugó no puede votar.
- Objetiva: 8 goles + victoria = 27 en bruto → 10; autogol que deja el bruto en negativo → 0.
- MVP asignado al mejor `N_subj`, con desempate.
- Variación de precio dentro de ±15 % y media de jornada como punto neutro.
