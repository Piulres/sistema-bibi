import { describe, expect, it } from "vitest";
import {
  getNextRovingIndex,
  resolveRovingKey,
} from "@/lib/a11y/focus";

describe("Roving tabindex — navegação por setas em tablists e menus", () => {
  it("cicla o índice nas bordas para manter o foco dentro do grupo", () => {
    expect(getNextRovingIndex(0, -1, 3)).toBe(2);
    expect(getNextRovingIndex(2, 1, 3)).toBe(0);
    expect(getNextRovingIndex(1, 1, 3)).toBe(2);
  });

  it("resolve ArrowLeft/ArrowRight em orientação horizontal (padrão de abas)", () => {
    expect(resolveRovingKey("ArrowRight", 0, 4, "horizontal")).toEqual({
      type: "move",
      index: 1,
    });
    expect(resolveRovingKey("ArrowLeft", 0, 4, "horizontal")).toEqual({
      type: "move",
      index: 3,
    });
  });

  it("resolve ArrowUp/ArrowDown em orientação vertical (menus Mais / calendário)", () => {
    expect(resolveRovingKey("ArrowDown", 1, 3, "vertical")).toEqual({
      type: "move",
      index: 2,
    });
    expect(resolveRovingKey("ArrowUp", 0, 3, "vertical")).toEqual({
      type: "move",
      index: 2,
    });
  });

  it("Home e End saltam para extremos — atalho WCAG em tablists longas", () => {
    expect(resolveRovingKey("Home", 2, 5)).toEqual({ type: "home", index: 0 });
    expect(resolveRovingKey("End", 0, 5)).toEqual({ type: "end", index: 4 });
  });

  it("ignora teclas irrelevantes para não capturar Tab/Enter do browser", () => {
    expect(resolveRovingKey("Tab", 0, 3)).toEqual({ type: "none" });
    expect(resolveRovingKey("Enter", 1, 3)).toEqual({ type: "none" });
  });
});
