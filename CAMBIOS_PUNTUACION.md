# Nuevo sistema de puntuación por jornada (EGOL Fantasy)

> Para Claude Code. **Sustituye a `CAMBIOS_NOTAS.md`** y a las secciones de puntuación y bonus de portería de `CONTEXTO_APP.md`. Lee `lib/scoring.ts`, `lib/db.ts`, `components/AdminView.tsx` y `components/MatchDayView.tsx` antes de tocar nada. Explícame el plan en 10 líneas y luego implementa por fases. Todos los números son constantes en un único archivo de configuración.

## Resumen
Cada jugador puntúa entre **0 y 20** en cada pachanga:

`puntos = parte_subjetiva (0-10) + parte_objetiva (0-10)`, ambos redondeados a entero.

Los puntos de cada manager son la suma de los puntos de sus jugadores alineados, como hasta ahora.

## 1. Acta del admin: modo directo (lo mínimo)
Lo apunta quien está descansando durante el partido, así que tiene que ser rápido y a prueba de fallos. Solo se registra:
- Cada **gol**: goleador y, si hubo, asistente (dos toques por gol, con botón "sin asistencia").
- **Autogoles**.
- **Salvada** (opcional): un botón y se elige quién. Ver sección 3.
- El resultado se calcula solo de los goles.

**Eliminar:** goles encajados por jugador, casilla de portero, el bonus por tramos de portería y el contador de "todas las paradas".

### 1.1 Modo directo
- Pantalla con el marcador grande y un botón por equipo ("Gol blanco", "Gol azul").
- Botón **deshacer** siempre visible.
- El marcador se ve en directo en el móvil de todos los convocados, para que cualquier error se detecte y corrija en el momento.
- Funciona aunque se pierda la cobertura un momento (guarda en local y sincroniza al volver).

### 1.2 Cuadre automático con el resultado
- Los goles atribuidos a los jugadores de un equipo, más los autogoles del rival, deben coincidir con el marcador.
- Si no cuadra, al cerrar el acta se avisa: "Al equipo X le faltan N goles por atribuir" y no se puede cerrar hasta resolverlo.
- Las asistencias no se pueden cuadrar así.

### 1.3 Ventana de corrección de los jugadores
- Al cerrar el acta, cada convocado ve sus goles, asistencias y salvadas con un botón "no está bien" y puede pedir una corrección o añadir una acción que falta.
- La ventana dura **24 h**. El admin acepta o rechaza cada petición.
- La votación se abre a la vez que esta ventana. Los puntos finales se calculan al cerrar ambas.

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
- **Salvada +2**, máximo **3 por jugador y partido** (`SALVADA_PTS = 2`, `SALVADA_MAX = 3`).
- Victoria +3, empate +1, derrota 0.

**Qué es una salvada:** acción que evita un gol casi seguro, ya sea una parada de un tiro que iba a gol o un despeje sobre la línea. Un tiro flojo a las manos, un balón que iba fuera o un despeje normal **no** cuentan. Vale para cualquier jugador, no solo para el portero.
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
- **Esta sección está sustituida por `CAMBIOS_MERCADO.md`** (fórmula de variación, cifras en miles y compras iniciales). Si hay diferencia, manda ese archivo.
- Resumen: `variacion_% = clamp(2,5 * (puntos - media_de_puntos_de_esa_jornada), -15, +15)`; la media de la jornada es el punto neutro.

## 6. Datos en bruto y recálculo
- Guarda siempre los **datos en bruto**: cada gol (goleador y asistente), autogoles, salvadas, resultado y cada ranking de voto completo. Nunca guardes solo los puntos finales.
- Los puntos de jugadores y managers, y los precios, **se calculan a partir de esos datos y de las constantes de configuración**. Si se cambia una constante (por ejemplo `TOPE_OBJ`), se recalcula todo el historial.
- Los partidos de este grupo suelen tener más de 5 goles por equipo (el del 6 de noviembre fue 15-11). Con 3 o 4 pachangas reales conviene revisar `TOPE_OBJ` y, si hace falta, probar `OBJETIVO_MODO`.

## 7. Descartado a propósito (no implementar)
- Contar todas las paradas, goles encajados por jugador, casilla de portero y bonus por tramos de portería: no se pueden apuntar en directo y premiaban a quien más o menos tiempo estaba en portería. Solo cuenta la **salvada** (sección 3), que es una acción puntual y clara.
- Penaltis, tarjetas, tiros a puerta, pases clave y recuperaciones: difíciles de apuntar sin dedicarse solo a eso; lo subjetivo lo cubre la votación.
- Bonus de equipo por encajar pocos goles: siempre hay más de 5 goles por equipo.
- Votación separada de MVP: se deriva de la parte subjetiva.

## 8. Tests obligatorios
- Fórmula subjetiva: el ejemplo de 12 participantes da 4; mejor posible = 10; peor posible = 0.
- Mezcla compañeros/rivales y caso de menos de 2 votos en un grupo.
- Menos de 4 votantes → 5 para todos.
- Un votante no puede votarse a sí mismo ni dejar ranking incompleto o con repetidos; un manager que no jugó no puede votar.
- Objetiva: 8 goles + victoria = 27 en bruto → 10; autogol que deja el bruto en negativo → 0.
- Salvadas: +2 cada una y máximo 3 por jugador y partido (la cuarta no suma).
- Cuadre: si los goles atribuidos más los autogoles del rival no coinciden con el marcador, no se puede cerrar el acta.
- Ventana de corrección: una petición aceptada recalcula los puntos; una rechazada no cambia nada.
- Deshacer en el modo directo elimina solo el último evento.
- MVP asignado al mejor `N_subj`, con desempate.
- Variación de precio: ver los tests de `CAMBIOS_MERCADO.md`.
