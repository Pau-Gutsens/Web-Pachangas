# EGOL FANTASY: especificación completa (único archivo de referencia)

> **Para Claude Code.** Este es el **único** documento de la app. Si en la carpeta hay `CONTEXTO_APP.md`, `CAMBIOS_PUNTUACION.md`, `CAMBIOS_MERCADO.md`, `CAMBIOS_NOTAS.md` o `FANTASY_SPEC.md`, están **obsoletos**: ignóralos y no los uses para nada.
>
> **Qué tienes que hacer:** lee este archivo entero, compara con lo que hay hecho en el código y deja la app exactamente como aquí se describe. Después **verifica de verdad** que está hecho (sección 16). Si algo de este archivo es ambiguo o se contradice, **pregúntame antes de implementarlo** y no lo resuelvas por tu cuenta. Si el código actual contradice este archivo, manda este archivo.

---

## 0. Cómo trabajar

1. **Backup primero.** Antes de migrar nada, exporta los datos actuales de Supabase (usuarios, jugadores, partidos, actas, votos, alineaciones, precios, saldos) a una carpeta `backup/` y dime dónde está.
2. **Diagnóstico antes de tocar código.** Explícame en pocas líneas la causa de los dos errores conocidos de la sección 14.
3. **Tabla de estado inicial.** Dame una tabla con cada sección de este archivo y su estado real: hecho / parcial / no hecho, con archivo y función concreta.
4. Implementa por fases (sección 15). Al acabar cada fase, dime qué probar a mano.
5. No des nada por hecho sin poder señalar la función concreta donde está.
6. **Borra el código viejo** que contradiga este archivo (sección 13).
7. **No toques** el diseño (estética oscura y dorada, logo), ni el login y la recuperación de contraseña, salvo lo que este archivo pida.
8. Todas las constantes van en `lib/config.ts` (sección 12). Nada de números mágicos repartidos por el código.
9. Idioma de la app: castellano.

---

## 1. Qué es la app

**EGOL Fantasy** es un fantasy para las pachangas de un grupo de amigos (unos 15 integrantes). Cada usuario es un **manager** que arma un equipo con jugadores reales del grupo, y esos jugadores puntúan según lo que hacen y según cómo los valoran los demás en cada partido. Gana quien más puntos suma en el año.

- Las pachangas se juegan de vez en cuando, no cada semana.
- No viene todo el mundo a cada partido y los equipos cambian.
- A veces vienen invitados de otro grupo para cuadrar los equipos.
- Los equipos pueden ser de cualquier tamaño y **desiguales** (5v5, 5v6, 6v6, 7v7...). No fijes el formato en ningún sitio: en el acta, el admin elige quién juega en cada equipo y el número puede ser distinto en cada lado.
- Filosofía "Set & Forget": una plantilla persistente que no hay que rehacer cada jornada.

**Glosario:** *jugador* = persona que juega las pachangas (15 del grupo + invitados). *Manager* o *usuario* = cuenta de la app que juega al fantasy. *Jornada* = una pachanga. *Titular* = uno de los 5 jugadores alineados de un manager.

---

## 2. Cuentas y jugadores (vinculación)

Son dos listas distintas: **cuentas** (usuario y contraseña) y **jugadores** (los 15 y los invitados). Cada jugador puede tener como mucho una cuenta, y cada cuenta como mucho un jugador.

- **Al registrarse**, la persona elige "¿quién eres?" entre los jugadores que aún no tienen cuenta, o "solo juego al fantasy". La solicitud queda **pendiente hasta que el admin la apruebe**, para que nadie se haga pasar por otro.
- El admin puede aprobar, cambiar o quitar un vínculo en cualquier momento desde `/admin`.
- Las cuentas que ya existen se vinculan a mano una vez desde el panel de admin.
- **Admin:** la cuenta `Pagusa` es la única administradora y está vinculada al jugador `Gutsens`.
- **Para qué sirve el vínculo:**
  - Puede votar quien tiene un jugador vinculado que esté convocado a ese partido.
  - En su ranking no se incluye a sí mismo, y la app sabe quiénes son sus compañeros y quiénes sus rivales por el equipo de su jugador.
  - Un manager puede ficharse a sí mismo (está permitido) porque la app sabe cuál es su jugador.
  - Una cuenta sin jugador solo juega al fantasy y no vota.
- Los **invitados** no tienen cuenta. Son jugadores normales con la etiqueta `(invitado)` junto al nombre: aparecen en el mercado, se pueden fichar y pueden ser MVP.

---

## 3. Ciclo de un partido

| Etapa | Qué pasa |
|---|---|
| **Creado** | El admin define fecha, hora de inicio y hora de fin, y convoca a los jugadores en Equipo A y Equipo B. Puede cambiar la hora mientras no haya empezado. |
| **Bloqueado** | Al llegar la hora de inicio (zona horaria Europe/Madrid), el mercado y las alineaciones de **todos** los managers se bloquean y se guarda una **foto de cada alineación** (5 titulares, capitán y reserva). |
| **En juego** | El admin apunta el acta en modo directo (sección 5). |
| **Acta cerrada** | Se abren a la vez la **votación** (hasta 48 h o hasta que hayan votado todos los convocados con cuenta, lo que ocurra antes) y la **ventana de corrección** (24 h). |
| **Publicado** | Cuando ambas se han cerrado se calculan y publican los puntos de jugadores y managers, y se actualizan los precios. Se desbloquean el mercado y las alineaciones. |

Antes de publicar, la clasificación muestra "pendiente de votos". El mercado sigue bloqueado hasta publicar para que nadie compre a precio viejo después de ver los resultados.

---

## 4. Alineación y capitán

- Cada manager tiene **máximo 6 jugadores**: 5 titulares + 1 reserva. Para puntuar hay que alinear a los 5 titulares.
- La plantilla es persistente: se mantiene de un partido al siguiente. Se cambia vendiendo y comprando en el mercado.
- **Capitán:** un titular, cuyos puntos cuentan **doble** (`CAPITAN_MULT = 2`). Se mantiene de un partido al siguiente. Si lo vendes o lo pasas al banquillo, no hay capitán hasta que elijas otro.
- Se puede cambiar titulares, reserva y capitán en cualquier momento **hasta el bloqueo**.
- **Si un titular no juega ese partido, se queda en el equipo con 0 puntos.** El reserva **no** lo sustituye. El reserva solo puntúa si el manager lo pone de titular antes del bloqueo.
- Si el capitán no juega, su doble vale 0.
- **Puntos del manager en una jornada** = suma de los puntos enteros de los 5 titulares de su foto de alineación, con el capitán ×2. Un jugador que no participó en el partido suma 0.

---

## 5. Acta del admin: modo directo

La apunta quien está descansando durante el partido, así que tiene que ser rápida y a prueba de fallos. Solo se registra:
- Cada **gol**: goleador y, si hubo, asistente (dos toques por gol, con botón "sin asistencia").
- **Autogoles.**
- **Salvada** (opcional): un botón y se elige quién.
- El resultado se calcula solo de los goles.

**Modo directo:**
- Pantalla con el marcador grande y un botón por equipo ("Gol blanco", "Gol azul").
- Botón **deshacer** siempre visible (elimina solo el último evento).
- El marcador se ve en directo en el móvil de todos los convocados, para detectar errores en el momento.
- Funciona aunque se pierda la cobertura un momento (guarda en local y sincroniza al volver).

**Cuadre automático:** los goles atribuidos a los jugadores de un equipo, más los autogoles del rival, deben coincidir con el marcador. Si no cuadra, al cerrar el acta se avisa ("Al equipo X le faltan N goles por atribuir") y no se puede cerrar hasta resolverlo. Las asistencias no se pueden cuadrar así.

**Ventana de corrección (24 h):** al cerrar el acta, cada convocado ve sus goles, asistencias y salvadas con un botón "no está bien" y puede pedir una corrección o añadir una acción que falta. El admin acepta o rechaza cada petición.

**Qué es una salvada:** acción que evita un gol casi seguro, ya sea una parada de un tiro que iba a gol o un despeje sobre la línea. Un tiro flojo a las manos, un balón que iba fuera o un despeje normal **no** cuentan. Vale para cualquier jugador, no solo para el portero.

---

## 6. Puntuación de un jugador en un partido

Cada jugador puntúa de **0 a 20** en cada partido:

`puntos = Votos (0-10) + Estadísticas (0-10)`

- **Reparto fijo 50/50.** No hay constantes para cambiarlo.
- **Las partes no se redondean**: se guardan y se suman con decimales. Solo el **total final se redondea a entero** (el .5 sube).

### 6.1 Estadísticas (0-10)
Puntos en bruto:

| Acción | Puntos |
|---|---|
| Gol | +3 |
| Asistencia | +1 |
| Autogol | −2 |
| Salvada | +2 (máximo 3 por jugador y partido) |
| Victoria de su equipo | +3 |
| Empate | +1 |
| Derrota | 0 |
| MVP | +3 |

**MVP:** el jugador con mejor nota de Votos del partido (sin redondear). Empate: el de más puntos en bruto sin contar el MVP. No hay votación aparte. Puede ser un invitado.

`Estadísticas = 10 × clamp(bruto, 0, 20) / 20`, sin redondear. Con 20 puntos en bruto ya se tiene el máximo, y más no suman.

### 6.2 Votos (0-10)
1. **Quién vota:** los usuarios con un jugador vinculado que esté convocado a ese partido. El voto es **anónimo**: nadie ve quién puso qué, tampoco el admin.
2. **Qué se vota:** cada votante **ordena a todos los demás participantes** del partido (invitados incluidos), del 1 (mejor) al último, **sin repetir posiciones y con el ranking completo**. No se incluye a sí mismo. En móvil: una lista que se reordena arrastrando.
3. **Puntuación de cada voto:** si el votante ordenó `m` jugadores y un jugador quedó en la posición `pos`, ese voto le da `(m − pos) / (m − 1)`, un valor entre 0 (último) y 1 (primero).
4. **Mezcla compañeros y rivales:** se calcula la media de los votos de sus compañeros de equipo y la media de los votos de los rivales. `Votos = 10 × (0,5 × media_compañeros + 0,5 × media_rivales)`. Así un equipo no puede inflarse a sí mismo. Si uno de los dos grupos tiene menos de 2 votos, se usa la media de todos los votos juntos.
5. **Pocos votantes:** si en total votan menos de **4**, la parte Votos de todos es **5** y se avisa en pantalla.
6. Si la votación se cierra por las 48 h, solo cuentan los votos enviados.

*Ejemplo (12 participantes, `m = 11`):* si un jugador recibe las posiciones 3, 7, 9, 7 y 11, la posición media es 7,4 y su puntuación de Votos es `10 × (11 − 7,4) / 10 = 3,6` (se queda en 3,6).

### 6.3 Nota media del cromo
Media de la temporada (año) de la parte Votos del jugador, ajustada con `(suma + 2 × media_del_grupo) / (pachangas_con_nota + 2)`, donde `media_del_grupo` es la media de la parte Votos de todos los jugadores esa temporada. Hasta tener **3 pachangas con nota** se muestra "—".

---

## 7. Economía y mercado

- **Cifras en miles:** todos los precios y saldos se guardan como **entero en miles de euros (K€)**: 20 M€ = `20000`.
- **Formato:** desde 1 M€ en adelante se muestra en millones con hasta 2 decimales y coma ("17,35 M€", "20 M€"); por debajo de 1 M€, en miles ("850 K€"). Aplica a precios, saldos, compras, ventas y variaciones.
- **Redondeo:** los precios se redondean al múltiplo de **10 K€** más cercano.
- **Saldo inicial** de cada usuario: 100 M€ (`100000`).
- **Precio inicial** de todos los jugadores: 20 M€ (`20000`).
- **Todas las compras y ventas se pagan al precio real del jugador en ese momento**, también para cuentas nuevas. No hay descuentos, comisiones ni compras iniciales especiales. El saldo no puede quedar negativo.
- **Mercado 24/7** (salvo bloqueo): todos los jugadores están siempre disponibles. Cada tarjeta muestra foto, nombre (con `(invitado)` si lo es), precio y variación respecto al precio anterior.
- Se puede comprar a cualquiera, incluido uno mismo.

### 7.1 Variación del precio tras cada partido
Solo cambian de precio los jugadores que **participaron** en el partido. Los demás se quedan igual. Para cada uno:

`variación_% = clamp(2,5 × (puntos − media_de_la_jornada), −15, +15)`

- `puntos` es el total **entero** del jugador (0-20).
- `media_de_la_jornada` es la media de los totales enteros de todos los jugadores que participaron. Es el punto neutro.
- `nuevo_precio = precio_actual × (1 + variación / 100)`, redondeado a múltiplos de 10 K€.
- No hay precio mínimo ni máximo.
- La variación debe ser **continua y estrictamente creciente** con los puntos: dos totales distintos dan variaciones distintas siempre que no se llegue al tope. No la redondees a enteros.

*Ejemplo (media 9,5 y precio 20.000 K€):* 20 puntos → +15 % (23.000); 14 → +11,25 % (22.250); 10 → +1,25 % (20.250); 7 → −6,25 % (18.750); 3 → −15 % (17.000).

---

## 8. Clasificaciones

- **General:** suma de puntos de los managers en la **temporada actual**. Debe listar a **todos los usuarios registrados**, ordenados por puntos, incluidos los que tienen 0. Los empates comparten posición. Cada usuario debe poder leer nombre, puntos y posición de los demás (nada privado).
- **Última jornada:** pestaña con selector para ver jornadas anteriores.
  - *Managers:* posición, manager y puntos de esa jornada. Al tocar una fila se despliega el desglose por jugador.
  - *Jugadores:* posición, jugador, equipo, parte Votos y parte Estadísticas (cada una con 1 decimal) y total (entero).
  - Una jornada solo muestra puntos cuando está publicada; antes pone "pendiente de votos".
- **Reinicio anual:** el 1 de enero se reinician solo los **puntos** de la clasificación. Los saldos, las plantillas y los precios se mantienen. La clasificación final de cada año se guarda y se puede consultar.

---

## 9. Vistas y roles

**Usuarios estándar:**
1. **Mi Equipo:** 5 titulares, reserva y capitán.
2. **Mercado:** compra y venta, con precios y tendencias.
3. **Partido del Día:** horario, equipos A y B, marcador en directo, ventana de corrección y votación.
4. **Clasificación:** general, última jornada y temporadas anteriores.

**Administrador (`Pagusa`, `/admin`):** crear partidos con horario y convocar equipos, crear jugadores e invitados, aprobar y editar vínculos cuenta-jugador, apuntar y cerrar el acta, aceptar o rechazar correcciones, y reabrir un partido publicado.

**Reabrir un partido ya publicado:** el admin puede corregir el acta y todo se recalcula desde los datos en bruto (puntos, clasificación y precios de ese partido en adelante).

---

## 10. Datos en bruto y recálculo

- Guarda siempre los **datos en bruto**: cada gol (goleador y asistente), autogoles, salvadas, resultado, equipos, cada ranking de voto completo y la foto de cada alineación al bloquear.
- Los puntos de jugadores y managers y los precios **se calculan a partir de esos datos y de las constantes**. Si se corrige un dato o se cambia una constante, se recalcula todo el historial en orden, partiendo del precio inicial.
- Nunca guardes solo los puntos finales.

---

## 11. Migración y partido del 6 de noviembre

- Los precios y saldos actuales (en M€) se pasan a K€ multiplicándolos por 1000.
- **El partido del 6 de noviembre cuenta como jornada oficial** (la primera) y además sirve de **prueba de verificación** (sección 17).
  - Recalcula sus puntos con las reglas de este archivo y reparte los de los managers usando las **alineaciones que cada manager tenía guardadas ese día**. Si no hay alineaciones guardadas de ese día, usa las actuales y dímelo.
  - **Los precios actuales se descartan.** Recalcula los precios desde 20.000 K€ aplicando solo este partido con la fórmula de la sección 7.1. Los saldos y las plantillas se mantienen tal como están.
- Cualquier otro partido que exista y no sea el del 6 de noviembre: no lo borres. Márcalo como "no oficial" (excluido de puntos, clasificación y precios) y dime cuáles hay.
- Las cuentas existentes se vinculan a mano (sección 2).

---

## 12. Constantes (`lib/config.ts`)

```ts
PRESUPUESTO_INICIAL = 100000   // K€
PRECIO_BASE = 20000            // K€
PRECIO_REDONDEO = 10           // K€
PRECIO_SENS = 2.5              // % por punto sobre la media
PRECIO_VAR_MAX = 15            // % tope por partido
MAX_PLANTILLA = 6              // 5 titulares + 1 reserva
TITULARES = 5
CAPITAN_MULT = 2
TOPE_OBJ = 20                  // puntos en bruto para el máximo de Estadísticas
PUNTOS = { GOL: 3, ASISTENCIA: 1, AUTOGOL: -2, SALVADA: 2, VICTORIA: 3, EMPATE: 1, MVP: 3 }
SALVADA_MAX = 3
MIN_VOTANTES = 4
MIN_VOTOS_POR_GRUPO = 2
VOTOS_NEUTRO = 5
VOTACION_HORAS = 48
CORRECCION_HORAS = 24
CROMO_K = 2
CROMO_MIN_PACHANGAS = 3
ZONA_HORARIA = "Europe/Madrid"
```

---

## 13. Descartado y código que hay que borrar

No implementes, y si existe en el código, bórralo:
- Paradas y goles encajados por jugador, casilla de portero y bonus por tramos de portería (`getGoalsAgainstPoints` y similares).
- Bonus de puntos a los managers por victoria.
- Nota comunitaria de 1 a 10 con media simple mostrada solo en el cromo (sustituida por el ranking de Votos).
- Votación de MVP aparte.
- Bonus de equipo por encajar pocos goles.
- Reparto distinto de 50/50, curvas de rendimiento decreciente y "modo ranking" para las Estadísticas.
- Regla de "las 5 primeras compras a 20 M€" y cualquier modo de compra inicial.
- Variación de precio antigua (−20 % / +25 %) y cualquier variación redondeada a enteros.
- Sustitución automática del reserva.
- Jugada destacada, grabación de partidos o revisión por vídeo.
- Penaltis, tarjetas, tiros a puerta, pases clave y recuperaciones como estadísticas.
- Avisos por correo (solo un aviso dentro de la app cuando se abre una votación).

---

## 14. Errores conocidos: diagnostícalos antes de arreglarlos

1. **La clasificación general solo muestra el usuario admin.** Busca la causa y explícamela. Revisa al menos: si la consulta filtra por el usuario de la sesión; si las políticas RLS de Supabase solo dejan leer la fila propia; si la tabla solo incluye a quien ya tiene una fila de puntos y excluye a los de 0. Arreglo: sección 8.
2. **Un jugador de 10 puntos y otro de 7 suben el mismo porcentaje.** Busca la causa (tope que recorta, redondeo a enteros, fórmula antigua) y explícamela. Arreglo: sección 7.1.

---

## 15. Fases

1. **Base y datos:** backup, `lib/config.ts`, migración a K€, vínculos cuenta-jugador, temporadas, borrar código viejo.
2. **Motor de puntuación:** `lib/scoring.ts` puro, calculado desde datos en bruto, con tests y la prueba del 6 de noviembre.
3. **Acta y votación:** modo directo, cuadre, ventana de corrección, votación por ranking.
4. **Fantasy y mercado:** alineación, capitán, bloqueo con foto de alineación, compras y ventas, variación de precios.
5. **Clasificaciones y migración:** general, última jornada, reinicio anual, partido del 6 de noviembre como jornada oficial.
6. **Verificación final** (sección 16).

---

## 16. Verificación final (obligatoria)

Al terminar, entrégame:
1. La **tabla de estado final** de cada sección de este archivo (hecho / parcial / no hecho) con archivo y función concretos. No marques "hecho" lo que no puedas señalar en el código.
2. El **comando de tests** y su salida completa, con cuáles pasan y cuáles fallan.
3. La **prueba del partido del 6 de noviembre** (sección 17) pasando: totales y precios iguales a los esperados.
4. Una lista de **qué debo probar yo a mano** en la app.
5. Una lista de **todo lo que has cambiado respecto a este archivo** o no has podido hacer, y por qué.

---

## 17. Tests obligatorios

**Puntuación**
- Votos: el ejemplo de la sección 6.2 da 3,6; mejor posible = 10; peor posible = 0.
- Mezcla compañeros y rivales; caso de menos de 2 votos en un grupo.
- Menos de 4 votantes → 5 para todos.
- Un votante no puede votarse a sí mismo ni dejar un ranking incompleto o con posiciones repetidas.
- Estadísticas: 8 goles + victoria = 27 en bruto → 10; un bruto negativo → 0; 4 salvadas cuentan solo 3.
- MVP asignado al mejor Votos, con desempate.
- Redondeo del total: 7,28 + 4,5 = 11,78 → 12; 3,78 + 3,5 = 7,28 → 7; 4,65 + 1,5 = 6,15 → 6; un total x,5 sube.
- Equipos desiguales (5v6) y 7v7 funcionan sin errores.

**Acta**
- Cuadre: si los goles atribuidos más los autogoles del rival no coinciden con el marcador, no se puede cerrar el acta.
- Ventana de corrección: una petición aceptada recalcula los puntos; una rechazada no cambia nada.
- Deshacer elimina solo el último evento.

**Fantasy y mercado**
- Capitán ×2; capitán que no juega → 0; titular que no juega → 0 y el reserva no lo sustituye.
- Bloqueo a la hora de inicio: antes se puede comprar, vender y cambiar la alineación; después no, hasta publicar. La foto de alineación se guarda al bloquear.
- Todas las compras y ventas al precio real; el saldo no baja de 0; máximo 6 jugadores.
- Variación de precio: 10 y 7 puntos dan variaciones distintas; es creciente; respeta el tope de ±15 %; con media 9,5 sale la tabla del ejemplo; solo cambian los jugadores que participaron.
- Formato: 20.000 → "20 M€"; 17.350 → "17,35 M€"; 850 → "850 K€".

**Clasificaciones y cuentas**
- La clasificación general lista a todos los usuarios, incluido uno con 0 puntos.
- "Última jornada" pone "pendiente de votos" mientras no esté publicada.
- Reinicio anual: reinicia los puntos pero no saldos, plantillas ni precios, y guarda la clasificación del año.
- Vinculación: solo vota quien tiene jugador vinculado y convocado; el admin puede aprobar y quitar vínculos.

### Prueba de verificación: partido del 6 de noviembre

Resultado: **blanco 15 – 11 azul** (gana blanco). Sin autogoles ni salvadas. Equipos:
- **Blanco:** Gerard, Eloy, Dávila, Salinas, Tais, Merino.
- **Azul:** Sergi, Bernús, Uri, Dean, Lombun, Pedret.

**Acta (goles / asistencias):** Gerard 8/0, Eloy 2/0, Dávila 1/0, Salinas 0/0, Tais 1/0, Merino 3/0, Sergi 0/1, Bernús 4/2, Uri 1/0, Dean 2/1, Lombun 3/2, Pedret 1/1.

**Votos recibidos** (notas de 1 a 10 que dio cada votante, antes de existir el ranking). **Solo para esta prueba:** conviértelas a ranking ordenando de mayor a menor nota; los empates comparten la posición media. Un voto con un 0 cuenta como 1. Lombun puntuó solo a 8 jugadores (cada voto se normaliza con su propio `m`). **Uri no votó** (11 votantes).

```
Dean:    Eloy 6, Gerard 10, Salinas 5, Dávila 3, Tais 2, Merino 6, Pedret 7, Sergi 2, Bernús 8, Lombun 4, Uri 7
Dávila:  Gerard 10, Eloy 9, Salinas 7, Tais 4, Merino 7, Sergi 6, Bernús 8, Uri 7, Dean 6, Lombun 6, Pedret 5
Lombun:  Dávila 4, Salinas 1, Tais 7, Merino 7, Sergi 5, Bernús 9, Dean 8, Pedret 7
Tais:    Gerard 10, Eloy 9, Dávila 7, Salinas 8, Merino 2, Sergi 5, Bernús 7, Uri 8, Dean 4, Lombun 4, Pedret 5
Sergi:   Gerard 10, Eloy 9, Dávila 7, Salinas 8, Tais 7, Merino 7, Bernús 8, Uri 8, Dean 7, Lombun 7, Pedret 8
Gerard:  Eloy 8, Dávila 7.5, Salinas 8, Tais 7, Merino 9, Sergi 6, Bernús 8.5, Uri 7, Dean 6, Lombun 6, Pedret 6
Pedret:  Gerard 10, Eloy 2, Dávila 1, Salinas 2, Tais 4, Merino 4, Sergi 1, Bernús 3, Uri 7, Dean 7, Lombun 1
Eloy:    Gerard 10, Dávila 8.5, Salinas 7.5, Tais 7.5, Merino 9, Sergi 5, Bernús 8.5, Uri 7, Dean 6, Lombun 7, Pedret 5
Merino:  Gerard 10, Eloy 7, Dávila 5, Salinas 4, Tais 5, Sergi 6, Bernús 9, Uri 8, Dean 7, Lombun 7, Pedret 5
Bernús:  Lombun 7, Sergi 4, Uri 5, Pedret 4, Dean 4, Tais 4, Merino 6, Dávila 6, Gerard 10, Eloy 8, Salinas 6
Salinas: Gerard 10, Dávila 8, Eloy 8, Tais 7, Merino 8, Sergi 8, Bernús 7, Uri 7, Dean 6, Lombun 6, Pedret 7
```

**Resultado esperado** (los Votos pueden diferir en ±0,05; el total y el precio deben coincidir exactamente):

| Jugador | Bruto | Votos | Estadísticas | **Total** | Variación | **Precio nuevo (K€)** |
|---|---|---|---|---|---|---|
| Gerard (MVP) | 30 | 10,00 | 10,00 | **20** | +15 % | 23.000 |
| Bernús | 14 | 7,35 | 7,00 | **14** | +12,08 % | 22.420 |
| Eloy | 9 | 7,28 | 4,50 | **12** | +7,08 % | 21.420 |
| Merino | 12 | 5,82 | 6,00 | **12** | +7,08 % | 21.420 |
| Lombun | 11 | 3,08 | 5,50 | **9** | −0,42 % | 19.920 |
| Uri | 3 | 6,06 | 1,50 | **8** | −2,92 % | 19.420 |
| Dean | 7 | 3,78 | 3,50 | **7** | −5,42 % | 18.920 |
| Dávila | 6 | 4,09 | 3,00 | **7** | −5,42 % | 18.920 |
| Salinas | 3 | 4,65 | 1,50 | **6** | −7,92 % | 18.420 |
| Pedret | 4 | 3,65 | 2,00 | **6** | −7,92 % | 18.420 |
| Tais | 6 | 3,17 | 3,00 | **6** | −7,92 % | 18.420 |
| Sergi | 1 | 2,40 | 0,50 | **3** | −15 % (tope) | 17.000 |

El bruto de Gerard (30) incluye el MVP; Estadísticas = 10 (tope). La media de la jornada es 110 / 12 = 9,17. Los jugadores que no jugaron ese partido se quedan en 20.000 K€.
