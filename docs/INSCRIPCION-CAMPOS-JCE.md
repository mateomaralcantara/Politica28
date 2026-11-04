# Formulario de inscripción — campos de la JCE

El formulario `/inscripcion` incluye todos los campos que la Junta Central Electoral
registra para una persona, más los campos propios de POLÍTICA 28. La fuente única
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
| 2 | Cédula | `fecha_expedicion` | JCE · Cédula | No | No puede ser futura; anterior a la expiración |
| 3 | Cédula | `fecha_expiracion` | JCE · Cédula | Sí | No vencida |
| 4 | Cédula | `cedula_anterior` | JCE · Cédula | No | Serie y número del modelo antiguo |
| 5 | Personales | `nombres` | JCE · Cédula | Sí | ≤ 80 |
| 6 | Personales | `primer_apellido` | JCE · Cédula | Sí | ≤ 60 |
| 7 | Personales | `segundo_apellido` | JCE · Cédula | No | ≤ 60 |
| 8 | Personales | `sexo` | JCE · Cédula | Sí | M / F |
| 9 | Personales | `fecha_nacimiento` | JCE · Cédula | Sí | ≥ 18 años |
| 10 | Personales | `lugar_nacimiento` | JCE · Cédula | Sí | |
| 11 | Personales | `nacionalidad` | JCE · Cédula | Sí | Valor inicial «Dominicana» |
| 12 | Personales | `estado_civil` | JCE · Cédula | Sí | Soltero, Casado, Unión libre, Divorciado, Viudo, Separado |
| 13 | Personales | `tipo_sangre` | JCE · Cédula | No | O±, A±, B±, AB±, No sabe |
| 14 | Personales | `ocupacion` | JCE · Cédula | Sí | |
| 15–19 | Acta de nacimiento | `acta_oficialia`, `acta_libro`, `acta_folio`, `acta_numero`, `acta_anio` | JCE · Registro Civil | No | Año entre 1900 y el actual |
| 20–21 | Acta de nacimiento | `nombre_padre`, `nombre_madre` | JCE · Registro Civil | No | |
| 22 | Domicilio | `domicilio_provincia` | JCE · Padrón | Sí | Código ONE 01–32 |
| 23 | Domicilio | `domicilio_municipio` | JCE · Padrón | Sí | |
| 24–26 | Domicilio | `domicilio_distrito_municipal`, `domicilio_seccion`, `domicilio_paraje` | JCE · Padrón | No | |
| 27–28 | Domicilio | `domicilio_sector`, `domicilio_calle` | JCE · Padrón | Sí | |
| 29–32 | Domicilio | `domicilio_numero`, `domicilio_edificio_apto`, `domicilio_referencia`, `domicilio_codigo_postal` | JCE · Padrón | No | Código postal de 5 dígitos |
| 33 | Votación | `vota_en_exterior` | JCE · Padrón | No | Alterna entre datos nacionales y del exterior |
| 34–36 | Votación (exterior) | `exterior_circunscripcion`, `exterior_pais`, `exterior_ciudad` | JCE · Padrón | Si vota fuera: circunscripción y país | E1, E2, E3 |
| 37–40 | Votación (nacional) | `votacion_provincia`, `votacion_municipio`, `votacion_distrito_municipal`, `circunscripcion` | JCE · Padrón | No | |
| 41–43 | Votación | `recinto_codigo`, `recinto_nombre`, `recinto_direccion` | JCE · Padrón | No | Código alfanumérico ≤ 10 |
| 44 | Votación | `colegio_electoral` | JCE · Padrón | No | 4 dígitos + letra opcional (`0045A`) |
| 45 | Votación | `posicion_padron` | JCE · Padrón | No | Número |
| 46–51 | Contacto | `telefono_movil`*, `telefono_residencial`, `whatsapp`, `email`, `nivel_academico`, `canal_preferido` | Contacto (no JCE) | Solo el móvil | 809/829/849 + 7 dígitos o internacional `+` |
| 52–58 | Estructura | `cargo_solicitado`*, `jurisdiccion_nivel`*, `jurisdiccion_provincia`*, `jurisdiccion_municipio`, `jurisdiccion_distrito_municipal`, `referido_por_cedula`, `observaciones` | Organización | Ver * | Municipio/DM obligatorios según el nivel; se queda `PENDIENTE` de aprobación |
| 59–61 | Consentimientos | `consentimiento_tratamiento`*, `consentimiento_comunicaciones`, `declaracion_veracidad`* | Ley 172-13 | Ver * | Se guardan la IP y el user-agent del consentimiento |

## Lo que el formulario NO pide

Afiliación o preferencia política, intención de voto ni ningún dato que permita
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
