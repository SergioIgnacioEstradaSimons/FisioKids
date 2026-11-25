-- =====================================================================================
-- FisioKids · Supabase · PASO 3: permisos explícitos y reparación del vínculo Auth <-> usuarios
-- Ejecútalo DESPUÉS de 01_esquema.sql y 02_datos_iniciales.sql, en Supabase > SQL Editor.
-- Supabase está haciendo opt-in los GRANT de la Data API: sin ellos las consultas fallan
-- con "permission denied for table ..." (42501) aunque las políticas RLS estén correctas.
-- RLS sigue aplicando: estos grants solo permiten llegar a las políticas.
-- =====================================================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.usuarios, public.ninos, public.salas, public.bloques, public.asignaciones,
  public.asistencias, public.cierres_bloque, public.tipos_discapacidad,
  public.avisos_leidos, public.suspensiones
to authenticated;

-- Las columnas "identity" necesitan USAGE sobre sus secuencias para insertar con id automático
do $$
declare s record;
begin
  for s in select sequence_name from information_schema.sequences where sequence_schema = 'public' loop
    execute format('grant usage on sequence public.%I to authenticated', s.sequence_name);
  end loop;
end $$;

-- Si los usuarios de Authentication se crearon ANTES de 02_datos_iniciales.sql, el trigger
-- al_crear_auth_user no encontró la fila con el mismo correo. Esto lo repara sin duplicar nada.
update public.usuarios u
set auth_id = a.id
from auth.users a
where u.auth_id is null and lower(u.correo) = lower(a.email);

-- Para pruebas: dar por confirmados los correos de la semilla así signInWithPassword funciona
-- aunque "Confirm email" siga activado. En producción usa el flujo de confirmación del dashboard.
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) in (
  'admin@fisiokids.bo', 'carmen@fisiokids.bo', 'pablo@fisiokids.bo',
  'laura@fisiokids.bo', 'jose@fisiokids.bo'
);
