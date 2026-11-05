import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { aulaVirtual, type Estudiante } from '../datos/aulaVirtual';
import { useSesion } from '../sesion';
import { ReglitaInteractiva } from '../componentes/ReglitaInteractiva';
import { AvatarExplorador, InsigniaSalon, TrazoEstrella } from '../componentes/IlustracionesInfantiles';
import { IconoAnimado } from '../componentes/IconoAnimado';

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');

export function AccesoEstudiante({ alCambiarRol }: { alCambiarRol: () => void }) {
  const { iniciarAlumno } = useSesion();
  const navegar = useNavigate();
  const [clases] = useState(() => aulaVirtual.obtenerClases());
  const [claseId, setClaseId] = useState(clases[0]?.id ?? '');
  const [nombre, setNombre] = useState('');
  const [leyendo, setLeyendo] = useState(false);
  const [posicion, setPosicion] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const clase = clases.find(c => c.id === claseId);
  const estudiantes = aulaVirtual.obtenerEstudiantesPorClase(claseId);
  const limpio = nombre.trim().replace(/\s+/g, ' ');
  const coincidencias = estudiantes.filter(e => normalizar(`${e.nombre} ${e.apellidos}`).includes(normalizar(limpio)));
  const conocido = estudiantes.find(e => normalizar(e.nombre) === normalizar(limpio) || normalizar(`${e.nombre} ${e.apellidos}`) === normalizar(limpio));

  function entrar(estudiante?: Estudiante) {
    if (estudiante) iniciarAlumno(`token-${estudiante.id}`, `${estudiante.nombre} ${estudiante.apellidos}`, estudiante.id, claseId);
    else iniciarAlumno(`token-invitado-${Date.now()}`, limpio || 'Estudiante Invitado', undefined, claseId);
    navegar('/estudiante', { replace: true });
  }
  function enviar(event: FormEvent) {
    event.preventDefault();
    if (limpio) entrar(conocido);
    else campo.current?.focus();
  }
  const mensaje = limpio
    ? `¡Hola, ${limpio}! ${conocido ? 'Encontré tu tarjeta. ¡Vamos a jugar!' : 'Tu aventura está por comenzar.'}`
    : leyendo ? 'Te estoy leyendo… ¿cómo te llamas?' : '¡Hola! Soy Reglita. ¿Descubrimos algo juntos?';

  return (
    <div className="login-alumno">
      <div className="acceso-aventura">
        <aside className={`acceso-companera ${leyendo ? 'companera-leyendo' : ''}`} aria-label="Reglita te da la bienvenida">
          <span className="acceso-insignia"><TrazoEstrella /> Aquí empieza tu aventura</span>
          <h1>Tu imaginación<br />{' '}tiene <span>superpoderes.</span></h1>
          <p className="acceso-descripcion">Y aprender es uno de ellos.<br />Prepara tus ideas. ¡Vamos a jugar!</p>
          <div className="acceso-escenario">
            <div className="acceso-escenario-arco" aria-hidden="true" />
            <span className="acceso-nota acceso-nota-numeros" aria-hidden="true">a b c</span>
            <span className="acceso-nota acceso-nota-lapiz" aria-hidden="true"><svg viewBox="0 0 60 60" fill="none"><path d="M15 40L38 10L49 19L26 49L11 53Z" fill="#efb74f" stroke="#98672e" strokeWidth="2" strokeLinejoin="round" /><path d="M15 40L26 49L11 53Z" fill="#fff6dd" /><path d="M38 10L42 5Q44 3 47 6L52 10Q55 13 52 16L49 19Z" fill="#e18e70" /></svg></span>
            <ReglitaInteractiva compacta leyendo={leyendo} posicionLectura={posicion} />
            <span className="acceso-sombra" aria-hidden="true" />
          </div>
          <p className="login-mensaje-reglita" role="status" aria-live="polite" aria-atomic="true">{mensaje}</p>
          <span className="acceso-pista">Prueba a escribir. Reglita está mirando.</span>
        </aside>

        <section className="acceso-cuaderno" aria-labelledby="acceso-titulo">
          <div className="cuaderno-anillas" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="acceso-roles" role="group" aria-label="Tipo de acceso"><span className="acceso-rol-elegido"><IconoAnimado tipo="estudiante" tamano={22} animarAlHover /> Estudiante</span><button type="button" onClick={alCambiarRol}>Soy docente <span aria-hidden="true">→</span></button></div>
          <p className="mini-etiqueta">Un pasito antes de jugar</p>
          <h2 id="acceso-titulo">¡Qué bueno verte!</h2>
          <p className="acceso-indicacion">Elige tu salón y cuéntanos cómo te llamas.</p>

          <fieldset className="acceso-salones"><legend><span className="paso-cuaderno">1</span> ¿Cuál es tu salón?</legend>
            <div className="acceso-salones-grid">{clases.map(c => <button key={c.id} type="button" className={`acceso-salon ${claseId === c.id ? 'seleccionado' : ''}`} aria-label={`Elegir salón de ${c.grado}.º de primaria`} aria-pressed={claseId === c.id} onClick={() => setClaseId(c.id)}><InsigniaSalon grado={c.grado} tamano={48} /><strong>{c.grado}.º <span>de primaria</span></strong><span className="acceso-salon-check" aria-hidden="true">{claseId === c.id ? '✓' : ''}</span></button>)}</div>
          </fieldset>

          <form className="acceso-nombre" onSubmit={enviar}>
            <label htmlFor="nombre-explorador"><span className="paso-cuaderno">2</span> ¿Cómo te llamas?</label>
            <div className={`acceso-campo ${leyendo ? 'campo-leyendo' : ''}`}><span className="acceso-observadora-movil"><ReglitaInteractiva compacta interactiva={false} leyendo={leyendo} posicionLectura={posicion} /></span><AvatarExplorador semilla={limpio || 'explorador'} tamano={42} /><input id="nombre-explorador" ref={campo} aria-label="Tu nombre" aria-describedby="ayuda-nombre-explorador" placeholder="Escribe tu nombre aquí…" type="text" autoComplete="given-name" maxLength={40} value={nombre}
              onFocus={e => { setLeyendo(true); setPosicion(e.currentTarget.selectionStart ?? nombre.length); }} onBlur={() => setLeyendo(false)}
              onSelect={e => setPosicion(e.currentTarget.selectionStart ?? nombre.length)}
              onChange={e => { setNombre(e.target.value); setPosicion(e.target.selectionStart ?? e.target.value.length); }} /></div>
            <span id="ayuda-nombre-explorador" className="acceso-ayuda">{limpio ? conocido ? 'Esta es tu tarjeta. También puedes tocarla para entrar.' : 'Puedes entrar con este nombre como invitado.' : 'Si ves tu tarjeta abajo, también puedes tocarla.'}</span>
            <div className="acceso-tarjetas" aria-label="Estudiantes del salón">
              {coincidencias.map(e => <button key={e.id} className="acceso-tarjeta-alumno" type="button" aria-label={`Entrar como ${e.nombre}`} onClick={() => entrar(e)}><AvatarExplorador semilla={e.id} tamano={40} /><span>{e.nombre}</span><span className="tarjeta-flechita" aria-hidden="true">→</span></button>)}
              {coincidencias.length === 0 && <p className="acceso-nombre-nuevo"><TrazoEstrella /> ¡Hay un lugar para ti en {clase?.grado}.º! Entra como invitado con tu nombre.</p>}
            </div>
            <button type="submit" disabled={!limpio} className="boton acceso-boton-jugar"><IconoAnimado tipo="rayo" tamano={24} color="#fffdf4" animarAlHover /> ¡Entrar a jugar! <span aria-hidden="true">→</span></button>
          </form>
          <div className="acceso-alternativas"><button type="button" onClick={() => entrar()}>Entrar como Estudiante Invitado</button><Link to="/estudiante">Solo quiero explorar <span aria-hidden="true">→</span></Link></div>
        </section>
      </div>
      <div className="acceso-pie"><TrazoEstrella /><span>Aquí cada intento cuenta. Aprende a tu ritmo.</span><TrazoEstrella /></div>
    </div>
  );
}
