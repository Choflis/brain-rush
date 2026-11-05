/**
 * Eventos del motor de juego y emisor tipado sin red ni efectos secundarios.
 * Especificación: docs/especificacion/08-contrato.md (Sección 7: Eventos del motor).
 */

export interface EventoInicio {
  tipo: "inicio";
  juegoId: string;
  versionId: string;
  mecanica: "tienda" | "carrera";
  alumnoId?: string;
  salaId?: string;
  iniciadoEn: string; // ISO
}

export interface EventoRespuesta {
  tipo: "respuesta";
  itemId: string;
  criterio: string;
  correcto: boolean;
  tiempoMs: number;
  intentos: number; // 1 en el primer intento del ítem
}

export interface EventoFin {
  tipo: "fin";
  aciertos: number;
  total: number;
  duracionMs: number;
  completado: boolean;
}

export type EventoMotor = EventoInicio | EventoRespuesta | EventoFin;

export type SuscriptorEventoMotor = (evento: EventoMotor) => void;
export type Desuscribir = () => void;

/**
 * Emisor síncrono tipado para los eventos del motor.
 * No realiza llamadas a la red, fetch, ni accede a almacenamiento persistente.
 */
export class EmisorEventosMotor {
  private suscriptores: Set<SuscriptorEventoMotor> = new Set();

  /**
   * Registra un callback que recibirá cada evento emitido.
   * Retorna una función para cancelar la suscripción.
   */
  suscribir(suscriptor: SuscriptorEventoMotor): Desuscribir {
    this.suscriptores.add(suscriptor);
    return () => {
      this.desuscribir(suscriptor);
    };
  }

  /**
   * Desregistra un suscriptor previamente registrado.
   */
  desuscribir(suscriptor: SuscriptorEventoMotor): void {
    this.suscriptores.delete(suscriptor);
  }

  /**
   * Emite un EventoMotor a todos los suscriptores activos.
   */
  emitir(evento: EventoMotor): void {
    const lista = Array.from(this.suscriptores);
    for (const suscriptor of lista) {
      suscriptor(evento);
    }
  }

  /**
   * Cantidad actual de suscriptores registrados.
   */
  get cantidadSuscriptores(): number {
    return this.suscriptores.size;
  }

  /**
   * Remueve todos los suscriptores activos.
   */
  limpiar(): void {
    this.suscriptores.clear();
  }
}

/**
 * Fábrica para instanciar un nuevo emisor de eventos.
 */
export function crearEmisorEventos(): EmisorEventosMotor {
  return new EmisorEventosMotor();
}

/**
 * Instancia compartida por defecto del emisor.
 */
export const emisor = new EmisorEventosMotor();
