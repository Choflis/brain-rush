interface Props {
  tamano?: number;
  pensando?: boolean;
  className?: string;
  conBurbujaEstado?: boolean;
  textoEstado?: string;
}

export function AvatarReglita({
  tamano = 44,
  pensando = false,
  className = "",
  conBurbujaEstado = false,
  textoEstado,
}: Props) {
  return (
    <div
      className={`avatar-reglita-contenedor ${pensando ? "reglita-pensando" : ""} ${className}`}
      style={{ width: `${tamano}px`, height: `${tamano}px` }}
      title="Reglita · Tu copiloto pedagógica"
    >
      <img
        src="/juego/tiendita/mascota.png"
        alt="Reglita, mascota y agente de ayuda para docentes"
        className="avatar-reglita-img"
        width={tamano}
        height={tamano}
        loading="eager"
      />
      {conBurbujaEstado && (
        <span
          className={`punto-estado-reglita ${pensando ? "punto-pensando" : "punto-online"}`}
          title={textoEstado || (pensando ? "Reglita está pensando..." : "Reglita disponible")}
        />
      )}
    </div>
  );
}
