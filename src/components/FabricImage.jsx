import { useEffect, useState } from "react";

export default function FabricImage({ src, alt, width, height, className = "" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`${className} fabric-image-fallback`}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      width={width}
      height={height}
      onError={() => setFailed(true)}
    />
  );
}
