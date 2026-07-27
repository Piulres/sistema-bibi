import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("PWA service worker shell", () => {
  it("precaches instalar and icons so offline install guide keeps working", () => {
    const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    expect(sw).toContain("/instalar");
    expect(sw).toContain("/manifest.webmanifest");
    expect(sw).toContain("/icons/icon-512.png");
  });
});

describe("Capacitor mobile config", () => {
  it("points server.url to production so native shell loads deployed PWA", () => {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), "mobile/capacitor.config.json"), "utf8"),
    );
    expect(config.appId).toBe("br.com.sistemabibi.serviceos");
    expect(config.server.url).toMatch(/^https:\/\//);
    expect(config.webDir).toBe("www");
  });
});
