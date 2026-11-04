# POLÍTICA 28

Plataforma de gestión política, inteligencia electoral y organización territorial
(República Dominicana). Este repositorio arranca con el **formulario de
inscripción**, que recoge los campos de la cédula y del padrón que registra la
Junta Central Electoral, más contacto y consentimientos de la Ley 172-13.

- CRM: barra lateral con los módulos (`lib/navegacion.ts`), centro de mando en `/` con cifras agregadas
  y una ficha por módulo pendiente (`app/(crm)/[modulo]`)
- Formulario: `/inscripcion`, un solo panel (`components/InscripcionForm.tsx`, campos en `lib/inscripcion/campos.ts`)
- Estilo: blanco y azul (`app/globals.css`)
- API: `POST /api/inscripciones` (validación zod; 201 / 409 cédula duplicada / 422 errores por campo)
- Base de datos: `supabase/migrations/0001_inscripciones.sql` (esquema `crm`, RLS por organización)
- Matriz de campos: [`docs/INSCRIPCION-CAMPOS-JCE.md`](docs/INSCRIPCION-CAMPOS-JCE.md)

## Uso

```bash
npm install
npm run dev        # http://localhost:3000 (CRM) y /inscripcion
npm run validate   # typecheck + tests + build
```

Sin las variables de `.env.example`, la API guarda las inscripciones en memoria y
las marca como **demo** (no son persistentes). Con `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` y `POLITICA28_ORGANIZATION_ID`, las guarda en
`crm.inscripciones`. Hay que exponer el esquema `crm` en Supabase → Settings → API.
