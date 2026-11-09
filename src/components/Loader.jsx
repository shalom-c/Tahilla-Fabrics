import "./Loader.css";

export default function Loader({ size = "lg", label = "Tehilla Fabrics", fadeOut = false }) {
  const isSmall = size === "sm";

  return (
    <div className={`loader ${isSmall ? "loader-small" : `loader-screen${fadeOut ? " loader-screen-exit" : ""}`}`} role="status" aria-live="polite">
      <span className="loader-visually-hidden">Loading</span>
      <div className="loader-content" aria-hidden="true">
        <div className="loader-orbit">
          <svg className="loader-circle" viewBox="0 0 100 100" focusable="false">
            <circle className="loader-circle-track" cx="50" cy="50" r="44" />
            <circle className="loader-circle-arc" cx="50" cy="50" r="44" />
          </svg>
          <span className="loader-letter">T</span>
          {!isSmall && <span className="loader-thread" />}
        </div>
        {!isSmall && <span className="loader-caption">{label}</span>}
      </div>
    </div>
  );
}
