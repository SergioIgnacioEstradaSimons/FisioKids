# FisioKids

**Gestión operativa y control de atención para un centro de fisioterapia infantil.**

Aplicación móvil hecha con React Native y Expo para el personal de un centro de fisioterapia infantil de Tarija. Reemplaza los horarios y las anotaciones en archivos sueltos por una sola app: programación de niños, profesionales, salas y turnos, asistencia por bloques y registro de la atención de cada niño.

Proyecto final de **Aplicaciones Móviles I** · Universidad Privada Domingo Savio, Sede Tarija · Grupo 12.

## ¿Qué problema resuelve?

En los centros de fisioterapia infantil, los horarios, la asignación de profesionales y salas, el control de asistencia y el registro de actividades suelen llevarse en anotaciones separadas. Eso dificulta consultar la información a tiempo, provoca errores de programación y complica el historial de cada niño. FisioKids centraliza todo desde el celular del personal.

**Usuarios:** administrador del centro y profesionales de fisioterapia.

## Funcionalidades

**Administrador**
- Niños: crear, ver, editar, dar de baja y eliminar, sin duplicados (nombres, apellidos y fecha de nacimiento).
- Profesionales y salas: crear, editar y dar de baja.
- Calendario por turnos (mañana 8:00–12:00 y tarde 14:00–19:00) con asignación de varios niños por bloque (máximo 4) y control de conflictos de sala, profesional y cupo.
- Resumen del día con las sesiones ya dadas y el detalle de cada una.
- Gestión mensual: resumen de periodos anteriores, configuración y revisión.
- Suspensiones: los feriados de Bolivia se consultan a una API y se guardan en el celular; también se pueden agregar suspensiones manuales con un calendario.
- Historial de sesiones del centro.

**Profesional**
- Resumen de su jornada y agenda diaria.
- Asistencia por bloques en orden: no se puede dar asistencia de un horario si el anterior sigue abierto.
- Registro de atención por niño (actividades y observaciones).
- Cierre de bloque con confirmación; un bloque cerrado solo lo reabre el administrador.
- Historial de atención de cada niño e historial mensual de sus sesiones.

**Ambos roles**
- Ingreso con contraseña cifrada (SHA-256), perfil editable y cambio de contraseña.

## Tecnologías

- React Native 0.88 con Expo SDK 58 (JavaScript)
- React Navigation: Stack, Bottom Tabs y Drawer
- SQLite local con `expo-sqlite`
- API pública [Nager.Date](https://date.nager.at) (feriados), consumida con `fetch`
- `expo-crypto`, `expo-linear-gradient`, `react-native-svg`, `@expo/vector-icons`
- Fuente Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`)

## Cómo funciona con la API y la base de datos

- **Base de datos (SQLite):** guarda usuarios, niños, salas, bloques, asignaciones, asistencias, cierres de bloque y suspensiones. Todas las sentencias SQL están en `datos.js`, siempre con parámetros `?`. La base se crea sola la primera vez, con datos de ejemplo.
- **API de feriados:** `GET https://date.nager.at/api/v3/PublicHolidays/{año}/BO`. Muestra tres estados: cargando, error con botón *Reintentar* y datos.
- **Integración:** la API trae el catálogo de feriados y el administrador elige cuáles suspenden la atención; esos días se guardan en SQLite. Un día suspendido no tiene sesiones ni permite tomar asistencia.
- **Sin internet:** solo la consulta de feriados necesita conexión. El resto de la app funciona sin conexión.

## Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@fisiokids.bo` | `admin123` |
| Profesional | `carmen@fisiokids.bo` | `prof123` |
| Profesional | `pablo@fisiokids.bo` | `prof123` |

Son datos de ejemplo. Las contraseñas se guardan cifradas en la base.

## Instalación y ejecución

Requisitos: Node.js, y la app **Expo Go** en el celular (o un emulador Android).

```bash
npm install
npx expo install expo-linear-gradient expo-font react-native-svg @expo/vector-icons @expo-google-fonts/plus-jakarta-sans expo-sqlite expo-crypto
npx expo start
```

Escanea el código QR con Expo Go. Funciones en datos requerimiento de internet

## Estructura del proyecto

```
FISIOKIDS/
├── App.js            ← navegación (Stack + Tabs + Drawer) y SQLiteProvider
├── datos.js          ← esquema y TODAS las sentencias SQL
├── api.js            ← llamadas fetch a la API de feriados
├── semilla.js        ← datos de ejemplo que se cargan una sola vez
├── utiles.js         ← fechas, turnos y funciones de apoyo
├── hooks.js          ← useConsulta: lee de SQLite al mostrar cada pantalla
├── sesion.js         ← usuario que inició sesión
├── tema.js           ← colores y estilos comunes
├── components/       ← tarjetas, formularios, calendario, menú lateral…
└── screens/          ← pantallas de la app
```

## Descargar la APK

[Descargar FisioKids 1.0.0 (APK)](https://github.com/SergioIgnacioEstradaSimons/FisioKids/releases/download/v1.0.0/FisioKids-1.0.0.apk)

- **Versión:** 1.0.0
- **Tamaño:** 103 MB
- **SHA-256:** `d9211c04b866d17e23ffa6a170565adb52baf35b8247ce73f40a5990975ab4d7`

Para verificar la descarga:
- Windows: `certutil -hashfile app.apk SHA256`
- Linux/Mac: `sha256sum app.apk`

## Video demo

[Ver el video de demostración](ENLACE_DE_YOUTUBE)

## Autor

- Sergio Ignacio Estrada Simóns · [Repositorio en GitHub](https://github.com/SergioIgnacioEstradaSimons/FisioKids)

Docente: Ing. Juan Huanto Villca · Aplicaciones Móviles I · Tarija, 2026.
