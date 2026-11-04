-- POLÍTICA 28 — Migración 0002: módulo de Comunicaciones.
-- Línea comunicacional, plan de medios y red nacional de comunicadores por provincia.

create table if not exists crm.lineas_comunicacionales (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references core.organizations(id) on delete restrict,
  titulo           text not null check (char_length(titulo) between 1 and 120),
  mensaje          text not null check (char_length(mensaje) between 1 and 600),
  publico          text not null check (publico in ('GENERAL','JUVENTUD','MUJERES','ADULTOS_MAYORES','DIASPORA','RURAL','URBANO','ESTRUCTURA_INTERNA')),
  tono             text not null check (tono in ('INSTITUCIONAL','CERCANO','INFORMATIVO','MOVILIZADOR')),
  palabras_clave   text check (char_length(palabras_clave) <= 200),
  vigencia_desde   date,
  vigencia_hasta   date,
  estado           text not null default 'BORRADOR' check (estado in ('BORRADOR','APROBADO','ARCHIVADO')),
  creado_en        timestamptz not null default now(),
  constraint lineas_vigencia check (vigencia_hasta is null or vigencia_desde is null or vigencia_hasta >= vigencia_desde)
);

create table if not exists crm.plan_medios (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references core.organizations(id) on delete restrict,
  accion           text not null check (char_length(accion) between 1 and 140),
  tipo_medio       text not null check (tipo_medio in ('TELEVISION','RADIO','PRENSA','DIGITAL','REDES','EXTERIOR','EVENTO')),
  medio            text not null check (char_length(medio) between 1 and 120),
  alcance          text not null check (alcance in ('NACIONAL','PROVINCIAL')),
  provincia        char(2) check (provincia ~ '^(0[1-9]|[12]\d|3[0-2])$'),
  fecha_inicio     date not null,
  fecha_fin        date,
  linea_id         uuid references crm.lineas_comunicacionales(id) on delete set null,
  responsable      text,
  presupuesto      numeric(14,2) check (presupuesto >= 0),
  estado           text not null default 'PLANIFICADO' check (estado in ('PLANIFICADO','EN_CURSO','EJECUTADO','CANCELADO')),
  creado_en        timestamptz not null default now(),
  constraint medios_provincia check ((alcance = 'PROVINCIAL' and provincia is not null) or (alcance = 'NACIONAL' and provincia is null)),
  constraint medios_fechas check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

create table if not exists crm.comunicadores (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references core.organizations(id) on delete restrict,
  nombre            text not null check (char_length(nombre) between 1 and 120),
  provincia         char(2) not null check (provincia ~ '^(0[1-9]|[12]\d|3[0-2])$'),
  municipio         text,
  rol               text not null check (rol in ('COORDINADOR_PROVINCIAL','VOCERO','PERIODISTA','LOCUTOR','CREADOR_DIGITAL','COMMUNITY_MANAGER','FOTOGRAFO')),
  medio_plataforma  text,
  telefono          text not null,
  email             text,
  redes             text,
  consentimiento    boolean not null check (consentimiento),
  creado_en         timestamptz not null default now()
);

create index if not exists plan_medios_org_fecha_idx on crm.plan_medios (organization_id, fecha_inicio);
create index if not exists comunicadores_org_provincia_idx on crm.comunicadores (organization_id, provincia);

alter table crm.lineas_comunicacionales enable row level security;
alter table crm.plan_medios enable row level security;
alter table crm.comunicadores enable row level security;

create policy lineas_select on crm.lineas_comunicacionales for select to authenticated using (core.es_miembro(organization_id));
create policy medios_select on crm.plan_medios for select to authenticated using (core.es_miembro(organization_id));
create policy comunicadores_select on crm.comunicadores for select to authenticated using (core.es_miembro(organization_id));

create policy lineas_escritura on crm.lineas_comunicacionales for all to authenticated
  using (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']))
  with check (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']));
create policy medios_escritura on crm.plan_medios for all to authenticated
  using (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']))
  with check (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']));
create policy comunicadores_escritura on crm.comunicadores for all to authenticated
  using (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']))
  with check (core.es_miembro(organization_id, array['ADMIN','COORDINADOR_GENERAL','COORDINADOR_OPERATIVO']));

revoke all on crm.lineas_comunicacionales, crm.plan_medios, crm.comunicadores from anon;
grant select, insert, update, delete on crm.lineas_comunicacionales, crm.plan_medios, crm.comunicadores to authenticated;
grant all on crm.lineas_comunicacionales, crm.plan_medios, crm.comunicadores to service_role;
