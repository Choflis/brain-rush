-- Esquema inicial de BRAIN RUSH para D1 (SQLite).
-- Ver docs/especificacion/03-arquitectura-tecnica.md (modelo de datos)
-- y docs/especificacion/08-contrato.md (formas de la API).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'piloto',
  creditos_saldo INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id),
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'docente', 'alumno')),
  nombre TEXT NOT NULL,
  correo TEXT,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id),
  titulo TEXT NOT NULL,
  area TEXT NOT NULL,
  grado INTEGER NOT NULL,
  competencia TEXT NOT NULL,
  capacidad TEXT,
  desempenos TEXT NOT NULL DEFAULT '[]',
  criterios TEXT NOT NULL,
  instrumento TEXT,
  proposito TEXT,
  momentos TEXT NOT NULL DEFAULT '{}',
  materiales TEXT NOT NULL DEFAULT '[]',
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('activacion', 'complemento')),
  mecanica TEXT NOT NULL CHECK (mecanica IN ('tienda', 'carrera')),
  nivel TEXT NOT NULL CHECK (nivel IN ('N1', 'N2', 'N3')),
  grados TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado')),
  version_actual INTEGER NOT NULL DEFAULT 1,
  codigo TEXT NOT NULL UNIQUE,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_versions (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  spec TEXT NOT NULL,
  origen_generacion TEXT NOT NULL DEFAULT '{}',
  publicada INTEGER NOT NULL DEFAULT 0,
  publicada_en TEXT,
  creada_en TEXT NOT NULL,
  UNIQUE (game_id, numero)
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  version_id TEXT NOT NULL REFERENCES game_versions(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  fuente TEXT NOT NULL CHECK (fuente IN ('digital', 'papel', 'sala')),
  iniciado_en TEXT NOT NULL,
  duracion_ms INTEGER NOT NULL,
  aciertos INTEGER NOT NULL,
  total INTEGER NOT NULL,
  minimo_logro REAL NOT NULL,
  logrado INTEGER NOT NULL,
  clave_idempotencia TEXT UNIQUE,
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attempts_game ON attempts (game_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts (student_id);

CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  criterio TEXT NOT NULL,
  correcto INTEGER NOT NULL,
  tiempo_ms INTEGER NOT NULL,
  intentos INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt ON answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_criterio ON answers (criterio);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  game_id TEXT NOT NULL REFERENCES games(id),
  version_id TEXT NOT NULL REFERENCES game_versions(id),
  estado TEXT NOT NULL DEFAULT 'esperando' CHECK (estado IN ('esperando', 'jugando', 'pausada', 'terminada')),
  ronda INTEGER NOT NULL DEFAULT 1,
  total_rondas INTEGER NOT NULL,
  progreso INTEGER NOT NULL DEFAULT 0,
  meta_objetivo INTEGER,
  max_alumnos INTEGER NOT NULL DEFAULT 40,
  seq INTEGER NOT NULL DEFAULT 0,
  creada_en TEXT NOT NULL,
  cerrada_en TEXT
);

CREATE TABLE IF NOT EXISTS room_participants (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id),
  nombre TEXT NOT NULL,
  creado_en TEXT NOT NULL,
  UNIQUE (room_id, student_id)
);

CREATE TABLE IF NOT EXISTS room_answers (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id),
  item_id TEXT NOT NULL,
  criterio TEXT NOT NULL,
  correcto INTEGER NOT NULL,
  tiempo_ms INTEGER NOT NULL,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS room_events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('union', 'acierto', 'meta', 'ronda', 'fin')),
  item_id TEXT,
  actual INTEGER,
  objetivo INTEGER,
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_room_events_room ON room_events (room_id, seq);
