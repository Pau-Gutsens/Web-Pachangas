# Webapp de pachangas con fantasy: guía y especificación

> Para guardar como `FANTASY_SPEC.md` en la raíz del repo y decirle a Claude Code: "lee FANTASY_SPEC.md, explícame el plan y luego impleméntalo por fases".
> **El proyecto empieza de cero**: no hay web anterior que reutilizar.

## 0. Instrucciones para Claude Code

1. Propón el stack más simple que sirva (web responsive, móvil primero, con base de datos). Pregúntame solo lo imprescindible y justifica en 10 líneas.
2. Implementa por fases (sección 7). Al acabar cada fase, dime qué probar a mano.
3. No conozco el fantasy: explícame brevemente cada decisión de diseño importante.
4. UI simple y rápida: la usan amigos entre pachangas, no debe sentirse como una obligación.

## 1. Qué es un fantasy (explicación)

Un fantasy (Fantasy de La Liga, Biwenger...) es un juego donde **cada participante es un "manager"** que arma un equipo virtual con jugadores **reales**. Esos jugadores juegan sus partidos de verdad y, según lo que hacen (goles, asistencias, paradas...), tu equipo virtual suma puntos. Gana quien más puntos acumula.

| Concepto | Qué es |
|---|---|
| Manager | Cada participante del juego. |
| Jugador | Un futbolista real, con un **precio** y unas estadísticas. |
| Presupuesto | Dinero virtual limitado. Evita que todos elijan a los mejores. |
| Jornada | Un periodo de puntuación. |
| Puntos | Se calculan a partir de las estadísticas reales de cada jugador. |
| Capitán | Un jugador cuyos puntos cuentan doble. |
| Clasificación | Ranking de managers por puntos de jornada y acumulados. |

Los puntos no los inventa el juego: salen de lo que pasa en los partidos reales.

## 2. Cómo se traduce a este grupo

- El grupo tiene **15 miembros**. Son los "jugadores reales" y también los managers.
- **Jornada = una pachanga.** Se juega solo algunas semanas al año, sin calendario fijo.
- **No viene todo el mundo a cada partido**, y los **equipos cambian** cada vez. Por tanto cada pachanga tiene su propia lista de asistentes y sus propios equipos.
- A veces vienen **invitados de otro grupo** para cuadrar el número de jugadores por equipo.
- Los puntos fantasy salen de las estadísticas que se registren en cada pachanga.

## 3. Modelo de datos (propuesta)

- **Miembro**: id, nombre, rol (miembro del grupo), foto/alias opcional, es admin (sí/no). 15 en total.
- **Invitado**: jugador puntual que no es del grupo. Se crea al vuelo en la pachanga (solo nombre). Puede repetir en varias pachangas, pero no es manager ni tiene clasificación.
- **Pachanga**: fecha, estado (`borrador` → `abierta` → `cerrada` → `puntuada` | `cancelada`), formato (jugadores por equipo).
- **Asistencia**: qué miembros e invitados juegan esa pachanga y en qué equipo (A o B). Los equipos se definen por pachanga, no son fijos.
- **Estadísticas de partido**: por jugador y pachanga (goles, asistencias, autogoles, paradas, goles encajados, MVP) + resultado final por equipo.
- **Picks de fantasy**: por manager y pachanga, la lista de jugadores elegidos y el capitán.
- **Puntos**: calculados a partir de estadísticas y picks (se pueden recalcular siempre).

## 4. Reglas del fantasy (valores por defecto)

### Flujo de una pachanga
1. El admin crea la pachanga y marca quién asiste y en qué equipo está cada uno (incluidos invitados).
2. Se abre el fantasy: cada manager elige su equipo entre los jugadores de esa pachanga.
3. El admin cierra las elecciones al empezar el partido.
4. Tras el partido, el admin registra resultado y estadísticas.
5. Se calculan los puntos y se actualiza la clasificación.

### Quién se puede elegir
- **Solo miembros del grupo que asisten** a esa pachanga.
- **Los invitados no se pueden elegir** (por defecto): no tienen clasificación y complicaría el juego. Sí cuentan para el resultado del partido (la victoria de su equipo).
- Un manager **puede elegirse a sí mismo** (decidido). El precio basado en el promedio de puntos ya compensa la ventaja de los mejores.
- Los managers que no asisten a la pachanga **también pueden jugar al fantasy** esa jornada.

### Selección de equipo
- Cada manager elige **N jugadores** de los asistentes (por defecto N = jugadores por equipo del formato, ajustable). 
- **Presupuesto**: cada jugador tiene un precio y el presupuesto se calcula por pachanga (ver "Precios"). No puedes elegir a los N mejores.
- **Capitán**: un jugador de tu equipo puntúa x2.
- Los managers pueden repetir jugadores entre sí.

### Puntos de un jugador (por pachanga)
- Gol +1, asistencia +1, autogol −1, victoria +1, MVP +1 extra.
- Solo portero: parada +1, gol encajado −1.
- Quien no asiste puntúa 0 (no se puede elegir de todos modos).

Puntos del manager = suma de puntos de sus jugadores, con el capitán x2.

### Precios (sin SR previo)
Constantes en un único archivo de configuración, fáciles de ajustar tras unas cuantas pachangas reales:

- `PRECIO_BASE = 8`, `FACTOR = 2`, `PRECIO_MIN = 6`, `PRECIO_MAX = 20`.
- **Promedio ajustado** (evita que alguien con 1 sola pachanga buena salga carísimo):
  `promedio_ajustado = (puntos_totales + K * promedio_grupo) / (pachangas_jugadas + K)`, con `K = 2`.
  `promedio_grupo` = media de puntos por pachanga de todos los miembros; si aún no hay datos, usar 1.5.
- **Precio** = `clamp(round(PRECIO_BASE + FACTOR * promedio_ajustado), PRECIO_MIN, PRECIO_MAX)`.
- Un jugador sin pachangas jugadas cuesta `PRECIO_BASE + FACTOR * promedio_grupo` (≈ 11).
- Se recalcula tras puntuar cada pachanga. Los picks ya guardados de una jornada conservan el precio que tenían al elegir.
- Los invitados no tienen precio ni se eligen.

**Presupuesto de cada jornada** = `round(N * precio_medio_de_los_asistentes)`.
Así siempre puedes fichar un equipo "medio", pero si metes estrellas tienes que compensar con jugadores baratos. Se adapta solo a quién asista cada día.

**Ejemplo (8 asistentes, N = 5):**

| Jugador | Promedio ajustado | Precio |
|---|---|---|
| A | 4.0 | 16 |
| B | 3.0 | 14 |
| C | 2.0 | 12 |
| D | 1.5 | 11 |
| E | 1.5 | 11 |
| F | 1.0 | 10 |
| G | 0.5 | 9 |
| H | 0.0 | 8 |

Precio medio = 11.4 → presupuesto = 57. Los 5 más caros (A+B+C+D+E) cuestan 64: no caben. Sí cabe A + B + F + G + H = 57 (apuesta por dos estrellas y tres baratos). Los tests de precios deben cubrir justo este ejemplo.

### Clasificación
- Por jornada y acumulada de temporada.
- Desempate: más jornadas ganadas, luego más puntos en la última.

## 5. Pantallas mínimas

1. **Pachanga actual**: asistentes y equipos; para el admin, formulario para marcar asistencia, equipos e invitados.
2. **Elegir equipo**: jugadores asistentes con precio, presupuesto restante, capitán, guardar.
3. **Resultado de jornada**: puntos por jugador y por manager.
4. **Clasificación**: tabla acumulada + selector de jornada.
5. **Registro de estadísticas** (admin): rápido, pensado para móvil justo tras el partido.

Autenticación: lo más ligera posible. Selector de "quién eres" con un PIN sencillo basta para 15 amigos. Un admin (tú) con permisos para crear pachangas y registrar estadísticas.

## 6. Decisiones abiertas (usar el valor por defecto salvo que yo diga otra cosa)

| Decisión | Por defecto |
|---|---|
| ¿Puedes elegirte a ti mismo? | **Sí (decidido)** |
| ¿Se pueden elegir invitados? | No |
| ¿Un manager que no asiste puede jugar? | Sí |
| ¿Quién registra estadísticas? | Solo el admin |
| ¿Manager sin equipo guardado? | 0 puntos esa jornada |
| ¿Mercado de fichajes con subastas? | No |

## 7. Plan por fases

1. **Base**: proyecto, base de datos, miembros (los 15), invitados, login simple, rol admin.
2. **Pachangas**: crear pachanga, marcar asistentes, equipos por pachanga, invitados.
3. **Estadísticas y resultado**: registro rápido de estadísticas y resultado.
4. **Cálculo de puntos**: función pura con **tests unitarios** (portero, capitán x2, autogol, invitado, jugador que no asiste).
5. **Fantasy**: elegir equipo con presupuesto y cierre, resultados y clasificación.
6. **Pulido**: estados vacíos, móvil primero, recálculo si se corrigen estadísticas.

## 8. Casos límite a cubrir

- Un jugador elegido no asiste finalmente: no debería poder pasar (se elige solo entre asistentes confirmados); si cambia la asistencia tras abrir, avisar y permitir reelegir.
- Pachanga cancelada: no cuenta para nada.
- Corrección de estadísticas tras puntuar: recalcular esa pachanga y los precios siguientes.
- Equipos desiguales por faltas imprevistas: no afecta a los puntos, solo al resultado del partido.
