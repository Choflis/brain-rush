// Almacén central de datos para el Aula Virtual de BRAIN RUSH.
// Conecta las sesiones de docs/sesiones/, los juegos de fixtures/ y las clases de estudiantes.

export interface Estudiante {
  id: string;
  nombre: string;
  apellidos: string;
  avatar: string;
  claseId: string;
  estado: "activo" | "en_riesgo" | "destacado";
  intentosTotal: number;
  promedioAciertos: number;
  criteriosBajos: string[];
  ultimoAcceso: string;
}

export interface ClaseAula {
  id: string;
  nombre: string;
  grado: number;
  seccion: string;
  nivelEscolar: string;
  docente: string;
  color: string;
  icono: string;
  estudiantesIds: string[];
  juegosComplementariosHabilitados: string[];
  sesionPrincipalId: string;
}

export interface CriterioEvaluacion {
  id: string;
  texto: string;
}

export interface SesionEstudio {
  id: string;
  archivoOrigen: string;
  titulo: string;
  grado: number;
  area: string;
  competencia: string;
  capacidad: string;
  desempenos: string[];
  criterios: CriterioEvaluacion[];
  proposito: string;
  momentos: {
    inicio: string;
    desarrollo: string;
    cierre: string;
  };
  materiales: string[];
  juegosIds: string[];
  creadoEn: string;
}

export interface DetalleCriterioEstadistica {
  criterio: string;
  texto: string;
  aciertos: number;
  total: number;
  porcentaje: number;
}

export interface AlumnoRiesgo {
  alumnoId: string;
  nombre: string;
  aciertos: number;
  total: number;
  criteriosBajos: string[];
}

export interface MetricasActivacionColectiva {
  metaAlcanzada: boolean;
  objetivoCamion: number;
  actualCamion: number;
  dispositivosConectados: number;
  rondasSuperadas: number;
  climaColaborativo: string;
}

export interface EstadisticasJuego {
  intentos: number;
  alumnos: number;
  completados: number;
  tasaLogro: number;
  tiempoPromedioSegundos: number;
  porCriterio: DetalleCriterioEstadistica[];
  riesgo: AlumnoRiesgo[];
  colectiva?: MetricasActivacionColectiva;
}

export interface JuegoAula {
  id: string;
  codigo: string;
  titulo: string;
  subtitulo: string;
  tipo: "activacion" | "complemento";
  mecanica: "tienda" | "carrera" | "ecosistemas";
  nivel: "N1" | "N2" | "N3";
  grados: number[];
  sesionId: string;
  archivoSesion: string;
  estado: "publicado" | "borrador";
  versionActual: number;
  icono: string;
  color: string;
  duracionEstimadaMin: number;
  consignaDocente: string;
  promptGeneracion?: string;
  historialCambiosIA?: { fecha: string; instruccion: string; respuesta: string }[];
  estadisticas: EstadisticasJuego;
}

export interface HistorialIntento {
  id: string;
  juegoId: string;
  alumnoId: string;
  alumnoNombre: string;
  claseId: string;
  aciertos: number;
  total: number;
  porcentaje: number;
  fecha: string;
  duracionSegundos: number;
  criteriosAprobados: string[];
}

const CLAVE_STORAGE = "brainrush_aulavirtual_datos_v3";

// -------------------------------------------------------------
// DATOS SEMILLA PRECARGADOS
// -------------------------------------------------------------

const ESTUDIANTES_SEMILLA: Estudiante[] = [
  // 1.º Grado
  { id: "alu-101", nombre: "Mateo", apellidos: "Quispe Flores", avatar: "👦🏽", claseId: "clase-1a", estado: "destacado", intentosTotal: 4, promedioAciertos: 95, criteriosBajos: [], ultimoAcceso: "Hoy 07:45" },
  { id: "alu-102", nombre: "Lucía", apellidos: "Morales Cárdenas", avatar: "👧🏻", claseId: "clase-1a", estado: "activo", intentosTotal: 3, promedioAciertos: 82, criteriosBajos: [], ultimoAcceso: "Hoy 08:10" },
  { id: "alu-103", nombre: "Thiago", apellidos: "Huamán Ríos", avatar: "👦🏾", claseId: "clase-1a", estado: "en_riesgo", intentosTotal: 3, promedioAciertos: 45, criteriosBajos: ["C2"], ultimoAcceso: "Ayer" },
  { id: "alu-104", nombre: "Valentina", apellidos: "Ramos Salazar", avatar: "👧🏼", claseId: "clase-1a", estado: "activo", intentosTotal: 4, promedioAciertos: 78, criteriosBajos: [], ultimoAcceso: "Hoy 08:00" },
  { id: "alu-105", nombre: "Benjamín", apellidos: "Flores Peña", avatar: "👦🏻", claseId: "clase-1a", estado: "en_riesgo", intentosTotal: 2, promedioAciertos: 50, criteriosBajos: ["C1"], ultimoAcceso: "Hace 2 días" },
  { id: "alu-106", nombre: "Sofía", apellidos: "Romero Vega", avatar: "👧🏽", claseId: "clase-1a", estado: "activo", intentosTotal: 3, promedioAciertos: 88, criteriosBajos: [], ultimoAcceso: "Hoy 08:05" },

  // 3.º Grado
  { id: "alu-301", nombre: "Ana", apellidos: "Torres Bellido", avatar: "👧🏽", claseId: "clase-3b", estado: "destacado", intentosTotal: 5, promedioAciertos: 92, criteriosBajos: [], ultimoAcceso: "Hoy 07:50" },
  { id: "alu-302", nombre: "Joaquín", apellidos: "Castro Huanca", avatar: "👦🏼", claseId: "clase-3b", estado: "en_riesgo", intentosTotal: 4, promedioAciertos: 48, criteriosBajos: ["C3"], ultimoAcceso: "Ayer" },
  { id: "alu-303", nombre: "Camila", apellidos: "Vargas Luna", avatar: "👧🏻", claseId: "clase-3b", estado: "activo", intentosTotal: 3, promedioAciertos: 75, criteriosBajos: [], ultimoAcceso: "Hoy 08:12" },
  { id: "alu-304", nombre: "Diego", apellidos: "Salazar Mendoza", avatar: "👦🏽", claseId: "clase-3b", estado: "en_riesgo", intentosTotal: 3, promedioAciertos: 52, criteriosBajos: ["C3"], ultimoAcceso: "Ayer" },
  { id: "alu-305", nombre: "Valeria", apellidos: "Mendoza Ortiz", avatar: "👧🏾", claseId: "clase-3b", estado: "activo", intentosTotal: 4, promedioAciertos: 84, criteriosBajos: [], ultimoAcceso: "Hoy 07:30" },

  // 5.º Grado
  { id: "alu-501", nombre: "Alejandro", apellidos: "Paz Alarcón", avatar: "👦🏻", claseId: "clase-5a", estado: "destacado", intentosTotal: 6, promedioAciertos: 94, criteriosBajos: [], ultimoAcceso: "Hoy 08:02" },
  { id: "alu-502", nombre: "Mariana", apellidos: "Chávez Suárez", avatar: "👧🏼", claseId: "clase-5a", estado: "activo", intentosTotal: 4, promedioAciertos: 86, criteriosBajos: [], ultimoAcceso: "Hoy 08:14" },
  { id: "alu-503", nombre: "Gabriel", apellidos: "Ríos Valdivia", avatar: "👦🏽", claseId: "clase-5a", estado: "en_riesgo", intentosTotal: 3, promedioAciertos: 55, criteriosBajos: ["C2"], ultimoAcceso: "Ayer" },
  { id: "alu-504", nombre: "Daniela", apellidos: "Paredes Soto", avatar: "👧🏽", claseId: "clase-5a", estado: "activo", intentosTotal: 4, promedioAciertos: 80, criteriosBajos: [], ultimoAcceso: "Hoy 07:40" },
  { id: "alu-505", nombre: "Nicolás", apellidos: "Espinoza Cruz", avatar: "👦🏾", claseId: "clase-5a", estado: "activo", intentosTotal: 3, promedioAciertos: 78, criteriosBajos: [], ultimoAcceso: "Ayer" },
];

const SESIONES_SEMILLA: SesionEstudio[] = [
  {
    id: "ses-1-tienda",
    archivoOrigen: "docs/sesiones/nivel-3/primer-grado-u1-s9.pdf",
    titulo: "Elaboran el cartel con los precios de los productos y sus nombres",
    grado: 1,
    area: "Matemática",
    competencia: "Resuelve problemas de cantidad",
    capacidad: "Comunica su comprensión sobre los números y las operaciones.",
    desempenos: [
      "Expresa con diversas representaciones y números, su comprensión del número como cardinal hasta 10 objetos."
    ],
    criterios: [
      { id: "C1", texto: "Organiza productos u objetos de la tiendita al clasificarlos de acuerdo a su categoría o distintos criterios." },
      { id: "C2", texto: "Representa las clases de dichos productos u objetos a través de números hasta 10." }
    ],
    proposito: "Hoy vamos a organizar los objetos de la tienda en grupos y en subgrupos. A través de esto van a aprender a representar el número hasta el 10.",
    momentos: {
      inicio: "En grupo clase: dialogar sobre los materiales recolectados para la tiendita. Presentar el problema: ¿De qué manera podríamos organizar todos los productos de la tienda? Plantear preguntas de familiarización para agrupar bebidas, frutas y productos de limpieza.",
      desarrollo: "En grupos pequeños: colocar objetos en cajas de clasificación. Contar los objetos de cada grupo y representarlos con números cardinales hasta el 10. Escribir carteles de precios y nombres.",
      cierre: "Metacognición en plenario: ¿Cómo ordenamos los productos? ¿Por qué es útil tener categorías? Si juntamos grupos, ¿qué subgrupos descubrimos?"
    },
    materiales: ["Papel reusable", "Etiquetas de precios", "Cajas de productos", "Plumones", "Monedas didácticas", "Cuaderno de Trabajo de Matemática 1"],
    juegosIds: ["juego-n1-tienda-act", "juego-n1-tienda-comp"],
    creadoEn: "2026-11-04T18:00:00.000Z"
  },
  {
    id: "ses-2-longitud",
    archivoOrigen: "docs/sesiones/nivel-4/11 MAT UNIDADES DE LONGITUD.docx",
    titulo: "Unidades de Longitud: múltiplos y conversiones en el patio",
    grado: 3,
    area: "Matemática",
    competencia: "Resuelve problemas de forma, movimiento y localización",
    capacidad: "Modela objetos con formas geométricas y sus transformaciones; Comunica su comprensión sobre relaciones geométricas.",
    desempenos: [
      "Mide y estima la longitud de objetos utilizando unidades convencionales; además, establece equivalencias y realiza conversiones empleando el esquema de ×10 y ÷10."
    ],
    criterios: [
      { id: "C1", texto: "Identifica las unidades de longitud (m, cm, mm, km)." },
      { id: "C2", texto: "Reconoce múltiplos y submúltiplos del metro." },
      { id: "C3", texto: "Realiza conversiones usando ×10 y ÷10 en la escalera métrica." },
      { id: "C4", texto: "Resuelve problemas de longitud y explica su procedimiento." }
    ],
    proposito: "Hoy descubriremos cómo pasar de una unidad de longitud a otra de manera rápida y correcta usando la escalera métrica.",
    momentos: {
      inicio: "Situación comunicativa en el patio escolar: ¿Cómo medir la distancia entre la meta y el arco? Conflicto cognitivo: ¿cuántos centímetros hay en 7 metros?",
      desarrollo: "Familiarización con la escalera métrica. Descubrimiento de las operaciones ×10 al bajar escalones y ÷10 al subirlos. Práctica guiada con la regla y cinta métrica.",
      cierre: "Formalización gráfica en la libreta. Resolución de ficha de cotejo y preguntas de reflexión sobre qué unidad conviene en cada caso."
    },
    materiales: ["Regla de 30 cm", "Cinta métrica", "Tarjetas de unidades", "Pizarra y plumones", "Ficha de aplicación"],
    juegosIds: ["juego-n2-carrera"],
    creadoEn: "2026-11-04T19:30:00.000Z"
  },
  {
    id: "ses-3-ecosistemas",
    archivoOrigen: "docs/sesiones/nivel-5/Sesion_CyT_5to_Ciclo_V_Ecosistemas.docx",
    titulo: "Los ecosistemas y la relación entre sus componentes",
    grado: 5,
    area: "Ciencia y Tecnología",
    competencia: "Explica el mundo físico basándose en conocimientos sobre seres vivos, materia y energía, biodiversidad, Tierra y universo",
    capacidad: "Comprende y usa conocimientos sobre los seres vivos; Evalúa las implicancias del saber científico y tecnológico.",
    desempenos: [
      "Describe los ecosistemas y analiza cómo la alteración de un componente biótico o abiótico afecta el equilibrio ambiental del entorno escolar."
    ],
    criterios: [
      { id: "C1", texto: "Diferencia los componentes bióticos de los componentes abióticos del jardín escolar." },
      { id: "C2", texto: "Describe las relaciones tróficas y de equilibrio entre componentes." },
      { id: "C3", texto: "Predice la consecuencia de disminuir el agua en el jardín." },
      { id: "C4", texto: "Opina sobre el uso del sistema de riego por goteo con respaldo científico." }
    ],
    proposito: "Explicar cómo se relacionan los componentes bióticos y abióticos del jardín escolar y proponer medidas de equilibrio ecológico.",
    momentos: {
      inicio: "Visita de observación al biohuerto escolar. Planteamiento de la pregunta de indagación: ¿Qué seres vivos y no vivos interactúan en nuestro jardín?",
      desarrollo: "Registro en fichas de campo. Construcción de redes alimentarias y cadenas de interacción ecológica. Simulación de sequía y propuesta de riego por goteo.",
      cierre: "Plenario de conclusiones con evidencia científica. Autoevaluación del impacto humano en el ecosistema."
    },
    materiales: ["Lupa", "Frascos recolectores", "Cuaderno de campo", "Esquemas de biohuerto", "Muestras de tierra y plantas"],
    juegosIds: ["juego-n3-ecosistemas-act", "juego-n3-ecosistemas-comp"],
    creadoEn: "2026-11-04T21:00:00.000Z"
  }
];

const JUEGOS_SEMILLA: JuegoAula[] = [
  {
    id: "juego-n1-tienda-act",
    codigo: "TIENDA",
    titulo: "La Tiendita de Reglita · Activación en Aula",
    subtitulo: "Juego colectivo para proyectar en el salón: llenemos el camión entre todos",
    tipo: "activacion",
    mecanica: "tienda",
    nivel: "N1",
    grados: [1, 2],
    sesionId: "ses-1-tienda",
    archivoSesion: "docs/sesiones/nivel-3/primer-grado-u1-s9.pdf",
    estado: "publicado",
    versionActual: 1,
    icono: "🛒",
    color: "#f26a3d",
    duracionEstimadaMin: 10,
    consignaDocente: "Proyecta en pantalla grande. Los niños entran desde sus tablets con el código PIN y colaboran clasificando bebidas y frutas para llenar el camión.",
    promptGeneracion: "Crea una activación cooperativa de primer grado basada en la sesión del cartel de precios. Mecánica de clasificar productos en estanterías y bolsa de compras hasta 10.",
    historialCambiosIA: [
      {
        fecha: "2026-11-04T18:15:00.000Z",
        instruccion: "Hacer que la meta colectiva del camión sea de 10 productos para coincidir con la cardinalidad.",
        respuesta: "Actualizado el objetivo de meta colectiva a 10 productos exactos con feedback sonoro de bocina."
      }
    ],
    estadisticas: {
      intentos: 18,
      alumnos: 18,
      completados: 18,
      tasaLogro: 100,
      tiempoPromedioSegundos: 145,
      colectiva: {
        metaAlcanzada: true,
        objetivoCamion: 10,
        actualCamion: 10,
        dispositivosConectados: 18,
        rondasSuperadas: 12,
        climaColaborativo: "Alta colaboración grupal",
      },
      porCriterio: [
        { criterio: "C1", texto: "Clasifica productos por categoría", aciertos: 36, total: 36, porcentaje: 1.0 },
        { criterio: "C2", texto: "Representa cantidades hasta 10", aciertos: 34, total: 36, porcentaje: 0.94 }
      ],
      riesgo: []
    }
  },
  {
    id: "juego-n1-tienda-comp",
    codigo: "TIENDA-C",
    titulo: "La Tiendita: Mi Negocio · Complemento",
    subtitulo: "Práctica individual para la casa o laboratorio de cómputo",
    tipo: "complemento",
    mecanica: "tienda",
    nivel: "N1",
    grados: [1, 2],
    sesionId: "ses-1-tienda",
    archivoSesion: "docs/sesiones/nivel-3/primer-grado-u1-s9.pdf",
    estado: "publicado",
    versionActual: 1,
    icono: "🏪",
    color: "#e65100",
    duracionEstimadaMin: 8,
    consignaDocente: "Cada estudiante juega a su propio ritmo. Se evalúa la clasificación sin ayuda y el conteo de pedidos.",
    estadisticas: {
      intentos: 14,
      alumnos: 6,
      completados: 12,
      tasaLogro: 83,
      tiempoPromedioSegundos: 190,
      porCriterio: [
        { criterio: "C1", texto: "Organiza productos u objetos por categoría", aciertos: 24, total: 28, porcentaje: 0.86 },
        { criterio: "C2", texto: "Representa clases a través de números hasta 10", aciertos: 22, total: 28, porcentaje: 0.79 }
      ],
      riesgo: [
        { alumnoId: "alu-105", nombre: "Benjamín Flores", aciertos: 4, total: 9, criteriosBajos: ["C1"] }
      ]
    }
  },
  {
    id: "juego-n2-carrera",
    codigo: "CARRERA",
    titulo: "Carrera del Patio: Unidades de Longitud",
    subtitulo: "Reglita corre por el patio y salta puertas con conversiones ×10 y ÷10",
    tipo: "complemento",
    mecanica: "carrera",
    nivel: "N2",
    grados: [3, 4],
    sesionId: "ses-2-longitud",
    archivoSesion: "docs/sesiones/nivel-4/11 MAT UNIDADES DE LONGITUD.docx",
    estado: "publicado",
    versionActual: 1,
    icono: "🏃🏽‍♂️",
    color: "#1f7a6a",
    duracionEstimadaMin: 9,
    consignaDocente: "Juego individual en Phaser. Los alumnos calculan conversiones usando botones interactivos de ×10 y ÷10 en la escalera métrica.",
    promptGeneracion: "Generar juego de carrera con obstáculos para 3.º grado. Mecánica de escalera de unidades de longitud (m, dm, cm, mm) con 3 niveles de dificultad.",
    historialCambiosIA: [
      {
        fecha: "2026-11-04T19:50:00.000Z",
        instruccion: "Agregar opciones con números decimales en dificultad avanzada (ej. 2.5 m a cm).",
        respuesta: "Configuración actualizada con valores de precisión decimal y feedback pedagógico con escalera iluminada."
      }
    ],
    estadisticas: {
      intentos: 19,
      alumnos: 5,
      completados: 15,
      tasaLogro: 76,
      tiempoPromedioSegundos: 240,
      porCriterio: [
        { criterio: "C3", texto: "Realiza conversiones usando ×10 y ÷10", aciertos: 39, total: 54, porcentaje: 0.72 }
      ],
      riesgo: [
        { alumnoId: "alu-302", nombre: "Joaquín Castro", aciertos: 3, total: 9, criteriosBajos: ["C3"] },
        { alumnoId: "alu-304", nombre: "Diego Salazar", aciertos: 4, total: 9, criteriosBajos: ["C3"] }
      ]
    }
  },
  {
    id: "juego-n3-ecosistemas-act",
    codigo: "ECO-ACT",
    titulo: "El Jardín en Equilibrio · Activación en Aula",
    subtitulo: "Colaboración en equipos: mantener vivo el biohuerto frente a la sequía",
    tipo: "activacion",
    mecanica: "ecosistemas",
    nivel: "N3",
    grados: [5, 6],
    sesionId: "ses-3-ecosistemas",
    archivoSesion: "docs/sesiones/nivel-5/Sesion_CyT_5to_Ciclo_V_Ecosistemas.docx",
    estado: "publicado",
    versionActual: 1,
    icono: "🌱",
    color: "#2b8a3e",
    duracionEstimadaMin: 12,
    consignaDocente: "Cada equipo controla un componente ecológico (agua, insectos, suelo). Juntos resuelven la crisis de sequía mediante el riego por goteo.",
    estadisticas: {
      intentos: 16,
      alumnos: 16,
      completados: 16,
      tasaLogro: 95,
      tiempoPromedioSegundos: 290,
      colectiva: {
        metaAlcanzada: true,
        objetivoCamion: 8,
        actualCamion: 8,
        dispositivosConectados: 16,
        rondasSuperadas: 8,
        climaColaborativo: "Excelente trabajo en equipos",
      },
      porCriterio: [
        { criterio: "C1", texto: "Diferencia factores bióticos y abióticos", aciertos: 30, total: 30, porcentaje: 1.0 },
        { criterio: "C2", texto: "Explica relaciones tróficas y equilibrio", aciertos: 28, total: 30, porcentaje: 0.93 }
      ],
      riesgo: []
    }
  },
  {
    id: "juego-n3-ecosistemas-comp",
    codigo: "ECOAVENTURA",
    titulo: "EcoAventura: Guardianes del Recreo",
    subtitulo: "Mundo de exploración ambiental: misiones de rescate ecológico y reciclaje",
    tipo: "complemento",
    mecanica: "ecosistemas",
    nivel: "N3",
    grados: [5, 6],
    sesionId: "ses-3-ecosistemas",
    archivoSesion: "docs/sesiones/nivel-5/Sesion_CyT_5to_Ciclo_V_Ecosistemas.docx",
    estado: "publicado",
    versionActual: 1,
    icono: "🌳",
    color: "#0ca678",
    duracionEstimadaMin: 15,
    consignaDocente: "Práctica individual donde cada estudiante resuelve los 5 retos de investigación ambiental y recibe su diploma de guardián ecológico.",
    estadisticas: {
      intentos: 20,
      alumnos: 5,
      completados: 18,
      tasaLogro: 86,
      tiempoPromedioSegundos: 280,
      porCriterio: [
        { criterio: "C1", texto: "Diferencia componentes bióticos y abióticos", aciertos: 35, total: 40, porcentaje: 0.88 },
        { criterio: "C2", texto: "Describe el impacto de la disminución de agua", aciertos: 32, total: 40, porcentaje: 0.80 }
      ],
      riesgo: []
    }
  }
];

const CLASES_SEMILLA: ClaseAula[] = [
  {
    id: "clase-1a",
    nombre: "1.º Grado Primaria · Sección A",
    grado: 1,
    seccion: "A",
    nivelEscolar: "Primaria",
    docente: "Prof. Carlos Mendoza",
    color: "#f26a3d",
    icono: "🎒",
    estudiantesIds: ["alu-101", "alu-102", "alu-103", "alu-104", "alu-105", "alu-106"],
    juegosComplementariosHabilitados: ["juego-n1-tienda-comp"],
    sesionPrincipalId: "ses-1-tienda"
  },
  {
    id: "clase-3b",
    nombre: "3.º Grado Primaria · Sección B",
    grado: 3,
    seccion: "B",
    nivelEscolar: "Primaria",
    docente: "Prof. Carlos Mendoza",
    color: "#1f7a6a",
    icono: "🔬",
    estudiantesIds: ["alu-301", "alu-302", "alu-303", "alu-304", "alu-305"],
    juegosComplementariosHabilitados: ["juego-n2-carrera"],
    sesionPrincipalId: "ses-2-longitud"
  },
  {
    id: "clase-5a",
    nombre: "5.º Grado Primaria · Sección A",
    grado: 5,
    seccion: "A",
    nivelEscolar: "Primaria",
    docente: "Prof. Carlos Mendoza",
    color: "#2b8a3e",
    icono: "🌿",
    estudiantesIds: ["alu-501", "alu-502", "alu-503", "alu-504", "alu-505"],
    juegosComplementariosHabilitados: ["juego-n3-ecosistemas-comp"],
    sesionPrincipalId: "ses-3-ecosistemas"
  }
];

const HISTORIAL_SEMILLA: HistorialIntento[] = [
  { id: "h-1", juegoId: "juego-n1-tienda-comp", alumnoId: "alu-101", alumnoNombre: "Mateo Quispe", claseId: "clase-1a", aciertos: 10, total: 10, porcentaje: 1.0, fecha: "Hoy 07:45", duracionSegundos: 120, criteriosAprobados: ["C1", "C2"] },
  { id: "h-2", juegoId: "juego-n1-tienda-comp", alumnoId: "alu-102", alumnoNombre: "Lucía Morales", claseId: "clase-1a", aciertos: 8, total: 10, porcentaje: 0.8, fecha: "Hoy 08:10", duracionSegundos: 140, criteriosAprobados: ["C1", "C2"] },
  { id: "h-3", juegoId: "juego-n1-tienda-comp", alumnoId: "alu-103", alumnoNombre: "Thiago Huamán", claseId: "clase-1a", aciertos: 4, total: 10, porcentaje: 0.4, fecha: "Ayer 15:30", duracionSegundos: 210, criteriosAprobados: ["C1"] },
  { id: "h-4", juegoId: "juego-n2-carrera", alumnoId: "alu-301", alumnoNombre: "Ana Torres", claseId: "clase-3b", aciertos: 9, total: 9, porcentaje: 1.0, fecha: "Hoy 07:50", duracionSegundos: 180, criteriosAprobados: ["C3"] },
  { id: "h-5", juegoId: "juego-n2-carrera", alumnoId: "alu-302", alumnoNombre: "Joaquín Castro", claseId: "clase-3b", aciertos: 4, total: 9, porcentaje: 0.44, fecha: "Ayer 16:15", duracionSegundos: 310, criteriosAprobados: [] },
  { id: "h-6", juegoId: "juego-n3-ecosistemas-comp", alumnoId: "alu-501", alumnoNombre: "Alejandro Paz", claseId: "clase-5a", aciertos: 10, total: 10, porcentaje: 1.0, fecha: "Hoy 08:02", duracionSegundos: 220, criteriosAprobados: ["C1", "C2"] },
  { id: "h-7", juegoId: "juego-n3-ecosistemas-comp", alumnoId: "alu-503", alumnoNombre: "Gabriel Ríos", claseId: "clase-5a", aciertos: 5, total: 10, porcentaje: 0.5, fecha: "Ayer 17:00", duracionSegundos: 340, criteriosAprobados: ["C1"] }
];

// -------------------------------------------------------------
// ESTADO Y PERSISTENCIA
// -------------------------------------------------------------

interface EstadoAulaVirtual {
  estudiantes: Estudiante[];
  sesiones: SesionEstudio[];
  juegos: JuegoAula[];
  clases: ClaseAula[];
  historial: HistorialIntento[];
}

function cargarEstado(): EstadoAulaVirtual {
  if (typeof window === "undefined") {
    return {
      estudiantes: ESTUDIANTES_SEMILLA,
      sesiones: SESIONES_SEMILLA,
      juegos: JUEGOS_SEMILLA,
      clases: CLASES_SEMILLA,
      historial: HISTORIAL_SEMILLA,
    };
  }

  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    if (!raw) {
      const inicial: EstadoAulaVirtual = {
        estudiantes: ESTUDIANTES_SEMILLA,
        sesiones: SESIONES_SEMILLA,
        juegos: JUEGOS_SEMILLA,
        clases: CLASES_SEMILLA,
        historial: HISTORIAL_SEMILLA,
      };
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(inicial));
      return inicial;
    }
    return JSON.parse(raw) as EstadoAulaVirtual;
  } catch (error) {
    console.warn("Error al leer estado de localStorage, usando semilla:", error);
    return {
      estudiantes: ESTUDIANTES_SEMILLA,
      sesiones: SESIONES_SEMILLA,
      juegos: JUEGOS_SEMILLA,
      clases: CLASES_SEMILLA,
      historial: HISTORIAL_SEMILLA,
    };
  }
}

function guardarEstado(estado: EstadoAulaVirtual) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
  }
}

// -------------------------------------------------------------
// API / OPERACIONES DEL AULA VIRTUAL
// -------------------------------------------------------------

export const aulaVirtual = {
  obtenerTodo(): EstadoAulaVirtual {
    return cargarEstado();
  },

  obtenerClases(): ClaseAula[] {
    return cargarEstado().clases;
  },

  obtenerClasePorId(id: string): ClaseAula | undefined {
    return cargarEstado().clases.find((c) => c.id === id);
  },

  obtenerSesiones(): SesionEstudio[] {
    return cargarEstado().sesiones;
  },

  obtenerSesionPorId(id: string): SesionEstudio | undefined {
    return cargarEstado().sesiones.find((s) => s.id === id);
  },

  obtenerJuegos(): JuegoAula[] {
    return cargarEstado().juegos;
  },

  obtenerJuegoPorId(id: string): JuegoAula | undefined {
    return cargarEstado().juegos.find((j) => j.id === id);
  },

  obtenerJuegosPorSesion(sesionId: string): JuegoAula[] {
    return cargarEstado().juegos.filter((j) => j.sesionId === sesionId);
  },

  obtenerJuegosPorClase(claseId: string): JuegoAula[] {
    const estado = cargarEstado();
    const clase = estado.clases.find((c) => c.id === claseId);
    if (!clase) return [];
    return estado.juegos.filter(
      (j) =>
        j.tipo === "complemento" &&
        clase.juegosComplementariosHabilitados.includes(j.id)
    );
  },

  obtenerEstudiantesPorClase(claseId: string): Estudiante[] {
    const estado = cargarEstado();
    const clase = estado.clases.find((c) => c.id === claseId);
    if (!clase) return [];
    return estado.estudiantes.filter((e) => clase.estudiantesIds.includes(e.id));
  },

  obtenerMetricasGlobales() {
    const estado = cargarEstado();
    const totalSesiones = estado.sesiones.length;
    const totalJuegos = estado.juegos.length;
    const totalEstudiantes = estado.estudiantes.length;
    const alumnosEnRiesgo = estado.estudiantes.filter((e) => e.estado === "en_riesgo").length;
    
    const sumAciertos = estado.estudiantes.reduce((acc, curr) => acc + curr.promedioAciertos, 0);
    const promedioLogroGlobal = Math.round(sumAciertos / (totalEstudiantes || 1));

    const totalIntentos = estado.historial.length;

    return {
      totalSesiones,
      totalJuegos,
      totalEstudiantes,
      alumnosEnRiesgo,
      promedioLogroGlobal,
      totalIntentos,
    };
  },

  toggleJuegoComplementarioEnClase(claseId: string, juegoId: string): boolean {
    const estado = cargarEstado();
    const clase = estado.clases.find((c) => c.id === claseId);
    if (!clase) return false;

    const existe = clase.juegosComplementariosHabilitados.includes(juegoId);
    if (existe) {
      clase.juegosComplementariosHabilitados = clase.juegosComplementariosHabilitados.filter(
        (id) => id !== juegoId
      );
    } else {
      clase.juegosComplementariosHabilitados.push(juegoId);
    }

    guardarEstado(estado);
    return !existe;
  },

  crearSesion(
    datos: {
      titulo: string;
      grado: number;
      area: string;
      competencia: string;
      capacidad?: string;
      proposito?: string;
      archivoNombre?: string;
      criterios?: { id: string; texto: string }[];
    },
    indicacionesIA?: string
  ): { sesion: SesionEstudio; juegosGenerados: JuegoAula[] } {
    const estado = cargarEstado();
    const nuevaSesionId = `ses-${Date.now()}`;
    const codigoJuego = `JUEGO-${Math.floor(1000 + Math.random() * 9000)}`;

    const criteriosFinales = datos.criterios && datos.criterios.length > 0
      ? datos.criterios
      : [
          { id: "C1", texto: `Identifica y aplica conceptos clave de ${datos.area}` },
          { id: "C2", texto: `Resuelve problemas y argumenta su procedimiento en grado ${datos.grado}.º` }
        ];

    const nuevaSesion: SesionEstudio = {
      id: nuevaSesionId,
      archivoOrigen: datos.archivoNombre || "sesion-subida.pdf",
      titulo: datos.titulo,
      grado: datos.grado,
      area: datos.area,
      competencia: datos.competencia,
      capacidad: datos.capacidad || "Comunica su comprensión y utiliza estrategias adecuadas.",
      desempenos: [
        `Demuestra comprensión de los conceptos pedagógicos correspondientes a ${datos.area} en ${datos.grado}.º de primaria.`
      ],
      criterios: criteriosFinales,
      proposito: datos.proposito || `Aprender mediante dinámicas interactivas los contenidos de ${datos.titulo}.`,
      momentos: {
        inicio: "Motivación y rescate de saberes previos con preguntas contextualizadas.",
        desarrollo: "Experimentación activa mediante el videojuego pedagógico de BRAIN RUSH.",
        cierre: "Metacognición grupal y consolidación de evidencias de aprendizaje."
      },
      materiales: ["Documento de sesión de aprendizaje", "Dispositivos móviles o proyector"],
      juegosIds: [],
      creadoEn: new Date().toISOString(),
    };

    // Generar juego de activación y complemento orientados por la IA
    const juegoActivacion: JuegoAula = {
      id: `juego-act-${Date.now()}`,
      codigo: `${codigoJuego}-ACT`,
      titulo: `${datos.titulo} · Activación`,
      subtitulo: "Juego colectivo para proyectar en el aula",
      tipo: "activacion",
      mecanica: datos.grado <= 2 ? "tienda" : datos.grado <= 4 ? "carrera" : "ecosistemas",
      nivel: datos.grado <= 2 ? "N1" : datos.grado <= 4 ? "N2" : "N3",
      grados: [datos.grado],
      sesionId: nuevaSesionId,
      archivoSesion: datos.archivoNombre || "sesion-subida.pdf",
      estado: "publicado",
      versionActual: 1,
      icono: datos.grado <= 2 ? "🛒" : datos.grado <= 4 ? "🏃🏽‍♂️" : "🌱",
      color: "#f26a3d",
      duracionEstimadaMin: 10,
      consignaDocente: "Proyecta en el aula con la pantalla de proyección. Cada alumno se une con su tablet.",
      promptGeneracion: indicacionesIA || "Generación automática según la sesión de aprendizaje.",
      estadisticas: {
        intentos: 0,
        alumnos: 0,
        completados: 0,
        tasaLogro: 0,
        tiempoPromedioSegundos: 0,
        porCriterio: criteriosFinales.map(c => ({
          criterio: c.id,
          texto: c.texto,
          aciertos: 0,
          total: 0,
          porcentaje: 0
        })),
        riesgo: []
      }
    };

    const juegoComplemento: JuegoAula = {
      id: `juego-comp-${Date.now()}`,
      codigo: `${codigoJuego}-COMP`,
      titulo: `${datos.titulo} · Complemento`,
      subtitulo: "Práctica individual y refuerzo en casa",
      tipo: "complemento",
      mecanica: datos.grado <= 2 ? "tienda" : datos.grado <= 4 ? "carrera" : "ecosistemas",
      nivel: datos.grado <= 2 ? "N1" : datos.grado <= 4 ? "N2" : "N3",
      grados: [datos.grado],
      sesionId: nuevaSesionId,
      archivoSesion: datos.archivoNombre || "sesion-subida.pdf",
      estado: "publicado",
      versionActual: 1,
      icono: datos.grado <= 2 ? "🏪" : datos.grado <= 4 ? "🎮" : "🌳",
      color: "#1f7a6a",
      duracionEstimadaMin: 8,
      consignaDocente: "Habilita este juego en la sección de clases para que los alumnos lo jueguen.",
      promptGeneracion: indicacionesIA || "Generación automática según la sesión de aprendizaje.",
      estadisticas: {
        intentos: 0,
        alumnos: 0,
        completados: 0,
        tasaLogro: 0,
        tiempoPromedioSegundos: 0,
        porCriterio: criteriosFinales.map(c => ({
          criterio: c.id,
          texto: c.texto,
          aciertos: 0,
          total: 0,
          porcentaje: 0
        })),
        riesgo: []
      }
    };

    nuevaSesion.juegosIds = [juegoActivacion.id, juegoComplemento.id];

    estado.sesiones.unshift(nuevaSesion);
    estado.juegos.unshift(juegoActivacion, juegoComplemento);

    // Asignar a la clase correspondiente del mismo grado si existe
    const claseDelGrado = estado.clases.find(c => c.grado === datos.grado);
    if (claseDelGrado) {
      claseDelGrado.juegosComplementariosHabilitados.push(juegoComplemento.id);
    }

    guardarEstado(estado);
    return { sesion: nuevaSesion, juegosGenerados: [juegoActivacion, juegoComplemento] };
  },

  refinarJuegoConIA(
    juegoId: string,
    instruccionDocente: string
  ): { respuestaIA: string; juegoActualizado: JuegoAula } {
    const estado = cargarEstado();
    const juego = estado.juegos.find((j) => j.id === juegoId);
    if (!juego) throw new Error("Juego no encontrado");

    juego.versionActual += 1;
    juego.historialCambiosIA = juego.historialCambiosIA || [];

    // Generar respuesta pedagógica contextualmente rica
    let respuestaIA = "";
    const lower = instruccionDocente.toLowerCase();

    if (lower.includes("tiempo") || lower.includes("rápido") || lower.includes("velocidad")) {
      respuestaIA = `¡Entendido, profe! Como tu copiloto, ajusté la velocidad y el ritmo de ${juego.mecanica}. Ahora Reglita se desplaza de forma más ágil y añadí 5 segundos de margen para que tus estudiantes reflexionen antes de recibir la pista.`;
    } else if (lower.includes("difícil") || lower.includes("dificultad") || lower.includes("reto")) {
      respuestaIA = `¡Me encanta el reto pedagógico, profe! Aumenté el nivel de desafío: añadí opciones con distractores matemáticos más retadores y habilité la ronda avanzada.`;
    } else if (lower.includes("pista") || lower.includes("ayuda") || lower.includes("fácil")) {
      respuestaIA = `¡Buena decisión formativa, profe! He añadido un andamiaje con pistas visuales guiadas. Si un alumno duda en su primer intento, yo misma le muestro una pista animada sin penalización.`;
    } else if (lower.includes("precio") || lower.includes("número") || lower.includes("cantidad")) {
      respuestaIA = `¡Listo, profe! Ajusté las cantidades y precios para que calcen exactamente con la cardinalidad y criterios de tu sesión curricular.`;
    } else {
      respuestaIA = `¡Perfecto, profe! Apliqué tu instrucción: «${instruccionDocente}». Acabo de compilar la versión v${juego.versionActual} con nuevos parámetros pedagógicos. ¿La probamos juntas?`;
    }

    juego.historialCambiosIA.push({
      fecha: new Date().toISOString(),
      instruccion: instruccionDocente,
      respuesta: respuestaIA,
    });

    guardarEstado(estado);
    return { respuestaIA, juegoActualizado: juego };
  },

  registrarIntentoEstudiante(datos: {
    juegoId: string;
    alumnoId: string;
    aciertos: number;
    total: number;
    duracionSegundos: number;
    items?: { itemId: string; criterio: string; correcto: boolean }[];
  }) {
    const estado = cargarEstado();
    const juego = estado.juegos.find((j) => j.id === datos.juegoId);
    const alumno = estado.estudiantes.find((e) => e.id === datos.alumnoId);
    if (!juego || !alumno) return;

    const porcentaje = datos.total > 0 ? Math.round((datos.aciertos / datos.total) * 100) / 100 : 0;
    const aprobado = porcentaje >= 0.6;

    const nuevoIntento: HistorialIntento = {
      id: `intento-${Date.now()}`,
      juegoId: datos.juegoId,
      alumnoId: datos.alumnoId,
      alumnoNombre: `${alumno.nombre} ${alumno.apellidos}`,
      claseId: alumno.claseId,
      aciertos: datos.aciertos,
      total: datos.total,
      porcentaje,
      fecha: "Hace un momento",
      duracionSegundos: datos.duracionSegundos,
      criteriosAprobados: aprobado ? ["C1", "C2", "C3"] : ["C1"]
    };

    estado.historial.unshift(nuevoIntento);

    // Actualizar estadísticas del juego
    juego.estadisticas.intentos += 1;
    if (aprobado) juego.estadisticas.completados += 1;
    const todosIntentosJuego = estado.historial.filter((h) => h.juegoId === datos.juegoId);
    const avgScore = todosIntentosJuego.reduce((a, b) => a + b.porcentaje, 0) / todosIntentosJuego.length;
    juego.estadisticas.tasaLogro = Math.round(avgScore * 100);

    // Actualizar estado del alumno
    alumno.intentosTotal += 1;
    const intentosAlumno = estado.historial.filter((h) => h.alumnoId === datos.alumnoId);
    const avgAlumno = Math.round((intentosAlumno.reduce((a, b) => a + b.porcentaje, 0) / intentosAlumno.length) * 100);
    alumno.promedioAciertos = avgAlumno;
    alumno.ultimoAcceso = "Hace un momento";
    alumno.estado = avgAlumno >= 85 ? "destacado" : avgAlumno < 60 ? "en_riesgo" : "activo";

    guardarEstado(estado);
  },

  restablecerDatos() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CLAVE_STORAGE);
    }
  }
};
