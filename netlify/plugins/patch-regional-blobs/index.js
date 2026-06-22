import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Desativa Blobs regionais no handler Next.js (evita crash sem primaryRegion). */
export const onEnd = async () => {
  const handlerPath = join(
    ".netlify/functions-internal/___netlify-server-handler/___netlify-server-handler.mjs",
  );
  if (!existsSync(handlerPath)) return;

  const content = readFileSync(handlerPath, "utf8");
  const patched = content.replace(
    "process.env.USE_REGIONAL_BLOBS = 'true'",
    "process.env.USE_REGIONAL_BLOBS = 'false'",
  );
  if (patched !== content) {
    writeFileSync(handlerPath, patched);
  }
};
