# FisioKids · Guía de puesta en marcha con Supabase

## 1. Credenciales (ya configuradas en `.env.local`)

- `EXPO_PUBLIC_SUPABASE_URL`: Dashboard > Project Settings > General (o el diálogo **Connect**).
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Dashboard > Settings > API Keys. Es pública: puede estar en la app.
- La clave secreta (`sb_secret_…`) **nunca** se pone en la app ni en el repositorio; solo se usa en el script local de importación.
- Después de cambiar `.env.local`: `npx expo start -c`.

## 2. SQL (Supabase > SQL Editor > New query > Run), en este orden

1. `supabase/01_esquema.sql` — tablas, RLS, funciones `mi_id`/`es_admin` y trigger de vínculo.
2. `supabase/02_datos_iniciales.sql` — datos semilla (5 usuarios, niños, bloques, historial de 10 semanas).
3. `supabase/03_seguridad.sql` — GRANT explícitos a `authenticated` y reparación del vínculo `auth_id`.
4. `supabase/04_vistas_rpc.sql` — vistas y funciones que usa `datos.js`.
5. `supabase/05_eventos.sql` — tabla `eventos` para avisos persistentes de perfil, contraseña y asignaciones.

Si algún paso falla, detente y corrígelo antes de seguir. Al terminar deben existir 11 tablas (las 10 originales más `eventos`), 10 vistas `v_*` y las funciones `fn_*`.

## 3. Usuarios de Authentication

Crear en **Authentication > Users > Add user** (confirmación de correo desactivada, o confirmar los usuarios después):

| Correo | Contraseña | Rol (tabla `usuarios`) |
| --- | --- | --- |
| `admin@fisiokids.bo` | `admin123` | admin |
| `carmen@fisiokids.bo` | `prof123` | profesional |
| `pablo@fisiokids.bo` | `prof123` | profesional |
| `laura@fisiokids.bo` | `prof123` | profesional |
| `jose@fisiokids.bo` | `prof123` | profesional (inactivo) |

El orden recomendado es: ejecutar el SQL primero y crear los usuarios después, para que el trigger `al_crear_auth_user` asigne `auth_id` automáticamente. Si los usuarios ya existían, `03_seguridad.sql` repara el vínculo por correo.

Verificación:

```sql
select u.id, u.correo, u.rol, u.auth_id
from public.usuarios u order by u.id;
```

`auth_id` debe estar lleno en los 5. Si algún profesional nuevo se crea desde la app, se registra con `clienteTemporal.auth.signUp` y el admin inserta su fila con el `auth_id` devuelto.

## 4. Datos reales del celular

Antes de desmontar SQLite, usar la pantalla temporal **Exportar datos** de la app para compartir un JSON con las 10 tablas. Desde la PC:

```bash
npm install
node scripts/importar-sqlite.js ruta/al/export.json
```

El script lee `SUPABASE_URL` y `SUPABASE_SECRET_KEY` desde `.env.local` (clave secreta, solo local). Hace upsert por `id`, vincula usuarios por correo y reajusta las secuencias. Las contraseñas SHA-256 de SQLite no se migran: los correos que no estén en la tabla anterior se crean en Authentication con contraseña temporal y se les pide restablecerla.

## 5. Verificación en la app

- Iniciar sesión como admin y como profesional.
- El profesional no debe poder crear niños/salas ni ver el módulo de profesionales (RLS).
- Tomar asistencia, cerrar un bloque y revisar resúmenes/notificaciones.
- Cambiar la propia contraseña desde Mi perfil.
- Como profesional: editar perfil y contraseña deben avisar al admin. Como admin: crear o editar un bloque debe avisar al profesional afectado.
- Las suspensiones avisan dentro de los próximos 5 días; un bloque pasado de horario sin asistencias avisa como "sin asistencia".
