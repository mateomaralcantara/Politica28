/**
 * Provincias de República Dominicana con su código ONE (31 provincias +
 * Distrito Nacional). Los 158 municipios y 235 distritos municipales NO se
 * incluyen aquí a propósito: se importarán del catálogo oficial ONE/IGN
 * (ver docs/INSCRIPCION-CAMPOS-JCE.md, dependencia D-01) en vez de escribirse
 * a mano.
 */
export type Provincia = { codigo: string; nombre: string; esDistritoNacional?: boolean };

export const PROVINCIAS: readonly Provincia[] = [
  { codigo: "01", nombre: "Distrito Nacional", esDistritoNacional: true },
  { codigo: "02", nombre: "Azua" },
  { codigo: "03", nombre: "Bahoruco" },
  { codigo: "04", nombre: "Barahona" },
  { codigo: "05", nombre: "Dajabón" },
  { codigo: "06", nombre: "Duarte" },
  { codigo: "07", nombre: "Elías Piña" },
  { codigo: "08", nombre: "El Seibo" },
  { codigo: "09", nombre: "Espaillat" },
  { codigo: "10", nombre: "Independencia" },
  { codigo: "11", nombre: "La Altagracia" },
  { codigo: "12", nombre: "La Romana" },
  { codigo: "13", nombre: "La Vega" },
  { codigo: "14", nombre: "María Trinidad Sánchez" },
  { codigo: "15", nombre: "Monte Cristi" },
  { codigo: "16", nombre: "Pedernales" },
  { codigo: "17", nombre: "Peravia" },
  { codigo: "18", nombre: "Puerto Plata" },
  { codigo: "19", nombre: "Hermanas Mirabal" },
  { codigo: "20", nombre: "Samaná" },
  { codigo: "21", nombre: "San Cristóbal" },
  { codigo: "22", nombre: "San Juan" },
  { codigo: "23", nombre: "San Pedro de Macorís" },
  { codigo: "24", nombre: "Sánchez Ramírez" },
  { codigo: "25", nombre: "Santiago" },
  { codigo: "26", nombre: "Santiago Rodríguez" },
  { codigo: "27", nombre: "Valverde" },
  { codigo: "28", nombre: "Monseñor Nouel" },
  { codigo: "29", nombre: "Monte Plata" },
  { codigo: "30", nombre: "Hato Mayor" },
  { codigo: "31", nombre: "San José de Ocoa" },
  { codigo: "32", nombre: "Santo Domingo" },
];

export const CODIGOS_PROVINCIA = PROVINCIAS.map((p) => p.codigo);
