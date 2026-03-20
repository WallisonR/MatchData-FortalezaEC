import { describe, expect, it } from "vitest";

import {
  resolvePctJogosMarcou,
  resolvePctNaoSofreu,
} from "../client/src/lib/matchKpis";

describe("match KPI auto-calculation", () => {
  it("auto-generates '% de jogos que marcou' from goals scored", () => {
    expect(resolvePctJogosMarcou(2)).toBe(100);
    expect(resolvePctJogosMarcou(0)).toBe(0);
  });

  it("keeps a manually provided '% de jogos que marcou' value", () => {
    expect(resolvePctJogosMarcou(2, 76)).toBe(76);
  });

  it("auto-generates '% de jogos que não sofreu gols' from goals conceded", () => {
    expect(resolvePctNaoSofreu(0)).toBe(100);
    expect(resolvePctNaoSofreu(1)).toBe(0);
  });

  it("keeps a manually provided '% de jogos que não sofreu gols' value", () => {
    expect(resolvePctNaoSofreu(0, 45)).toBe(45);
  });
});
