import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash, Download } from "lucide-react";
import { generatePDFReport } from "@/lib/reportGenerator";

type KpiDef = {
  id: string;
  name: string;
  metaG2: number;
  metaG6: number;
  group: "offensive" | "defensive" | "general";
  better: "higher" | "lower";
};

const KPI_DEFS: KpiDef[] = [
   // Offensive
  { id: "pontos", name: "Pontos", metaG2: 65, metaG6: 61, group: "offensive", better: "higher" },
  { id: "media_gols", name: "Média de Gols", metaG2: 1.23, metaG6: 1.24, group: "offensive", better: "higher" },
  { id: "xg", name: "XG (Expected Goals)", metaG2: 1.30, metaG6: 1.33, group: "offensive", better: "higher" },
  { id: "diferencial_gols", name: "Diferencial de Gols (Gols - xG)", metaG2: 0.10, metaG6: 0.05, group: "offensive", better: "higher" },
  { id: "posse", name: "Posse %", metaG2: 51, metaG6: 50, group: "offensive", better: "higher" },
  { id: "pct_jogos_marcou", name: "% de jogos que marcou", metaG2: 76, metaG6: 72, group: "offensive", better: "higher" },
  { id: "finalizacoes", name: "Finalização/90min", metaG2: 12, metaG6: 12, group: "offensive", better: "higher" },
  { id: "pct_final_certa", name: "% Finalização Certa/90min", metaG2: 35, metaG6: 33, group: "offensive", better: "higher" },
  { id: "final_dentro", name: "Finalização de Dentro da área/90min", metaG2: 8, metaG6: 6.2, group: "offensive", better: "higher" },

  // Defensive
  { id: "media_gols_sofridos", name: "Média de Gols Sofridos", metaG2: 0.88, metaG6: 0.92, group: "defensive", better: "lower" },
  { id: "xg_contra", name: "XG Contra", metaG2: 0.97, metaG6: 1.10, group: "defensive", better: "lower" },
  { id: "posse_contra", name: "Posse Contra", metaG2: 49, metaG6: 50, group: "defensive", better: "lower" },
  { id: "pct_nao_sofreu", name: "% de jogos que não sofreu gols", metaG2: 45, metaG6: 38, group: "defensive", better: "higher" },
  { id: "final_sofrida", name: "Finalização Sofrida/90min", metaG2: 11, metaG6: 12, group: "defensive", better: "lower" },
  { id: "pct_final_certa_sofrida", name: "% Finalização CertaSofrida/90min", metaG2: 32, metaG6: 31, group: "defensive", better: "lower" },
  { id: "final_dentro_sofrida", name: "Finalização de Dentro da área Sofrida/90min", metaG2: 6, metaG6: 6, group: "defensive", better: "lower" },
];

type RoundKey = string; // e.g., 'fec_media', 'r1', 'r2'

export default function Dashboard() {
  // columns: fixed metas and dynamic rounds; 'fec_media' is a special column
  const [rounds, setRounds] = useState<RoundKey[]>(() => {
    const stored = localStorage.getItem("kpi_rounds");
    return stored ? JSON.parse(stored) : ["fec_media"];
  });

  // values: mapping kpiId -> roundKey -> number | null
  const [values, setValues] = useState<Record<string, Record<RoundKey, number | null>>>(() => {
    const stored = localStorage.getItem("kpi_values");
    if (stored) return JSON.parse(stored);
    const initial: Record<string, Record<RoundKey, number | null>> = {};
    KPI_DEFS.forEach((k) => {
      initial[k.id] = { fec_media: null };
    });
    return initial;
  });

  useEffect(() => {
    localStorage.setItem("kpi_rounds", JSON.stringify(rounds));
  }, [rounds]);

  useEffect(() => {
    localStorage.setItem("kpi_values", JSON.stringify(values));
  }, [values]);

  // Listen for external updates (e.g., Partidas page) and reload rounds/values
  useEffect(() => {
    const handler = () => {
      try {
        const storedRounds = localStorage.getItem("kpi_rounds");
        const parsedRounds = storedRounds ? JSON.parse(storedRounds) : ["fec_media"];
        setRounds(parsedRounds);
        const storedValues = localStorage.getItem("kpi_values");
        if (storedValues) {
          setValues(JSON.parse(storedValues));
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("kpi-updated", handler);
    return () => window.removeEventListener("kpi-updated", handler);
  }, []);

  const addRound = () => {
    const next = `r${rounds.length}`;
    setRounds((r) => [...r, next]);
    setValues((prev) => {
      const copy = { ...prev };
      KPI_DEFS.forEach((k) => {
        copy[k.id] = { ...(copy[k.id] || {}), [next]: null };
      });
      return copy;
    });
  };

  const removeRound = (key: RoundKey) => {
    if (key === "fec_media") return;
    setRounds((r) => r.filter((c) => c !== key));
    setValues((prev) => {
      const copy: typeof prev = {};
      Object.keys(prev).forEach((k) => {
        const row = { ...prev[k] };
        delete row[key];
        copy[k] = row;
      });
      return copy;
    });
  };

  const setCell = (kpiId: string, col: RoundKey, v: number | null) => {
    setValues((prev) => ({ ...prev, [kpiId]: { ...(prev[kpiId] || {}), [col]: v } }));
  };

  const kpiAverage = (kpiId: string) => {
    // average across rounds excluding fec_media; if fec_media exists use it as initial average
    const row = values[kpiId] || {};
    const numeric: number[] = [];
    rounds.forEach((c) => {
      const val = row[c];
      if (val != null) numeric.push(val);
    });
    if (numeric.length === 0) return null;
    return numeric.reduce((a, b) => a + b, 0) / numeric.length;
  };

  const groups = useMemo(() => {
    return {
      offensive: KPI_DEFS.filter((k) => k.group === "offensive"),
      defensive: KPI_DEFS.filter((k) => k.group === "defensive"),
      general: KPI_DEFS.filter((k) => k.group === "general"),
    };
  }, []);

const getStatusColor = (
  value: number | null,
  metaG2: number,
  metaG6: number,
  better: "higher" | "lower"
) => {

  if (value === null) return "bg-transparent";

  // quando MAIOR é melhor
  if (better === "higher") {
    if (value >= metaG2) return "bg-green-200 border-green-400";
    if (value >= metaG6) return "bg-yellow-200 border-yellow-400";
    return "bg-yellow-100 border-yellow-300";
  }

  // quando MENOR é melhor
  if (better === "lower") {
    if (value <= metaG2) return "bg-green-200 border-green-400";
    if (value <= metaG6) return "bg-yellow-200 border-yellow-400";
    return "bg-yellow-100 border-yellow-300";
  }

};

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard KPIs</h1>
          <p className="text-muted-foreground">Edite valores por rodada — as metas (G2/G6) são fixas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => generatePDFReport({ rounds, values, seasonYear: 2026 })} 
            variant="default" 
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
          <Button onClick={addRound} variant="outline" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Adicionar Rodada
          </Button>
        </div>
      </div>

      {/* Offensive table */}
      <Card>
        <CardHeader>
          <CardTitle>KPIs Ofensivos</CardTitle>
          <CardDescription>Metas G2 e G6 fixas — preencha as colunas por rodada</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Métrica</TableHead>
                <TableHead className="text-center">Meta G2</TableHead>
                <TableHead className="text-center">Meta G6</TableHead>
                {rounds.map((c) => (
                  <TableHead key={c} className="text-center">
                    {c === "fec_media" ? "FEC MÉDIA" : c.toUpperCase()}
                    {c !== "fec_media" && (
                      <button title="Remover rodada" className="ml-2 text-red-500" onClick={() => removeRound(c)}>
                        <Trash className="inline w-3 h-3" />
                      </button>
                    )}
                  </TableHead>
                ))}
                <TableHead className="text-center">Média (rodadas)</TableHead>
                <TableHead className="text-center">G2%</TableHead>
                <TableHead className="text-center">G6%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.offensive.map((k) => {
                const avg = kpiAverage(k.id);
                const meetsG2 = avg != null ? avg >= k.metaG2 : false;
                const meetsG6 = avg != null ? avg >= k.metaG6 : false;
                const isPercent = /%|posse|pct/.test(k.name.toLowerCase());
                return (
                  <TableRow key={k.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="text-center font-semibold">{k.metaG2}</TableCell>
                    <TableCell className="text-center font-semibold">{k.metaG6}</TableCell>
                    {rounds.map((c) => (
                      <TableCell key={c} className="text-center p-1">
                        <div className="relative flex justify-center">
                          <input
                            inputMode="numeric"
                            value={values[k.id]?.[c] ?? ""}
                            onChange={(e) => setCell(k.id, c, e.target.value === "" ? null : Number(e.target.value))}
                            className={`w-24 h-8 px-2 pr-6 text-right border rounded focus:outline-none focus:ring-2 focus:ring-input ${getStatusColor(values[k.id]?.[c] ?? null, k.metaG2, k.metaG6, k.better)}`}
                            placeholder="-"
                            step={isPercent ? "0.1" : "0.01"}
                            type="number"
                          />

                          {isPercent && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              %
                            </span>
                          )}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold">{avg == null ? "-" : Number(avg.toFixed(2))}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={meetsG2 ? "success" : "warning"} className="text-xs">
                        {avg == null ? "-" : `${Math.round((avg / k.metaG2) * 100)}%`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={meetsG6 ? "success" : "warning"} className="text-xs">
                        {avg == null ? "-" : `${Math.round((avg / k.metaG6) * 100)}%`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Defensive table */}
      <Card>
        <CardHeader>
          <CardTitle>KPIs Defensivos</CardTitle>
          <CardDescription>Metas G2 e G6 fixas — preencha as colunas por rodada</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Métrica</TableHead>
                <TableHead className="text-center">Meta G2</TableHead>
                <TableHead className="text-center">Meta G6</TableHead>
                {rounds.map((c) => (
                  <TableHead key={c} className="text-center">
                    {c === "fec_media" ? "FEC MÉDIA" : c.toUpperCase()}
                    {c !== "fec_media" && (
                      <button title="Remover rodada" className="ml-2 text-red-500" onClick={() => removeRound(c)}>
                        <Trash className="inline w-3 h-3" />
                      </button>
                    )}
                  </TableHead>
                ))}
                <TableHead className="text-center">Média (rodadas)</TableHead>
                <TableHead className="text-center">G2%</TableHead>
                <TableHead className="text-center">G6%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.defensive.map((k) => {
                const avg = kpiAverage(k.id);
                const meetsG2 = avg != null ? avg >= k.metaG2 : false;
                const meetsG6 = avg != null ? avg >= k.metaG6 : false;
                const isPercent = /%|posse|pct/.test(k.name.toLowerCase());
                return (
                  <TableRow key={k.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="text-center font-semibold">{k.metaG2}</TableCell>
                    <TableCell className="text-center font-semibold">{k.metaG6}</TableCell>
                    {rounds.map((c) => (
                      <TableCell key={c} className="text-center p-1">
                        <div className="relative flex justify-center">
                          <input
                            inputMode="numeric"
                            value={values[k.id]?.[c] ?? ""}
                            onChange={(e) => setCell(k.id, c, e.target.value === "" ? null : Number(e.target.value))}
                            className={`w-24 h-8 px-2 pr-6 text-right border rounded focus:outline-none focus:ring-2 focus:ring-input ${getStatusColor(values[k.id]?.[c] ?? null, k.metaG2, k.metaG6, k.better)}`}
                            placeholder="-"
                            step={isPercent ? "0.1" : "0.01"}
                            type="number"
                          />

                          {isPercent && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              %
                            </span>
                          )}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold">{avg == null ? "-" : Number(avg.toFixed(2))}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={meetsG2 ? "success" : "warning"} className="text-xs">
                        {avg == null ? "-" : `${Math.round((avg / k.metaG2) * 100)}%`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={meetsG6 ? "success" : "warning"} className="text-xs">
                        {avg == null ? "-" : `${Math.round((avg / k.metaG6) * 100)}%`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
