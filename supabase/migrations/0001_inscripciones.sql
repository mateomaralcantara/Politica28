-- POLÍTICA 28 — Migración 0001: organizaciones, membresías e inscripciones.
--
-- Las inscripciones son datos AUTODECLARADOS (CRM voluntario). Se guardan en el
-- esquema `crm`, separado de cualquier dato oficial de la JCE (que irá en un
-- esquema protegido propio cuando exista habilitación legal).
--
-- Para que la API REST de Supabase acepte "Content-Profile: crm", añada `crm`
-- a "Exposed schemas" en Settings → API.

create extension if not exists pgcrypto;

create schema if not exists core;
create schema if not exists crm;

create table if not exists core.organizations (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  creado_en   timestamptz not null default now()
);

create table if not exists core.memberships (
  organization_id uuid not null references core.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  rol             text not null check (rol in ('ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO','SUPERVISOR','PROMOTOR','MULTIPLICADOR','AUDITOR')),
  creado_en       timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function core.es_miembro(org uuid, roles text[] default null)
returns boolean language sql stable security definer set search_path = core as $$
  select exists (
    select 1 from core.memberships m
    where m.organization_id = org and m.user_id = auth.uid()
      and (roles is null or m.rol = any(roles))
  );
$$;

create table if not exists crm.inscripciones (
  id                              uuid primary key default gen_random_uuid(),
  organization_id                 uuid not null references core.organizations(id) on delete restrict,
  origen_datos                    text not null default 'AUTODECLARADO' check (origen_datos = 'AUTODECLARADO'),
  estado                          text not null default 'PENDIENTE' check (estado in ('PENDIENTE','VERIFICADA','RECHAZADA','RETIRADA')),

  -- 1. Datos del supervisor
  supervisor_cedula               char(11) not null check (supervisor_cedula ~ '^\d{11}$'),
  supervisor_nombre               text not null check (char_length(supervisor_nombre) between 1 and 160),
  supervisor_telefono             text,

  -- 2. Cédula de Identidad y Electoral (JCE)
  cedula                          char(11) not null check (cedula ~ '^\d{11}$'),
  fecha_expiracion                date not null,

  -- 3. Datos personales (JCE)
  nombres                         text not null check (char_length(nombres) between 1 and 80),
  primer_apellido                 text not null check (char_length(primer_apellido) between 1 and 60),
  segundo_apellido                text check (char_length(segundo_apellido) <= 60),
  sexo                            char(1) not null check (sexo in ('M','F')),
  fecha_nacimiento                date not null,
  lugar_nacimiento                text not null,
  nacionalidad                    text not null,
  estado_civil                    text not null check (estado_civil in ('SOLTERO','CASADO','UNION_LIBRE','DIVORCIADO','VIUDO','SEPARADO')),
  tipo_sangre                     text check (tipo_sangre in ('O+','O-','A+','A-','B+','B-','AB+','AB-','NO_SABE')),
  ocupacion                       text not null,


  -- 4. Domicilio (JCE)
  domicilio_provincia             char(2) not null check (domicilio_provincia ~ '^(0[1-9]|[12]\d|3[0-2])$'),
  domicilio_municipio             text not null,
  domicilio_distrito_municipal    text,
  domicilio_seccion               text,
  domicilio_paraje                text,
  domicilio_sector                text not null,
  domicilio_calle                 text not null,
  domicilio_numero                text,
  domicilio_edificio_apto         text,
  domicilio_referencia            text,
  domicilio_codigo_postal         text check (domicilio_codigo_postal ~ '^\d{5}$'),

  -- 5. Lugar de votación (padrón JCE)
  vota_en_exterior                boolean not null default false,
  exterior_circunscripcion        text check (exterior_circunscripcion in ('E1','E2','E3')),
  exterior_pais                   text,
  exterior_ciudad                 text,
  votacion_provincia              char(2) check (votacion_provincia ~ '^(0[1-9]|[12]\d|3[0-2])$'),
  votacion_municipio              text,
  votacion_distrito_municipal     text,
  circunscripcion                 text,
  recinto_codigo                  text,
  recinto_nombre                  text,
  recinto_direccion               text,
  colegio_electoral               text check (colegio_electoral ~ '^\d{4}[A-Za-z]?$'),
  posicion_padron                 text check (posicion_padron ~ '^\d{1,5}$'),

  -- 6. Contacto (voluntario)
  telefono_movil                  text not null,
  telefono_residencial            text,
  whatsapp                        text,
  email                           text,
  nivel_academico                 text,
  canal_preferido                 text check (canal_preferido in ('WHATSAPP','SMS','LLAMADA','EMAIL')),


  -- 7. Consentimientos (Ley 172-13)
  consentimiento_tratamiento      boolean not null check (consentimiento_tratamiento),
  consentimiento_comunicaciones   boolean not null default false,
  declaracion_veracidad           boolean not null check (declaracion_veracidad),
  consentimiento_ip               inet,
  consentimiento_user_agent       text,

  creado_en                       timestamptz not null default now(),
  actualizado_en                  timestamptz not null default now(),

  constraint inscripciones_cedula_unica unique (organization_id, cedula),
  constraint inscripciones_supervisor_distinto check (supervisor_cedula <> cedula),
  constraint inscripciones_exterior check (
    (vota_en_exterior and exterior_circunscripcion is not null and exterior_pais is not null)
    or (not vota_en_exterior and exterior_circunscripcion is null)
  )
);

create index if not exists inscripciones_org_domicilio_idx
  on crm.inscripciones (organization_id, domicilio_provincia, domicilio_municipio);
create index if not exists inscripciones_org_supervisor_idx
  on crm.inscripciones (organization_id, supervisor_cedula);
create index if not exists inscripciones_org_estado_idx
  on crm.inscripciones (organization_id, estado);

-- Seguridad por fila: cada organización solo ve sus propias inscripciones.
-- La inserción pública se hace desde el servidor con la service role (que omite RLS),
-- después de validar el formulario. No se otorga INSERT a anon.
alter table crm.inscripciones enable row level security;
alter table core.memberships  enable row level security;
alter table core.organizations enable row level security;

create policy inscripciones_select on crm.inscripciones
  for select to authenticated using (core.es_miembro(organization_id));

create policy inscripciones_update on crm.inscripciones
  for update to authenticated
  using (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']))
  with check (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']));

create policy memberships_select on core.memberships
  for select to authenticated using (user_id = auth.uid());

create policy organizations_select on core.organizations
  for select to authenticated using (core.es_miembro(id));

revoke all on crm.inscripciones from anon;
grant usage on schema crm, core to authenticated, service_role;
grant select, update on crm.inscripciones to authenticated;
grant all on crm.inscripciones to service_role;
grant select on core.organizations, core.memberships to authenticated;
