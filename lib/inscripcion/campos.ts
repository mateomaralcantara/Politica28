import { PROVINCIAS } from "@/lib/territorio/provincias";

/**
 * Catálogo de campos del formulario de inscripción.
 *
 * Incluye TODOS los campos que la Junta Central Electoral (JCE) registra para
 * una persona en la Cédula de Identidad y Electoral, el Registro Civil (acta de
 * nacimiento) y el Padrón Electoral (domicilio y lugar de votación), más los
 * campos propios de POLÍTICA 28 (contacto, estructura organizativa y
 * consentimientos).
 *
 * Origen de cada campo:
 *  - "JCE_CEDULA"    → impreso o registrado en la cédula de identidad y electoral.
 *  - "JCE_REGISTRO_CIVIL" → datos del acta de nacimiento (Registro Civil, JCE).
 *  - "JCE_PADRON"    → domicilio electoral y lugar de votación en el padrón.
 *  - "CONTACTO"      → datos de contacto voluntarios (CRM, no provienen de la JCE).
 *  - "ORGANIZACION"  → postulación a la estructura territorial de POLÍTICA 28.
 *  - "CONSENTIMIENTO"→ autorizaciones exigidas por la Ley 172-13.
 *
 * Todos los datos de este formulario son AUTODECLARADOS por la persona que se
 * inscribe; no se consultan ni se copian del padrón oficial. Se almacenan
 * separados de cualquier fuente oficial (ver supabase/migrations).
 *
 * Este archivo es la fuente única: el formulario se dibuja a partir de él y
 * tests/campos.test.ts verifica que coincide con el esquema de validación y con
 * las columnas de la base de datos.
 */

export type OrigenCampo =
  | "JCE_CEDULA"
  | "JCE_REGISTRO_CIVIL"
  | "JCE_PADRON"
  | "CONTACTO"
  | "ORGANIZACION"
  | "CONSENTIMIENTO";

export type TipoCampo = "text" | "date" | "select" | "email" | "tel" | "checkbox" | "textarea" | "cedula";

export type Opcion = { valor: string; etiqueta: string };

export type Campo = {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  origen: OrigenCampo;
  requerido: boolean;
  opciones?: readonly Opcion[];
  ayuda?: string;
  placeholder?: string;
  maxLength?: number;
  /** Solo se muestra cuando otro campo tiene un valor concreto. */
  visibleSi?: { clave: string; valor: string | boolean };
  /** Ocupa el ancho completo de la fila. */
  ancho?: "completo";
};

export type Seccion = { id: string; titulo: string; descripcion: string; campos: readonly Campo[] };

const op = (...valores: Array<[string, string]>): Opcion[] => valores.map(([valor, etiqueta]) => ({ valor, etiqueta }));

export const OPCIONES = {
  sexo: op(["M", "Masculino"], ["F", "Femenino"]),
  estadoCivil: op(
    ["SOLTERO", "Soltero(a)"],
    ["CASADO", "Casado(a)"],
    ["UNION_LIBRE", "Unión libre"],
    ["DIVORCIADO", "Divorciado(a)"],
    ["VIUDO", "Viudo(a)"],
    ["SEPARADO", "Separado(a)"],
  ),
  tipoSangre: op(
    ["O+", "O+"], ["O-", "O-"], ["A+", "A+"], ["A-", "A-"],
    ["B+", "B+"], ["B-", "B-"], ["AB+", "AB+"], ["AB-", "AB-"], ["NO_SABE", "No sabe"],
  ),
  provincia: PROVINCIAS.map((p) => ({ valor: p.codigo, etiqueta: p.nombre })),
  circunscripcionExterior: op(
    ["E1", "Circunscripción exterior 1 (EE. UU. y Canadá)"],
    ["E2", "Circunscripción exterior 2 (Europa)"],
    ["E3", "Circunscripción exterior 3 (América Latina y el Caribe)"],
  ),
  nivelAcademico: op(
    ["NINGUNO", "Ninguno"], ["BASICO", "Básico / Primario"], ["MEDIO", "Medio / Secundario"],
    ["TECNICO", "Técnico"], ["UNIVERSITARIO", "Universitario"], ["POSTGRADO", "Postgrado"],
  ),
  cargo: op(
    ["COORDINADOR_GENERAL", "Coordinador General"],
    ["COORDINADOR_OPERATIVO", "Coordinador Operativo"],
    ["SUPERVISOR", "Supervisor"],
    ["PROMOTOR", "Promotor"],
    ["MULTIPLICADOR", "Multiplicador"],
  ),
  nivelJurisdiccion: op(
    ["PROVINCIA", "Provincia / Distrito Nacional"],
    ["MUNICIPIO", "Municipio"],
    ["DISTRITO_MUNICIPAL", "Distrito municipal"],
  ),
  canalPreferido: op(["WHATSAPP", "WhatsApp"], ["SMS", "SMS"], ["LLAMADA", "Llamada"], ["EMAIL", "Correo electrónico"]),
} as const;

export const SECCIONES: readonly Seccion[] = [
  {
    id: "cedula",
    titulo: "1. Cédula de Identidad y Electoral",
    descripcion: "Datos tal como aparecen en su cédula vigente emitida por la JCE.",
    campos: [
      { clave: "cedula", etiqueta: "Número de cédula", tipo: "cedula", origen: "JCE_CEDULA", requerido: true, placeholder: "000-0000000-0", ayuda: "11 dígitos; se valida el dígito verificador." },
      { clave: "fecha_expedicion", etiqueta: "Fecha de expedición", tipo: "date", origen: "JCE_CEDULA", requerido: false },
      { clave: "fecha_expiracion", etiqueta: "Fecha de expiración", tipo: "date", origen: "JCE_CEDULA", requerido: true },
      { clave: "cedula_anterior", etiqueta: "Cédula anterior (serie y número)", tipo: "text", origen: "JCE_CEDULA", requerido: false, maxLength: 30, ayuda: "Solo si tuvo la cédula del modelo antiguo." },
    ],
  },
  {
    id: "personales",
    titulo: "2. Datos personales",
    descripcion: "Datos de identidad registrados por la JCE.",
    campos: [
      { clave: "nombres", etiqueta: "Nombre(s)", tipo: "text", origen: "JCE_CEDULA", requerido: true, maxLength: 80 },
      { clave: "primer_apellido", etiqueta: "Primer apellido", tipo: "text", origen: "JCE_CEDULA", requerido: true, maxLength: 60 },
      { clave: "segundo_apellido", etiqueta: "Segundo apellido", tipo: "text", origen: "JCE_CEDULA", requerido: false, maxLength: 60 },
      { clave: "sexo", etiqueta: "Sexo", tipo: "select", origen: "JCE_CEDULA", requerido: true, opciones: OPCIONES.sexo },
      { clave: "fecha_nacimiento", etiqueta: "Fecha de nacimiento", tipo: "date", origen: "JCE_CEDULA", requerido: true, ayuda: "Debe ser mayor de 18 años." },
      { clave: "lugar_nacimiento", etiqueta: "Lugar de nacimiento", tipo: "text", origen: "JCE_CEDULA", requerido: true, maxLength: 120, placeholder: "Municipio, provincia (o ciudad y país)" },
      { clave: "nacionalidad", etiqueta: "Nacionalidad", tipo: "text", origen: "JCE_CEDULA", requerido: true, maxLength: 60, placeholder: "Dominicana" },
      { clave: "estado_civil", etiqueta: "Estado civil", tipo: "select", origen: "JCE_CEDULA", requerido: true, opciones: OPCIONES.estadoCivil },
      { clave: "tipo_sangre", etiqueta: "Tipo de sangre", tipo: "select", origen: "JCE_CEDULA", requerido: false, opciones: OPCIONES.tipoSangre },
      { clave: "ocupacion", etiqueta: "Ocupación", tipo: "text", origen: "JCE_CEDULA", requerido: true, maxLength: 80 },
    ],
  },
  {
    id: "registro_civil",
    titulo: "3. Acta de nacimiento (Registro Civil)",
    descripcion: "Opcional. Datos de inscripción del nacimiento en la Oficialía del Estado Civil.",
    campos: [
      { clave: "acta_oficialia", etiqueta: "Oficialía del Estado Civil", tipo: "text", origen: "JCE_REGISTRO_CIVIL", requerido: false, maxLength: 120, placeholder: "Ej.: 1ra. Circunscripción de Santiago" },
      { clave: "acta_libro", etiqueta: "Libro", tipo: "text", origen: "JCE_REGISTRO_CIVIL", requerido: false, maxLength: 15 },
      { clave: "acta_folio", etiqueta: "Folio", tipo: "text", origen: "JCE_REGISTRO_CIVIL", requerido: false, maxLength: 15 },
      { clave: "acta_numero", etiqueta: "Número de acta", tipo: "text", origen: "JCE_REGISTRO_CIVIL", requerido: false, maxLength: 15 },
      { clave: "acta_anio", etiqueta: "Año de la declaración", tipo: "text", origen: "JCE_REGISTRO_CIVIL", requerido: false, maxLength: 4, placeholder: "AAAA" },
      { clave: "nombre_padre", etiqueta: "Nombre del padre", tipo: "text", origen: "JCE_REGISTRO_CIVIL", requerido: false, maxLength: 120 },
      { clave: "nombre_madre", etiqueta: "Nombre de la madre", tipo: "text", origen: "JCE_REGISTRO_CIVIL", requerido: false, maxLength: 120 },
    ],
  },
  {
    id: "domicilio",
    titulo: "4. Domicilio",
    descripcion: "Dirección registrada en la JCE (reverso de la cédula).",
    campos: [
      { clave: "domicilio_provincia", etiqueta: "Provincia", tipo: "select", origen: "JCE_PADRON", requerido: true, opciones: OPCIONES.provincia },
      { clave: "domicilio_municipio", etiqueta: "Municipio", tipo: "text", origen: "JCE_PADRON", requerido: true, maxLength: 80 },
      { clave: "domicilio_distrito_municipal", etiqueta: "Distrito municipal", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 80, ayuda: "Si aplica." },
      { clave: "domicilio_seccion", etiqueta: "Sección", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 80 },
      { clave: "domicilio_paraje", etiqueta: "Paraje", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 80 },
      { clave: "domicilio_sector", etiqueta: "Sector / Barrio", tipo: "text", origen: "JCE_PADRON", requerido: true, maxLength: 80 },
      { clave: "domicilio_calle", etiqueta: "Calle", tipo: "text", origen: "JCE_PADRON", requerido: true, maxLength: 120 },
      { clave: "domicilio_numero", etiqueta: "Número", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 15 },
      { clave: "domicilio_edificio_apto", etiqueta: "Edificio / Apartamento", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 60 },
      { clave: "domicilio_referencia", etiqueta: "Referencia", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 200, ancho: "completo" },
      { clave: "domicilio_codigo_postal", etiqueta: "Código postal", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 5 },
    ],
  },
  {
    id: "electoral",
    titulo: "5. Lugar de votación",
    descripcion: "Datos del padrón electoral: consúltelos en la cédula o en el servicio oficial de la JCE.",
    campos: [
      { clave: "vota_en_exterior", etiqueta: "Vota en el exterior", tipo: "checkbox", origen: "JCE_PADRON", requerido: false },
      { clave: "exterior_circunscripcion", etiqueta: "Circunscripción del exterior", tipo: "select", origen: "JCE_PADRON", requerido: false, opciones: OPCIONES.circunscripcionExterior, visibleSi: { clave: "vota_en_exterior", valor: true } },
      { clave: "exterior_pais", etiqueta: "País", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 60, visibleSi: { clave: "vota_en_exterior", valor: true } },
      { clave: "exterior_ciudad", etiqueta: "Ciudad", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 60, visibleSi: { clave: "vota_en_exterior", valor: true } },
      { clave: "votacion_provincia", etiqueta: "Provincia de votación", tipo: "select", origen: "JCE_PADRON", requerido: false, opciones: OPCIONES.provincia, visibleSi: { clave: "vota_en_exterior", valor: false } },
      { clave: "votacion_municipio", etiqueta: "Municipio de votación", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 80, visibleSi: { clave: "vota_en_exterior", valor: false } },
      { clave: "votacion_distrito_municipal", etiqueta: "Distrito municipal de votación", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 80, visibleSi: { clave: "vota_en_exterior", valor: false } },
      { clave: "circunscripcion", etiqueta: "Circunscripción electoral", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 10, placeholder: "Ej.: 1", visibleSi: { clave: "vota_en_exterior", valor: false } },
      { clave: "recinto_codigo", etiqueta: "Código del recinto", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 10, placeholder: "Ej.: 00123" },
      { clave: "recinto_nombre", etiqueta: "Nombre del recinto", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 160, placeholder: "Ej.: Escuela Básica …" },
      { clave: "recinto_direccion", etiqueta: "Dirección del recinto", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 200, ancho: "completo" },
      { clave: "colegio_electoral", etiqueta: "Colegio electoral", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 6, placeholder: "Ej.: 0045A", ayuda: "4 dígitos y, si existe, una letra." },
      { clave: "posicion_padron", etiqueta: "Posición en el padrón del colegio", tipo: "text", origen: "JCE_PADRON", requerido: false, maxLength: 5, placeholder: "Ej.: 245" },
    ],
  },
  {
    id: "contacto",
    titulo: "6. Contacto",
    descripcion: "Datos voluntarios para comunicarnos con usted. No forman parte del registro de la JCE.",
    campos: [
      { clave: "telefono_movil", etiqueta: "Teléfono móvil", tipo: "tel", origen: "CONTACTO", requerido: true, placeholder: "809-000-0000", ayuda: "10 dígitos (809, 829 u 849) o número internacional con +." },
      { clave: "telefono_residencial", etiqueta: "Teléfono residencial", tipo: "tel", origen: "CONTACTO", requerido: false },
      { clave: "whatsapp", etiqueta: "WhatsApp", tipo: "tel", origen: "CONTACTO", requerido: false },
      { clave: "email", etiqueta: "Correo electrónico", tipo: "email", origen: "CONTACTO", requerido: false, maxLength: 160 },
      { clave: "nivel_academico", etiqueta: "Nivel académico", tipo: "select", origen: "CONTACTO", requerido: false, opciones: OPCIONES.nivelAcademico },
      { clave: "canal_preferido", etiqueta: "Canal de contacto preferido", tipo: "select", origen: "CONTACTO", requerido: false, opciones: OPCIONES.canalPreferido },
    ],
  },
  {
    id: "estructura",
    titulo: "7. Estructura organizativa",
    descripcion: "Función a la que se postula. Toda designación queda pendiente de aprobación por la coordinación correspondiente.",
    campos: [
      { clave: "cargo_solicitado", etiqueta: "Función", tipo: "select", origen: "ORGANIZACION", requerido: true, opciones: OPCIONES.cargo },
      { clave: "jurisdiccion_nivel", etiqueta: "Nivel de la demarcación", tipo: "select", origen: "ORGANIZACION", requerido: true, opciones: OPCIONES.nivelJurisdiccion },
      { clave: "jurisdiccion_provincia", etiqueta: "Provincia", tipo: "select", origen: "ORGANIZACION", requerido: true, opciones: OPCIONES.provincia },
      { clave: "jurisdiccion_municipio", etiqueta: "Municipio", tipo: "text", origen: "ORGANIZACION", requerido: false, maxLength: 80, ayuda: "Obligatorio para nivel municipio o distrito municipal." },
      { clave: "jurisdiccion_distrito_municipal", etiqueta: "Distrito municipal", tipo: "text", origen: "ORGANIZACION", requerido: false, maxLength: 80, visibleSi: { clave: "jurisdiccion_nivel", valor: "DISTRITO_MUNICIPAL" } },
      { clave: "referido_por_cedula", etiqueta: "Cédula de quien le refiere", tipo: "cedula", origen: "ORGANIZACION", requerido: false, placeholder: "000-0000000-0", ayuda: "Supervisor o promotor que le invitó, si aplica." },
      { clave: "observaciones", etiqueta: "Observaciones", tipo: "textarea", origen: "ORGANIZACION", requerido: false, maxLength: 1000, ancho: "completo" },
    ],
  },
  {
    id: "consentimientos",
    titulo: "8. Consentimientos",
    descripcion: "Ley 172-13 sobre protección de datos personales.",
    campos: [
      { clave: "consentimiento_tratamiento", etiqueta: "Autorizo el tratamiento de mis datos personales para fines de organización interna, conforme a la Ley 172-13. Puedo solicitar acceso, rectificación o supresión en cualquier momento.", tipo: "checkbox", origen: "CONSENTIMIENTO", requerido: true, ancho: "completo" },
      { clave: "consentimiento_comunicaciones", etiqueta: "Acepto recibir comunicaciones institucionales por el canal indicado. Puedo darme de baja en cualquier momento.", tipo: "checkbox", origen: "CONSENTIMIENTO", requerido: false, ancho: "completo" },
      { clave: "declaracion_veracidad", etiqueta: "Declaro que los datos suministrados son verdaderos y corresponden a mi documento de identidad.", tipo: "checkbox", origen: "CONSENTIMIENTO", requerido: true, ancho: "completo" },
    ],
  },
];

export const CAMPOS: readonly Campo[] = SECCIONES.flatMap((s) => s.campos);
export const CLAVES_CAMPOS: readonly string[] = CAMPOS.map((c) => c.clave);
