# FisioKids

**Gestión operativa y control de atención para un centro de fisioterapia infantil.**

Aplicación móvil hecha con React Native y Expo para el personal de un centro de fisioterapia infantil de Tarija. Reemplaza los horarios y las anotaciones en archivos sueltos por una sola app: programación de niños, profesionales, salas y turnos, asistencia por bloques y registro de la atención de cada niño.

Proyecto final de **Aplicaciones Móviles I** · Universidad Privada Domingo Savio, Sede Tarija · Grupo 12.

## ¿Qué problema resuelve?

En los centros de fisioterapia infantil, los horarios, la asignación de profesionales y salas, el control de asistencia y el registro de actividades suelen llevarse en anotaciones separadas. FisioKids centraliza todo desde el celular del personal.

**Usuarios:** administrador del centro y profesionales de fisioterapia.

## Funcionalidades

**Administrador**

- Niños: crear, ver, editar, dar de baja y eliminar, sin duplicados.
- Profesionales y salas: crear, editar y dar de baja.
- Calendario por turnos (mañana 8:00–12:00 y tarde 14:00–19:00) con asignación de varios niños por bloque y control de conflictos de sala, profesional y cupo.
- Edición de bloques existentes y aviso al profesional afectado.
- Resumen del día, gestión mensual e historial de sesiones del centro.
- Suspensiones: feriados de Bolivia consultados desde una API y suspensiones manuales.
- Notificaciones: bloques pasados de horario sin asistencia, bloques sin cerrar, suspensiones dentro de los próximos 5 días y cambios de perfil/contraseña de profesionales.

**Profesional**

- Resumen de su jornada y agenda diaria.
- Asistencia por bloques en orden y registro de atención por niño.
- Cierre de bloque con confirmación; un bloque cerrado solo lo reabre el administrador.
- Historial de atención de cada niño e historial mensual de sus sesiones.
- Notificaciones: bloques pasados de horario sin asistencia, nuevas asignaciones, edición de sus bloques y suspensiones dentro de los próximos 5 días.

**Ambos roles**

- Ingreso con Supabase Auth, perfil editable y cambio de contraseña.

## Tecnologías

- React Native con Expo SDK 58 (JavaScript)
- React Navigation: Stack, Bottom Tabs y Drawer
- Supabase: Auth, PostgreSQL, RLS, vistas y funciones RPC
- API pública [Nager.Date](https://date.nager.at) para feriados de Bolivia
- `expo-linear-gradient`, `react-native-svg`, `@expo/vector-icons` y Plus Jakarta Sans

## Configuración de Supabase

1. Copia `env.example` como `.env.local`.
2. Completa:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La clave publishable es pública y puede estar en la app. La clave secreta (`sb_secret_...`) nunca se sube al repositorio; solo se usa localmente en el script de importación.

En Supabase > SQL Editor ejecuta, en este orden:

1. `supabase/01_esquema.sql` — esquema, RLS y funciones base.
2. `supabase/02_datos_iniciales.sql` — datos semilla.
3. `supabase/03_seguridad.sql` — GRANT explícitos y reparación de `auth_id`.
4. `supabase/04_vistas_rpc.sql` — vistas y funciones que consume `datos.js`.
5. `supabase/05_eventos.sql` — tabla `eventos` para avisos persistentes.

Después crea los usuarios en Authentication y verifica con la guía completa en `supabase/GUIA.md`.

## Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@fisiokids.bo` | `admin123` |
| Profesional | `carmen@fisiokids.bo` | `prof123` |
| Profesional | `pablo@fisiokids.bo` | `prof123` |
| Profesional | `laura@fisiokids.bo` | `prof123` |
| Profesional inactivo | `jose@fisiokids.bo` | `prof123` |

## Instalación y ejecución

Requisitos: Node.js y Expo Go en el celular o un emulador Android.

```bash
npm install
cp env.example .env.local
npx expo start
```

Si cambias `.env.local`, reinicia con `npx expo start -c`.

Verificación:

```bash
npx expo lint
npx expo export --platform android
```

## Importar datos reales

La pantalla temporal **Exportar datos** genera un JSON con las tablas anteriores de SQLite. Desde la PC:

```bash
node scripts/importar-sqlite.js ruta/al/export.json
```

El script necesita `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en `.env.local`. Hace upsert por `id`, vincula usuarios por correo y reajusta secuencias. La documentación detallada está en `supabase/GUIA.md`.

## Estructura del proyecto

```text
FISIOKIDS/
├── App.js              ← navegación y rutas
├── supabase.js         ← cliente de Supabase
├── datos.js            ← acceso a datos, vistas, RPC y avisos
├── hooks.js            ← hooks de consulta y notificaciones
├── sesion.js           ← sesión y permisos por rol
├── utiles.js           ← fechas, turnos y formato de avisos
├── api.js              ← feriados desde Nager.Date
├── env.example         ← plantilla de variables de entorno
├── supabase/           ← SQL de esquema, datos, seguridad y guía
├── scripts/            ← importación de datos reales
├── components/         ← componentes compartidos
└── screens/            ← pantallas de la app
```

## Autor

Sergio Ignacio Estrada Simóns · [Repositorio en GitHub](https://github.com/SergioIgnacioEstradaSimons/FisioKids)

Docente: Ing. Juan Huanto Villca · Aplicaciones Móviles I · Tarija, 2026.
