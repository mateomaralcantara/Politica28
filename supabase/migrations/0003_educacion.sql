-- POLÍTICA 28 — Migración 0003: módulo de Educación (escuela de formación).

create table if not exists crm.cursos (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references core.organizations(id) on delete restrict,
  titulo           text not null check (char_length(titulo) between 1 and 140),
  tema             text not null check (tema in ('LIDERAZGO','ORGANIZACION_TERRITORIAL','COMUNICACION','LEGISLACION_ELECTORAL','PROTECCION_DATOS','PLATAFORMA','TRABAJO_COMUNITARIO','OTRO')),
  descripcion      text check (char_length(descripcion) <= 600),
  modalidad        text not null check (modalidad in ('PRESENCIAL','VIRTUAL','HIBRIDA')),
  dirigido_a       text not null check (dirigido_a in ('TODA_LA_ESTRUCTURA','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO','SUPERVISOR','PROMOTOR','MULTIPLICADOR')),
  alcance          text not null check (alcance in ('NACIONAL','PROVINCIAL')),
  provincia        char(2) check (provincia ~ '^(0[1-9]|[12]\d|3[0-2])$'),
  sede             text,
  fecha            date not null,
  hora             time,
  duracion_horas   numeric(5,1) check (duracion_horas between 0.5 and 200),
  cupo             integer not null check (cupo between 1 and 5000),
  facilitador      text,
  estado           text not null default 'PROGRAMADO' check (estado in ('PROGRAMADO','EN_CURSO','FINALIZADO','CANCELADO')),
  creado_en        timestamptz not null default now(),
  constraint cursos_provincia check ((alcance = 'PROVINCIAL' and provincia is not null) or (alcance = 'NACIONAL' and provincia is null)),
  constraint cursos_sede check (modalidad = 'VIRTUAL' or sede is not null)
);

create table if not exists crm.curso_participantes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references core.organizations(id) on delete restrict,
  curso_id         uuid not null references crm.cursos(id) on delete cascade,
  nombre           text not null check (char_length(nombre) between 1 and 120),
  cargo            text not null check (cargo in ('COORDINADOR_GENERAL','COORDINADOR_OPERATIVO','SUPERVISOR','PROMOTOR','MULTIPLICADOR','VOLUNTARIO')),
  provincia        char(2) not null check (provincia ~ '^(0[1-9]|[12]\d|3[0-2])$'),
  telefono         text not null,
  consentimiento   boolean not null check (consentimiento),
  asistio          boolean not null default false,
  creado_en        timestamptz not null default now(),
  constraint participante_unico unique (curso_id, telefono)
);

create index if not exists cursos_org_fecha_idx on crm.cursos (organization_id, fecha);
create index if not exists participantes_curso_idx on crm.curso_participantes (curso_id);

-- El cupo se verifica también en la base de datos para evitar inscripciones simultáneas por encima del límite.
create or replace function crm.verificar_cupo() returns trigger language plpgsql as $$
declare
  limite integer;
  inscritos integer;
begin
  select cupo into limite from crm.cursos where id = new.curso_id for update;
  select count(*) into inscritos from crm.curso_participantes where curso_id = new.curso_id;
  if inscritos >= limite then
    raise exception 'El cupo del curso está completo' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists curso_participantes_cupo on crm.curso_participantes;
create trigger curso_participantes_cupo before insert on crm.curso_participantes
  for each row execute function crm.verificar_cupo();

alter table crm.cursos enable row level security;
alter table crm.curso_participantes enable row level security;

create policy cursos_select on crm.cursos for select to authenticated using (core.es_miembro(organization_id));
create policy participantes_select on crm.curso_participantes for select to authenticated using (core.es_miembro(organization_id));
create policy cursos_escritura on crm.cursos for all to authenticated
  using (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']))
  with check (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']));
create policy participantes_escritura on crm.curso_participantes for all to authenticated
  using (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO','SUPERVISOR']))
  with check (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO','SUPERVISOR']));

revoke all on crm.cursos, crm.curso_participantes from anon;
grant select, insert, update, delete on crm.cursos, crm.curso_participantes to authenticated;
grant all on crm.cursos, crm.curso_participantes to service_role;
