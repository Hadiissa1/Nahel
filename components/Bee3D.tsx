/** A small bee built from shaded CSS shapes in 3D space (styles: globals.css, ".bee3d"). */
export function Bee3D({ className = "" }: { className?: string }) {
  return (
    <span className={`bee3d ${className}`} aria-hidden="true">
      <span className="bee3d-model">
        <span className="bee3d-wing bee3d-wing-far" />
        <span className="bee3d-sting" />
        <span className="bee3d-abdomen" />
        <span className="bee3d-thorax" />
        <span className="bee3d-head">
          <span className="bee3d-eye" />
          <span className="bee3d-antenna" />
          <span className="bee3d-antenna bee3d-antenna-2" />
        </span>
        <span className="bee3d-wing bee3d-wing-near" />
      </span>
    </span>
  );
}
