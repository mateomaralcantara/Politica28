/**
 * Menú del CRM: los 20 módulos de la interfaz principal de POLÍTICA 28, más el
 * área de inscripción. `listo` indica si el módulo ya tiene funcionalidad real;
 * los demás muestran su alcance y la fase del plan en la que se construyen.
 */

export type IconoNombre =
  | "mando" | "mapa" | "jerarquia" | "estrella" | "ojo" | "megafono" | "red" | "calendario"
  | "contactos" | "urna" | "barras" | "tendencia" | "capas" | "encuesta" | "mensaje"
  | "billetera" | "chip" | "engranajes" | "documento" | "ajustes" | "formulario";

export type Modulo = {
  slug: string;
  nombre: string;
  icono: IconoNombre;
  fase: number;
  descripcion: string;
  alcance: readonly string[];
  listo?: boolean;
  /** Oculto en el menú, el centro de mando y las rutas (se conserva para activarlo más adelante). */
  oculto?: boolean;
  href?: string;
};

export type Grupo = { titulo: string; modulos: readonly Modulo[] };

const TODOS: readonly Grupo[] = [
  {
    titulo: "Operación",
    modulos: [
      { slug: "", href: "/", nombre: "Centro de mando", icono: "mando", fase: 5, listo: true, descripcion: "Vista general de la organización con indicadores agregados.", alcance: ["Indicadores nacionales", "Inscripciones por provincia", "Alertas y pendientes"] },
      { slug: "inscripcion", href: "/inscripcion", nombre: "Inscripción", icono: "formulario", fase: 3, listo: true, descripcion: "Registro voluntario con los datos de la cédula y del padrón de la JCE.", alcance: ["Formulario validado", "Datos del supervisor", "Consentimientos Ley 172-13"] },
      { slug: "actividades", nombre: "Actividades", icono: "calendario", fase: 3, descripcion: "Eventos, reuniones, calendarios, asistencia e incidencias.", alcance: ["Calendario de actividades", "Registro de asistencia", "Incidencias y reportes"] },
      { slug: "crm", nombre: "CRM", icono: "contactos", fase: 3, descripcion: "Contactos voluntarios, consentimientos e historial de interacciones autorizadas.", alcance: ["Fichas de contacto", "Preferencias de comunicación", "Historial de actividades"] },
      { slug: "comunicaciones", nombre: "Comunicaciones", icono: "mensaje", fase: 3, descripcion: "Centro omnicanal con consentimiento: correo, SMS, WhatsApp Business, llamadas y avisos.", alcance: ["Plantillas aprobadas", "Exclusión voluntaria", "Historial de entregas"] },
    ],
  },
  {
    titulo: "Estructura territorial",
    modulos: [
      { slug: "territorio", nombre: "Territorio nacional", icono: "mapa", fase: 1, descripcion: "Provincias, municipios, distritos municipales y demarcaciones electorales versionadas.", alcance: ["Catálogo oficial ONE/IGN", "Límites electorales separados", "Historial de cambios"] },
      { slug: "estructura", nombre: "Estructura organizativa", icono: "jerarquia", fase: 2, descripcion: "Árbol jerárquico nacional, organigrama, vacantes y nombramientos.", alcance: ["Organigrama interactivo", "Vacantes y vencimientos", "Aprobación de designaciones"] },
      { slug: "coordinadores", nombre: "Coordinadores", icono: "estrella", fase: 2, descripcion: "Coordinadores generales y operativos por demarcación.", alcance: ["Asignación por jurisdicción", "Planes de trabajo", "Sustituciones con historial"] },
      { slug: "supervisores", nombre: "Supervisores", icono: "ojo", fase: 2, descripcion: "Seguimiento y control de los equipos asignados.", alcance: ["Equipos a cargo", "Inscripciones registradas", "Cumplimiento de procedimientos"] },
      { slug: "promotores", nombre: "Promotores", icono: "megafono", fase: 2, descripcion: "Actividades comunitarias y participación voluntaria.", alcance: ["Tareas asignadas", "Eventos y reuniones", "Asistencia"] },
      { slug: "multiplicadores", nombre: "Multiplicadores", icono: "red", fase: 2, descripcion: "Apoyo a actividades organizativas y materiales autorizados.", alcance: ["Agenda y disponibilidad", "Actividades completadas", "Materiales aprobados"] },
    ],
  },
  {
    titulo: "Datos e inteligencia",
    modulos: [
      { slug: "datos-electorales", nombre: "Datos electorales", icono: "urna", fase: 4, descripcion: "JCE Data Gateway: resultados históricos, recintos y colegios de fuentes oficiales.", alcance: ["Importaciones autorizadas", "Resultados históricos", "Recintos y colegios"] },
      { slug: "estadisticas", nombre: "Estadísticas", icono: "barras", fase: 5, descripcion: "Indicadores, distribuciones y series históricas agregadas.", alcance: ["Tableros KPI", "Series temporales", "Comparación de períodos"] },
      { slug: "analisis-predictivo", nombre: "Análisis predictivo", icono: "tendencia", fase: 5, descripcion: "Escenarios agregados con supuestos, intervalos y validación retrospectiva.", alcance: ["Proyecciones operativas", "Intervalos de incertidumbre", "Detección de anomalías"] },
      { slug: "mapas", nombre: "Mapas", icono: "capas", fase: 5, descripcion: "Mapas coropléticos y capas territoriales con MapLibre y PostGIS.", alcance: ["Mapa nacional", "Capas por demarcación", "Mapas de calor agregados"] },
      { slug: "encuestas", nombre: "Encuestas", icono: "encuesta", fase: 5, descripcion: "Diseño metodológico y análisis agregado de encuestas.", alcance: ["Cuestionarios", "Muestreo", "Resultados agregados"] },
    ],
  },
  {
    titulo: "Gestión",
    modulos: [
      { slug: "finanzas", nombre: "Finanzas", icono: "billetera", fase: 3, descripcion: "Presupuestos, gastos, aportaciones y cumplimiento normativo.", alcance: ["Presupuesto autorizado", "Ejecución", "Reportes de cumplimiento"] },
      { slug: "agentes-ia", oculto: true, nombre: "Agentes IA", icono: "chip", fase: 6, descripcion: "Registro de las 30 familias de agentes con permisos y evaluaciones.", alcance: ["Contratos de entrada y salida", "Herramientas autorizadas", "Evaluaciones reproducibles"] },
      { slug: "harness", oculto: true, nombre: "Harness Agéntico", icono: "engranajes", fase: 6, descripcion: "HARNEX: orquestación supervisada en 10 capas con auditoría y aprobación humana.", alcance: ["Planificación y enrutamiento", "Aprobaciones humanas", "Observabilidad y costes"] },
      { slug: "informes", nombre: "Informes", icono: "documento", fase: 5, descripcion: "Reportes exportables a PDF, CSV y Excel según permisos.", alcance: ["Informes por demarcación", "Exportación auditada", "Programación de reportes"] },
      { slug: "administracion", nombre: "Administración", icono: "ajustes", fase: 1, descripcion: "Organizaciones, usuarios, roles, permisos y auditoría.", alcance: ["Usuarios y roles", "MFA", "Registro de auditoría"] },
    ],
  },
];

/** Grupos visibles: excluye los módulos marcados como ocultos. */
export const GRUPOS: readonly Grupo[] = TODOS.map((g) => ({ ...g, modulos: g.modulos.filter((m) => !m.oculto) })).filter(
  (g) => g.modulos.length > 0,
);

export const MODULOS: readonly Modulo[] = GRUPOS.flatMap((g) => g.modulos);
export const MODULOS_OCULTOS: readonly Modulo[] = TODOS.flatMap((g) => g.modulos).filter((m) => m.oculto);

export const hrefModulo = (m: Modulo) => m.href ?? `/${m.slug}`;

export function buscarModulo(slug: string): Modulo | undefined {
  return MODULOS.find((m) => m.slug === slug && !m.href);
}
