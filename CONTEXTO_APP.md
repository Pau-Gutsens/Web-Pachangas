# 👑 EGOL FANTASY — Guía y Contexto Completo de la Aplicación

Documento de referencia sobre la arquitectura, reglas del juego, economía, sistema de puntuación y funcionamiento técnico de **EGOL Fantasy** (Web-Pachangas).

> **Fuentes de verdad:** `CAMBIOS_PUNTUACION.md` para la puntuación y `CAMBIOS_MERCADO.md` para precios, mercado, ranking y votaciones. Esta guía los resume; si hay cualquier diferencia, mandan esos archivos.

---

## 1. Visión General del Proyecto
**EGOL Fantasy** es una plataforma Fantasy para las pachangas de un grupo de amigos (unos 15 integrantes, formato 5 vs 5 / 6 vs 6). Las pachangas se juegan cada cierto tiempo, no cada semana; no viene todo el mundo ni los equipos son siempre los mismos. Filosofía **"Set & Forget"** con estética oscura y dorada (*Dark & Gold*), logo de escudo y acceso adaptado a móvil.

---

## 2. Economía y Mercado de Fichajes
- **Cifras en miles**: precios y saldos se guardan como entero en K€ (20 M€ = 20000) y se muestran como "17,35 M€" o "850 K€". Los precios se redondean a múltiplos de 10 K€.
- **Presupuesto inicial**: cada usuario empieza con **100 M€**.
- **Precio base de los jugadores**: **20 M€**.
- **Primeras 5 compras**: las 5 primeras compras de cada cuenta cuestan 20 M€ aunque el precio real sea otro, para que un usuario nuevo pueda montar un equipo entero. Después todo se compra al precio real. Vender siempre paga el precio real.
- **Límites de plantilla**: máximo **6 jugadores** (5 titulares + 1 reserva). Para puntuar en la jornada hay que alinear a los **5 titulares**.
- **Plantilla persistente**: cada usuario mantiene su equipo entre jornadas y cambia jugadores vendiendo y fichando en el mercado.
- **Mercado 24/7**: todos los jugadores de la liga están siempre disponibles. Cada tarjeta muestra foto, nombre, precio en millones y la variación respecto al precio anterior (ej. `+10%`, `-5%`).
- **Invitados**: son jugadores normales con la etiqueta `(invitado)` junto al nombre. Vienen nunca o casi nunca.
- **Variación de precio tras cada jornada**:
  - `variacion_% = clamp(2,5 × (puntos − media_de_puntos_de_esa_jornada), −15, +15)`.
  - La media de puntos de esa jornada es el punto neutro, para que el mercado no se infle ni se hunda. Dos puntuaciones distintas dan variaciones distintas salvo en el tope.

---

## 3. Sistema Oficial de Puntuación EGOL (puntos enteros)
Cada jugador puntúa de **0 a 20** por pachanga:

`puntos = parte_subjetiva (0-10) + parte_objetiva (0-10)`, cada parte redondeada a entero.

Los puntos de cada manager son la suma de los de sus 5 titulares.

### 3.1 Acta del admin (modo directo)
Quien descansa durante el partido apunta solo:
- Cada **gol**: goleador y, si hubo, asistente (dos toques).
- **Autogoles**.
- **Salvada** (opcional): acción que evita un gol casi seguro (parada o despeje sobre la línea). +2, máximo 3 por jugador y partido.

El resultado sale de la suma de goles. La app cuadra los goles con el marcador antes de cerrar el acta, muestra el marcador en directo a todos y da 24 h a los jugadores para pedir correcciones. **No hay** goles encajados por jugador, casilla de portero ni bonus por tramos de portería. Detalles en `CAMBIOS_PUNTUACION.md`.

### 3.2 Parte subjetiva (ranking, 0-10)
- Al cerrar el acta se abre la votación. Votan solo los usuarios **convocados**, de forma anónima y sin votarse a sí mismos.
- Cada votante **ordena a todos los demás participantes** (invitados incluidos) del 1 (mejor) al `m`, sin repetir posiciones y con el ranking completo.
- `n` = participantes de la pachanga y `m = n − 1`.
- `P = 0.5 × P_compañeros + 0.5 × P_rivales` (si un grupo tiene menos de 2 votos, `P` es la media de todas las posiciones).
- `N_subj = 10 × (m − P) / (m − 1)`, redondeado.
- Con menos de **4 votantes**, la parte subjetiva de todos es **5**.

### 3.3 Parte objetiva (0-10)
Puntos en bruto:
- Gol **+3**, asistencia **+1**, autogol **−2**, salvada **+2** (máx. 3 por partido).
- Victoria **+3**, empate **+1**, derrota **0**.
- **MVP +3**: el jugador con mejor nota subjetiva (empate: el de más puntos en bruto).

Conversión: `N_obj = 10 × clamp(bruto, 0, 20) / 20` (`OBJETIVO_MODO = "tope"`, `TOPE_OBJ = 20`).

### 3.4 Ciclo de votación y datos en bruto
- La votación se cierra cuando han votado todos los convocados o a las **48 h**.
- Los puntos finales y la clasificación se publican al cerrar la votación (antes, "pendiente de votos").
- Se guardan siempre los **datos en bruto** (goles, asistencias, autogoles, resultado y cada ranking completo). Los puntos y los precios se calculan a partir de ellos y de las constantes de configuración, así que cambiar una constante recalcula el historial.
- **Nota media del cromo**: media de temporada de `N_subj`, ajustada con `(suma + 2 × media_del_grupo) / (pachangas + 2)`. Hasta 3 pachangas con nota se muestra "—".

---

## 4. Partidos y Horarios
Al crear una pachanga, el administrador define fecha, hora de inicio, hora de fin y formato (ej. 5 vs 5). Después convoca a los jugadores en Equipo A y Equipo B.

---

## 5. Control de Accesos y Roles
- **Usuarios estándar**: cuatro vistas.
  1. **Mi Equipo**: 5 titulares + 1 reserva.
  2. **Mercado**: compra y venta con precios y tendencias.
  3. **Partido del Día**: horario, equipos A vs B y votación por ranking.
  4. **Clasificación**: tabla general acumulada de todos los managers y pestaña "Última jornada" con el ranking de managers y de jugadores de ese partido.
- **Administrador (Pagusa)**: único con acceso a `/admin`. Puede crear partidos con horario, convocar jugadores a los equipos, registrar fichajes e invitados, y rellenar y publicar el acta.

---

## 6. Autenticación y Seguridad
- Usuario y contraseña, con botón de ojo para mostrar u ocultar la contraseña.
- Recuperación rápida de contraseña.
- Sesiones y datos persistentes.

---

## 7. Arquitectura Técnica del Proyecto
```
Web-Pachangas/
├── app/
│   ├── admin/page.tsx         # Panel de administración (protegido)
│   ├── api/pachangas/         # Endpoints
│   ├── globals.css            # Estilos globales y paleta dark/gold
│   ├── layout.tsx             # Layout raíz
│   └── page.tsx               # Aplicación principal con pestañas
├── components/
│   ├── AdminView.tsx          # Partidos, acta mínima y altas
│   ├── AuthView.tsx           # Login, registro y recuperación
│   ├── LeaderboardView.tsx    # Clasificación de mánagers
│   ├── MarketView.tsx         # Mercado 24/7
│   ├── MatchDayView.tsx       # Partido activo y votación por ranking
│   ├── MyTeamView.tsx         # 5 titulares + reserva
│   └── Navbar.tsx             # Navegación y logo
├── lib/
│   ├── config.ts              # Todas las constantes (TOPE_OBJ, OBJETIVO_MODO, ±15 %, mínimo de votantes...)
│   ├── db.ts                  # Datos, auth, actas y votos (datos en bruto)
│   ├── scoring.ts             # Motor de puntuación y precios, calculados desde los datos en bruto
│   ├── seed.ts                # Datos iniciales
│   └── supabase.ts            # Cliente Supabase
├── public/
│   └── logo.png               # Escudo oficial dorado EGOL
├── types/
│   └── index.ts               # Tipos TypeScript
├── CONTEXTO_APP.md            # Este documento
├── CAMBIOS_PUNTUACION.md      # Fuente de verdad de la puntuación
└── package.json
```

---

## 8. Descartado a propósito (no implementar)
- Paradas y goles encajados por jugador, casilla de portero y bonus por tramos de portería.
- Bonus de victoria a los managers.
- Bonus de equipo por encajar pocos goles.
- Votación de MVP aparte.
- Cualquier cálculo de puntos que no parta de los datos en bruto.
