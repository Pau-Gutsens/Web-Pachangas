# Cambios: precios, ranking, votaciones y mercado (EGOL Fantasy)

> Para Claude Code. Lee este archivo entero. **Manda sobre `CAMBIOS_PUNTUACION.md` y `CONTEXTO_APP.md` en todo lo que toque a precios, mercado, ranking y votaciones**; lo demás (puntuación, acta, votación por ranking) sigue como está.
>
> Antes de tocar código, diagnostica los puntos 5 y 6 (son errores que ya se ven en la app) y explícame la causa de cada uno en pocas líneas. Después implementa por orden y al final dame una tabla con el estado real de cada punto (hecho / parcial / no hecho, con archivo y función). Todos los números son constantes en `lib/config.ts`.

## 1. Cifras en miles, no solo en millones
- Guarda **todos los precios y saldos como entero en miles de euros (K€)**: 20 M€ = `20000`. Presupuesto inicial = `100000`, precio base = `20000`.
- Muéstralos así: desde 1 M€ en adelante, en millones con hasta 2 decimales y coma ("17,35 M€", "20 M€"); por debajo de 1 M€, en miles ("850 K€"). Aplica a precios, presupuesto, compras, ventas y variaciones.
- Redondea los precios a múltiplos de **10 K€** (`PRECIO_REDONDEO = 10`).
- Migra los valores que ya existan en millones multiplicándolos por 1000.

## 2. Ranking del último partido
En la vista **Clasificación**, además de la tabla general, añade la pestaña **"Última jornada"** con un selector para ver jornadas anteriores:
- **Managers:** posición, manager y puntos de esa jornada (suma de sus 5 titulares). Al tocar una fila se despliega el desglose por jugador.
- **Jugadores:** posición, jugador, equipo, parte Votos, parte Estadísticas y total (0-20).
- Los empates comparten posición.
- Una jornada solo muestra puntos cuando su votación está cerrada; antes pone "pendiente de votos".

## 3. Votaciones: cada usuario vota (volver a ponerlo)
- Cada convocado vota **él mismo** desde "Partido y Votos" cuando se cierra el acta, tal como describe la sección 2 de `CAMBIOS_PUNTUACION.md` (ranking completo, arrastrando, sin votarse a sí mismo, anónimo).
- Un voto por usuario y pachanga. Se puede editar hasta que se cierra la votación.
- El panel de votación solo aparece a los convocados. Muestra cuántos han votado ("8 de 12"), pero no quién ha puesto qué.
- Comprueba que no se haya perdido nada de esto: pantalla, guardado en `lib/db.ts` y cierre a las 48 h o cuando han votado todos.

## 4. Las 5 primeras compras valen 20 M€
Para que un usuario nuevo pueda montar un equipo entero con su presupuesto de 100 M€:
- Cada cuenta tiene un contador `compras_iniciales`, que empieza en 0.
- Mientras `compras_iniciales < 5`, cada compra cuesta **20.000 K€ (20 M€)**, sea cual sea el precio real del jugador en ese momento, y el contador sube en 1. Esto solo vale para esa cuenta.
- Cuando el contador llega a 5, el resto de compras de esa cuenta se hacen al **precio real** del momento.
- **El precio de venta es siempre el precio real**, también para los 5 primeros. Nunca se vende "a 20 M€" por haberlo comprado así.
- El contador cuenta **compras hechas**, no jugadores que tiene. Vender y volver a comprar no lo reinicia.
- En el mercado, a un usuario con compras iniciales pendientes se le muestra el precio de 20 M€ en la tarjeta de cada jugador, con una pequeña etiqueta "precio inicial" junto al precio real. Indica cuántas compras iniciales le quedan ("3 de 5").
- Cuentas que ya existen: pon el contador igual al número de compras que ya hicieron, con máximo 5.
- Constantes: `COMPRAS_INICIALES = 5` y `PRECIO_COMPRA_INICIAL = 20000`.

## 5. Error: la clasificación total solo muestra mi usuario
Ahora mismo la tabla general solo lista al admin. Encuentra la causa antes de arreglarla. Mira al menos:
- Si la consulta filtra por el usuario de la sesión en vez de listar a todos.
- Si las políticas de seguridad de Supabase (RLS) solo dejan leer la fila propia.
- Si la tabla solo incluye a quien ya tiene una fila de puntos, y los demás con 0 puntos o sin jornadas quedan fuera.

Arreglo: la clasificación debe listar a **todos los usuarios registrados**, ordenados por puntos totales, incluidos los que tienen 0. Cada uno debe poder leer las filas de los demás (solo nombre, puntos y posición, nada privado). Añade un test con 3 usuarios, uno con 0 puntos.

## 6. Variación de precio tras cada partido
Hoy un jugador que saca 10 y otro que saca 7 suben lo mismo. Diagnostica por qué: lo más probable es que la subida se esté recortando al tope, que se esté redondeando a enteros, o que siga aplicándose la fórmula antigua (−20 % / +25 %). Sustitúyela por esta:

`variacion_% = clamp(PRECIO_SENS × (puntos − media_de_la_jornada), −15, +15)`

- `puntos` es el total del jugador en esa pachanga (0-20).
- `media_de_la_jornada` es la media de puntos de todos los jugadores que participaron. Es el punto neutro.
- `PRECIO_SENS = 2.5` (puntos porcentuales por cada punto de diferencia) y el tope sigue en ±15 %.
- La variación es **continua y estrictamente creciente** con los puntos: dos puntuaciones distintas dan variaciones distintas siempre que no se llegue al tope. No la redondees a enteros; el precio resultante se redondea a múltiplos de 10 K€ (sección 1).
- El nuevo precio es `precio_actual × (1 + variacion / 100)`.

Ejemplo con media de la jornada = 9,5 y precio de 20.000 K€:

| Puntos | Variación | Nuevo precio |
|---|---|---|
| 20 | +15 % (tope) | 23.000 K€ |
| 14 | +11,25 % | 22.250 K€ |
| 10 | +1,25 % | 20.250 K€ |
| 7 | −6,25 % | 18.750 K€ |
| 3 | −15 % (tope) | 17.000 K€ |

Si `PRECIO_SENS` hace que casi todos choquen con el tope, o que casi nadie se mueva, es la constante que hay que ajustar tras 3 o 4 partidos.

## 7. Tests obligatorios
- Formato de cifras: 20.000 → "20 M€"; 17.350 → "17,35 M€"; 850 → "850 K€".
- Compras iniciales: las primeras 5 cuestan 20.000 aunque el precio real sea otro; la sexta cuesta el precio real; vender un jugador comprado a 20.000 paga el precio real; vender y volver a comprar no reinicia el contador.
- Un usuario nuevo con 100.000 K€ puede comprar 5 jugadores seguidos.
- Variación de precio: 10 puntos y 7 puntos dan variaciones distintas; la variación es creciente con los puntos; respeta el tope de ±15 %; con media 9,5 los ejemplos de la tabla salen igual.
- Clasificación general: aparecen todos los usuarios, incluido el que tiene 0 puntos.
- Última jornada: mientras la votación está abierta, pone "pendiente de votos".
- Votación: un usuario no convocado no puede votar; un convocado puede editar su voto hasta el cierre.
