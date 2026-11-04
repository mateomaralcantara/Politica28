# Formulario de inscripción — campos de la JCE

El formulario `/inscripcion` incluye los campos de la cédula y del padrón que la
Junta Central Electoral registra para una persona, más contacto y consentimientos. La fuente única
es [`lib/inscripcion/campos.ts`](../lib/inscripcion/campos.ts): la interfaz se dibuja a
partir de ella, el esquema de validación se genera desde ella, y
`tests/inscripcion.test.ts` comprueba que cada campo tiene su columna en
`supabase/migrations/0001_inscripciones.sql`.

Todos los datos son **autodeclarados** por la persona (`origen_datos = 'AUTODECLARADO'`).
No se consulta ni se copia el padrón oficial, y se guardan en el esquema `crm`,
separados de las fuentes oficiales.

## Matriz de campos

| # | Sección | Campo (columna) | Origen | Obligatorio | Validación |
|---|---|---|---|---|---|
| 1 | Cédula | `cedula` | JCE · Cédula | Sí | 11 dígitos + dígito verificador (Luhn); se guarda sin guiones; única por organización |
| 2 | Cédula | `fecha_expiracion` | JCE · Cédula | Sí | No vencida |
| 3 | Personales | `nombres` | JCE · Cédula | Sí | ≤ 80 |
| 4 | Personales | `primer_apellido` | JCE · Cédula | Sí | ≤ 60 |
| 5 | Personales | `segundo_apellido` | JCE · Cédula | No | ≤ 60 |
| 6 | Personales | `sexo` | JCE · Cédula | Sí | M / F |
| 7 | Personales | `fecha_nacimiento` | JCE · Cédula | Sí | ≥ 18 años |
| 8 | Personales | `lugar_nacimiento` | JCE · Cédula | Sí | |
| 9 | Personales | `nacionalidad` | JCE · Cédula | Sí | Valor inicial «Dominicana» |
| 10 | Personales | `estado_civil` | JCE · Cédula | Sí | Soltero, Casado, Unión libre, Divorciado, Viudo, Separado |
| 11 | Personales | `tipo_sangre` | JCE · Cédula | No | O±, A±, B±, AB±, No sabe |
| 12 | Personales | `ocupacion` | JCE · Cédula | Sí | |
| 13 | Domicilio | `domicilio_provincia` | JCE · Padrón | Sí | Código ONE 01–32 |
| 14 | Domicilio | `domicilio_municipio` | JCE · Padrón | Sí | |
| 15–17 | Domicilio | `domicilio_distrito_municipal`, `domicilio_seccion`, `domicilio_paraje` | JCE · Padrón | No | |
| 18–19 | Domicilio | `domicilio_sector`, `domicilio_calle` | JCE · Padrón | Sí | |
| 20–23 | Domicilio | `domicilio_numero`, `domicilio_edificio_apto`, `domicilio_referencia`, `domicilio_codigo_postal` | JCE · Padrón | No | Código postal de 5 dígitos |
| 24 | Votación | `vota_en_exterior` | JCE · Padrón | No | Alterna entre datos nacionales y del exterior |
| 25–27 | Votación (exterior) | `exterior_circunscripcion`, `exterior_pais`, `exterior_ciudad` | JCE · Padrón | Si vota fuera: circunscripción y país | E1, E2, E3 |
| 28–31 | Votación (nacional) | `votacion_provincia`, `votacion_municipio`, `votacion_distrito_municipal`, `circunscripcion` | JCE · Padrón | No | |
| 32–34 | Votación | `recinto_codigo`, `recinto_nombre`, `recinto_direccion` | JCE · Padrón | No | Código alfanumérico ≤ 10 |
| 35 | Votación | `colegio_electoral` | JCE · Padrón | No | 4 dígitos + letra opcional (`0045A`) |
| 36 | Votación | `posicion_padron` | JCE · Padrón | No | Número |
| 37–42 | Contacto | `telefono_movil`*, `telefono_residencial`, `whatsapp`, `email`, `nivel_academico`, `canal_preferido` | Contacto (no JCE) | Solo el móvil | 809/829/849 + 7 dígitos o internacional `+` |
| 43–45 | Consentimientos | `consentimiento_tratamiento`*, `consentimiento_comunicaciones`, `declaracion_veracidad`* | Ley 172-13 | Ver * | Se guardan la IP y el user-agent del consentimiento |

## Lo que el formulario NO pide

Fecha de expedición y cédula anterior, datos del acta de nacimiento (oficialía,
libro, folio, número, año, padre y madre) ni cargo o demarcación en la estructura
organizativa: se retiraron a petición del cliente. Tampoco pide afiliación o preferencia política, intención de voto ni ningún dato que permita
perfilar a la persona. El esquema es `strict`: la API rechaza cualquier campo que
no esté en el catálogo.

## Dependencias pendientes

- **D-01 — Catálogo territorial oficial.** El municipio, el distrito municipal, la
  sección y el paraje son texto libre hasta importar el catálogo ONE/IGN (158
  municipios y 235 distritos municipales). No se han escrito a mano para no
  inventar demarcaciones.
- **D-02 — Verificación contra la JCE.** Los datos no se contrastan con el padrón.
  Solo se hará con un archivo o una API oficial y una autorización legal
  documentada (JCE Data Gateway).
- **D-03 — Excepciones del dígito verificador.** Algunas cédulas antiguas emitidas
  por la JCE no cumplen el algoritmo de Luhn. Hoy se rechazan. Si aparecen casos
  reales, añadir una lista de excepciones revisada manualmente.
