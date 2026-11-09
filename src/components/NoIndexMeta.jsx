import { useEffect } from "react";

export default function NoIndexMeta() {
  useEffect(() => {
    const existingMeta = document.querySelector('meta[name="robots"]');
    const previousContent = existingMeta?.getAttribute("content");
    const meta = existingMeta || document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    if (!existingMeta) document.head.append(meta);

    return () => {
      if (existingMeta) {
        if (previousContent === null) existingMeta.removeAttribute("content");
        else existingMeta.content = previousContent;
      } else {
        meta.remove();
      }
    };
  }, []);

  return null;
}
