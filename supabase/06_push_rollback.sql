do $$
begin
  begin
    perform cron.unschedule('fisiokids-enviar-avisos-dinamicos');
  exception when others then
    null;
  end;
  begin
    perform cron.unschedule('fisiokids-verificar-recibos-push');
  exception when others then
    null;
  end;
end $$;

drop trigger if exists trg_evento_push on public.eventos;

drop function if exists public.fn_webhook_evento_push();
drop function if exists public.fn_cron_enviar_avisos_dinamicos();
drop function if exists public.fn_cron_verificar_recibos_push();
drop function if exists public.fn_avisos_push_pendientes(text, text);
drop function if exists public.fn_registrar_token_push(text, text);
drop function if exists public.fn_desactivar_mis_tokens();
drop function if exists public.fn_desactivar_tokens_antiguos(integer);

drop table if exists public.push_tickets;
drop table if exists public.push_enviados;
drop table if exists public.push_tokens;

select to_regclass('public.push_tokens') as tokens,
       to_regclass('public.push_tickets') as tickets,
       to_regclass('public.push_enviados') as enviados;

select tgname
from pg_trigger
where tgrelid = 'public.eventos'::regclass
  and not tgisinternal;

select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'fn_webhook_evento_push',
    'fn_cron_enviar_avisos_dinamicos',
    'fn_cron_verificar_recibos_push',
    'fn_avisos_push_pendientes',
    'fn_registrar_token_push',
    'fn_desactivar_mis_tokens',
    'fn_desactivar_tokens_antiguos'
  );

do $$
begin
  if to_regclass('cron.job') is not null then
    raise notice 'cron jobs restantes: %',
      (select coalesce(string_agg(jobname, ', '), 'ninguno') from cron.job);
  end if;
end $$;
