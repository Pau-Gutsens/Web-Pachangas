# 👑 EGOL FANTASY — Guía y Contexto Completo de la Aplicación

Documento oficial de referencia sobre la arquitectura, reglas del juego, economía, sistema de puntuación y funcionamiento técnico de la plataforma **EGOL Fantasy** (Web-Pachangas).

---

## 1. Visión General del Proyecto
**EGOL Fantasy** es una plataforma Fantasy moderna, rápida y adaptada al fútbol amateur ("pachangas de barrio" 5 vs 5 / 7 vs 7). A diferencia de los juegos comerciales rígidos, EGOL Fantasy está optimizado bajo la filosofía **"Set & Forget"** (Configura y Olvídate) con estética premium oscura y dorada (*Dark & Gold*), logo de escudo oficial y acceso adaptado a dispositivos móviles.

---

## 2. Economía y Mercado de Fichajes
- **Presupuesto inicial**: Cada nuevo usuario registrado comienza con un capital de **100 Millones de euros (100M€)**.
- **Precio base de los jugadores**: Todos los jugadores inician en el mercado con un valor de **20 Millones de euros (20M€)**.
- **Límites de plantilla**:
  - Máximo de **6 jugadores en propiedad** (5 titulares + 1 suplente/reserva).
  - No hay mínimo obligatorio para tener menos jugadores.
  - Para disputar y puntuar en la jornada debes alinear a tus **5 titulares**.
- **Plantilla única y persistente**: Cada usuario mantiene su equipo entre jornadas. Para cambiar jugadores de cara al siguiente partido, simplemente acude al mercado, vende a uno y ficha a otro.
- **Mercado 24/7**:
  - En el mercado siempre están disponibles todos los jugadores de la liga.
  - Cada tarjeta de jugador muestra: fotografía, nombre, precio actual en millones (ej. `20M€`) y el **porcentaje de variación** respecto al precio anterior (ej. `+10%`, `-5%`).
  - Los invitados se muestran como jugadores normales con la etiqueta `(invitado)` al lado de su nombre.
  - Los valores se recalculan automáticamente tras cada jornada según el rendimiento deportivo (sin decimales extraños).

---

## 3. Sistema Oficial de Puntuación EGOL (Puntos Enteros)
> [!IMPORTANT]
> **Sin decimales**: Todas las puntuaciones de las jornadas son números enteros redondeados para evitar confusiones y piques matemáticos.

### 🧤 Tramos de Goles Encajados en Portería
Para evitar que los jugadores que defienden la meta solo resten puntos, se premia la labor defensiva mediante tramos de solidez:
- **0 goles encajados (portería imbatida)**: **+10 pts**
- **1 a 3 goles encajados**: **+5 pts**
- **4 a 5 goles encajados**: **+3 pts**
- **6 a 7 goles encajados**: **+2 pts**
- **8 a 10 goles encajados**: **+1 pt**
- **Más de 10 goles encajados**: **0 pts**

### ⚽ Estadísticas de Partido
- **Gol marcado**: **+3 pts**
- **Asistencia de gol**: **+2 pts**
- **Parada**: **+1 pt**
- **Autogol / Gol en propia meta**: **-2 pts**
- **Victoria de equipo** (si su equipo gana el partido): **+2 pts**

### 🔄 "Tots poden ser tot" (Flexibilidad Total)
En el fútbol amateur cualquiera puede rotar a la portería o subir al ataque. En el acta estadística **se eliminó el recuadro restrictivo de seleccionar portero**:
- Todos los jugadores disponen de los campos de Goles, Asistencias, Paradas, Goles Encajados y Autogoles.
- Si un jugador tiene registradas paradas o goles encajados, se le aplica automáticamente la bonificación por tramos de portería.

---

## 4. Partidos, Horarios y Calificaciones Comunitarias (1 al 10)
1. **Creación con Horario**: Al crear una pachanga, el administrador define:
   - Fecha del partido.
   - Hora de inicio (ej. `17:00`).
   - Hora de finalización (ej. `18:30`).
   - Formato (ej. 5 vs 5).
2. **Votaciones Post-Partido**:
   - Una vez finalizada la hora del partido (o cuando el administrador cierra el acta), se abre automáticamente el panel de votación comunitaria en la pestaña **"Partido y Votos"**.
   - Cada usuario puntúa el rendimiento de los jugadores convocados entre **1 y 10**.
   - El sistema calcula la **nota media comunitaria** de cada jugador y la exhibe en su cromo hasta el siguiente encuentro que dispute.

---

## 5. Control de Accesos y Roles
- **Usuarios Estándar**: Acceso exclusivo y enfocado a las 4 vistas clave:
  1. **Mi Equipo**: Gestión de tus 5 titulares + 1 reserva y alineación.
  2. **Mercado**: Compra y venta de jugadores con visualización de precios y tendencias.
  3. **Partido del Día**: Horario, convocatoria de equipos A vs B y calificaciones 1-10.
  4. **Clasificación**: Tabla general acumulada de puntos entre todos los mánagers.
- **Administrador (Pau)**:
  - Solo Pau tiene acceso a la pestaña y ruta `/admin`.
  - Herramientas exclusivas: Crear nuevos partidos con horario, convocar jugadores a Equipo A y Equipo B, registrar nuevos fichajes/invitados y rellenar y publicar el acta final del partido.

---

## 6. Autenticación y Seguridad
- Acceso con **Usuario y Contraseña**.
- Selector de visibilidad con botón de **ojo** (mostrar/ocultar contraseña).
- Sistema de recuperación rápida de contraseña en caso de olvido.
- Persistencia optimizada de sesiones y datos.

---

## 7. Arquitectura Técnica del Proyecto
```
Web-Pachangas/
├── app/
│   ├── admin/page.tsx         # Vista protegida del panel de administración
│   ├── api/pachangas/         # Endpoints Next.js compatibles
│   ├── globals.css            # Estilos globales y paleta dark/gold
│   ├── layout.tsx             # Layout raíz con viewport y fuentes
│   └── page.tsx               # Aplicación principal con cambio de pestañas
├── components/
│   ├── AdminView.tsx          # Gestión de partidos, actas y altas
│   ├── AuthModal.tsx          # Login, Registro y Recuperación con visor de clave
│   ├── LeaderboardView.tsx    # Clasificación general de mánagers
│   ├── MarketView.tsx         # Mercado 24/7 con fotos, precios y %
│   ├── MatchDayView.tsx       # Partido activo y votaciones 1 al 10
│   ├── MyTeamView.tsx         # Gestión de 5 titulares + reserva
│   └── Navbar.tsx             # Navegación superior con logo oficial
├── lib/
│   ├── db.ts                  # Capa de datos, auth, cálculo de puntos y actas
│   ├── scoring.ts             # Motor matemático de puntuación entera
│   ├── seed.ts                # Jugadores y datos base iniciales
│   └── supabase.ts            # Cliente Supabase preparado
├── public/
│   └── logo.png               # Escudo oficial dorado EGOL
├── types/
│   └── index.ts               # Tipos TypeScript centralizados
├── CONTEXTO_APP.md            # Este documento
└── package.json               # Dependencias del proyecto
```

