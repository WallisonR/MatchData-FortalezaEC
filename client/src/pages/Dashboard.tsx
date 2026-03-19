import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash, FileDown } from "lucide-react";
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
  {
    id: "media_gols",
    name: "Média de Gols",
    metaG2: 1.23,
    metaG6: 1.24,
    group: "offensive",
    better: "higher",
  },
  {
    id: "xg",
    name: "XG (Expected Goals)",
    metaG2: 1.3,
    metaG6: 1.33,
    group: "offensive",
    better: "higher",
  },
  {
    id: "posse",
    name: "Posse %",
    metaG2: 51,
    metaG6: 50,
    group: "offensive",
    better: "higher",
  },
  {
    id: "pct_jogos_marcou",
    name: "% de jogos que marcou",
    metaG2: 76,
    metaG6: 72,
    group: "offensive",
    better: "higher",
  },
  {
    id: "finalizacoes",
    name: "Finalização/90min",
    metaG2: 12,
    metaG6: 12,
    group: "offensive",
    better: "higher",
  },
  {
    id: "pct_final_certa",
    name: "% Finalização Certa/90min",
    metaG2: 35,
    metaG6: 33,
    group: "offensive",
    better: "higher",
  },
  {
    id: "final_dentro",
    name: "Finalização de Dentro da área/90min",
    metaG2: 8,
    metaG6: 6.2,
    group: "offensive",
    better: "higher",
  },
  {
    id: "pct_cruzamentos_acerto",
    name: "Cruzamentos % Acerto",
    metaG2: 34,
    metaG6: 35,
    group: "offensive",
    better: "higher",
  },
  {
    id: "entradas_area_90",
    name: "Entradas da Área /90min",
    metaG2: 22,
    metaG6: 21,
    group: "offensive",
    better: "higher",
  },
  {
    id: "toques_area_90",
    name: "Toques na Área /90min",
    metaG2: 15,
    metaG6: 15,
    group: "offensive",
    better: "higher",
  },

  {
    id: "media_gols_sofridos",
    name: "Média de Gols Sofridos",
    metaG2: 0.88,
    metaG6: 0.92,
    group: "defensive",
    better: "lower",
  },
  {
    id: "xg_contra",
    name: "XG Contra",
    metaG2: 0.97,
    metaG6: 1.1,
    group: "defensive",
    better: "lower",
  },
  {
    id: "posse_contra",
    name: "Posse Contra",
    metaG2: 49,
    metaG6: 50,
    group: "defensive",
    better: "lower",
  },
  {
    id: "pct_nao_sofreu",
    name: "% de jogos que não sofreu gols",
    metaG2: 45,
    metaG6: 38,
    group: "defensive",
    better: "higher",
  },
  {
    id: "final_sofrida",
    name: "Finalização Sofrida/90min",
    metaG2: 11,
    metaG6: 12,
    group: "defensive",
    better: "lower",
  },
  {
    id: "pct_final_certa_sofrida",
    name: "% Finalização CertaSofrida/90min",
    metaG2: 32,
    metaG6: 31,
    group: "defensive",
    better: "lower",
  },
  {
    id: "final_dentro_sofrida",
    name: "Finalização de Dentro da área Sofrida/90min",
    metaG2: 6,
    metaG6: 6,
    group: "defensive",
    better: "lower",
  },
  {
    id: "pct_cruzamentos_acerto_sofridos",
    name: "Cruzamentos % Acerto Sofridos",
    metaG2: 31,
    metaG6: 34,
    group: "defensive",
    better: "lower",
  },
  {
    id: "entradas_area_sofrida_90",
    name: "Entradas da Área Sofrida /90min",
    metaG2: 19,
    metaG6: 18,
    group: "defensive",
    better: "lower",
  },
  {
    id: "toques_area_sofridos_90",
    name: "Toques na Área Sofridos /90min",
    metaG2: 12,
    metaG6: 13,
    group: "defensive",
    better: "lower",
  },
  {
    id: "intensidade_jogo",
    name: "Intensidade de Jogo",
    metaG2: 16,
    metaG6: 15,
    group: "general",
    better: "higher",
  },
  {
    id: "duelos_ofensivos_pct",
    name: "% Duelos Ofensivos",
    metaG2: 41,
    metaG6: 42,
    group: "general",
    better: "higher",
  },
  {
    id: "duelos_defensivos_pct",
    name: "% Duelos Defensivos",
    metaG2: 61,
    metaG6: 59,
    group: "general",
    better: "higher",
  },
  {
    id: "duelos_aereos_pct",
    name: "% Duelos Aéreos",
    metaG2: 47,
    metaG6: 46,
    group: "general",
    better: "higher",
  },
  {
    id: "recuperacoes_altas_medias",
    name: "Recuperações Altas/Médias",
    metaG2: 44,
    metaG6: 42,
    group: "general",
    better: "higher",
  },
  {
    id: "ppda",
    name: "PPDA",
    metaG2: 10,
    metaG6: 10,
    group: "general",
    better: "higher",
  },
  {
    id: "media_passes_jogo",
    name: "Média de Passes/ por jogo",
    metaG2: 395,
    metaG6: 374,
    group: "general",
    better: "higher",
  },
  {
    id: "acerto_passes_pct",
    name: "% Acerto de Passes",
    metaG2: 83,
    metaG6: 82,
    group: "general",
    better: "higher",
  },
];

type RoundKey = string;

const OFFENSIVE_GOALS = {
  g2Points: 65,
  g2Wins: 18,
  g2Pct: 57,
  g6Points: 61,
  g6Wins: 17,
  g6Pct: 53,
} as const;

const readJsonStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const getStorageKey = (competition: string, suffix: string) =>
  `dashboard:${encodeURIComponent(competition || "geral")}:${suffix}`;

const listCompetitions = () => {
  if (typeof window === "undefined") return ["Brasileirão"];

  const fromMatches = readJsonStorage<Array<{ competition?: string }>>(
    "matches",
    []
  )
    .map(m => m.competition)
    .filter((c): c is string => Boolean(c));

  const fromDashboardKeys = Object.keys(localStorage)
    .filter(k => k.startsWith("dashboard:") && k.endsWith(":kpi_rounds"))
    .map(k => decodeURIComponent(k.split(":")[1]));

  const unique = Array.from(
    new Set(["Brasileirão", ...fromMatches, ...fromDashboardKeys])
  );
  return unique.filter(Boolean);
};

const buildInitialValues = () => {
  const initial: Record<string, Record<RoundKey, number | null>> = {};
  KPI_DEFS.forEach(k => {
    initial[k.id] = { fec_media: null };
  });
  return initial;
};

export default function Dashboard() {
  const [availableCompetitions, setAvailableCompetitions] = useState<string[]>(
    () => listCompetitions()
  );
  const [selectedCompetition, setSelectedCompetition] = useState<string>(
    () => listCompetitions()[0] || "Brasileirão"
  );
  const [selectedExportRound, setSelectedExportRound] = useState<string>("all");

  const roundsKey = getStorageKey(selectedCompetition, "kpi_rounds");
  const valuesKey = getStorageKey(selectedCompetition, "kpi_values");

  const [rounds, setRounds] = useState<RoundKey[]>(() =>
    readJsonStorage(roundsKey, ["fec_media"])
  );
  const [values, setValues] = useState<
    Record<string, Record<RoundKey, number | null>>
  >(() => readJsonStorage(valuesKey, buildInitialValues()));

  useEffect(() => {
    setRounds(readJsonStorage(roundsKey, ["fec_media"]));
    setValues(readJsonStorage(valuesKey, buildInitialValues()));
  }, [roundsKey, valuesKey]);

  useEffect(() => {
    localStorage.setItem(roundsKey, JSON.stringify(rounds));
  }, [rounds, roundsKey]);

  useEffect(() => {
    localStorage.setItem(valuesKey, JSON.stringify(values));
  }, [values, valuesKey]);

  useEffect(() => {
    const handler = () => {
      setAvailableCompetitions(listCompetitions());
      setRounds(readJsonStorage(roundsKey, ["fec_media"]));
      setValues(readJsonStorage(valuesKey, buildInitialValues()));
    };
    window.addEventListener("kpi-updated", handler);
    return () => window.removeEventListener("kpi-updated", handler);
  }, [roundsKey, valuesKey]);

  const addRound = () => {
    const next = `r${rounds.length}`;
    setRounds(r => [...r, next]);
    setValues(prev => {
      const copy = { ...prev };
      KPI_DEFS.forEach(k => {
        copy[k.id] = { ...(copy[k.id] || {}), [next]: null };
      });
      return copy;
    });
  };

  const removeRound = (key: RoundKey) => {
    if (key === "fec_media") return;
    setRounds(r => r.filter(c => c !== key));
    setValues(prev => {
      const copy: typeof prev = {};
      Object.keys(prev).forEach(k => {
        const row = { ...prev[k] };
        delete row[key];
        copy[k] = row;
      });
      return copy;
    });
  };

  const setCell = (kpiId: string, col: RoundKey, v: number | null) => {
    setValues(prev => ({
      ...prev,
      [kpiId]: { ...(prev[kpiId] || {}), [col]: v },
    }));
  };

  const kpiAverage = (kpiId: string) => {
    const row = values[kpiId] || {};
    const numeric = rounds
      .filter(round => round !== "fec_media")
      .map(round => row[round])
      .filter((val): val is number => val != null);

    if (numeric.length === 0) return null;
    return numeric.reduce((a, b) => a + b, 0) / numeric.length;
  };

  const groups = useMemo(() => {
    return {
      offensive: KPI_DEFS.filter(k => k.group === "offensive"),
      defensive: KPI_DEFS.filter(k => k.group === "defensive"),
      general: KPI_DEFS.filter(k => k.group === "general"),
    };
  }, []);

  const exportRounds = rounds.filter(r => r !== "fec_media");

  const offensiveGoalsSummary = useMemo(() => {
    const pointsByRound = values["pontos"] || {};
    const completedRounds = rounds
      .filter(round => round !== "fec_media")
      .map(round => pointsByRound[round])
      .filter((value): value is number => value != null);

    const points = completedRounds.reduce((total, value) => total + value, 0);
    const wins = completedRounds.filter(value => value === 3).length;
    const playedMatches = completedRounds.length;
    const pct = playedMatches > 0 ? (points / (playedMatches * 3)) * 100 : null;
    const g2Remaining = Math.min(
      100,
      (points / OFFENSIVE_GOALS.g2Points) * 100
    );
    const g6Remaining = Math.min(
      100,
      (points / OFFENSIVE_GOALS.g6Points) * 100
    );
    return {
      points,
      wins,
      pct,
      g2Remaining,
      g6Remaining,
    };
  }, [rounds, values]);

  const handleExportReport = async () => {
    try {
      const roundsToExport =
        selectedExportRound === "all"
          ? rounds
          : ["fec_media", selectedExportRound].filter(Boolean);

      await generatePDFReport({
        rounds: roundsToExport,
        values,
        seasonYear: new Date().getFullYear(),
        competition: selectedCompetition,
      });
    } catch (error) {
      console.error("Falha ao exportar relatório:", error);
      window.alert(
        "Não foi possível exportar o relatório. Atualize a página e tente novamente."
      );
    }
  };

  const getStatusColor = (
    value: number | null,
    metaG2: number,
    metaG6: number,
    better: "higher" | "lower"
  ) => {
    if (value === null) return "bg-transparent";

    if (better === "higher") {
      if (value >= metaG2)
        return "bg-green-200 border-green-400 text-green-950 dark:text-green-950";
      if (value >= metaG6)
        return "bg-yellow-200 border-yellow-400 text-yellow-950 dark:text-yellow-950";
      return "bg-yellow-100 border-yellow-300 text-yellow-950 dark:text-yellow-950";
    }

    if (value <= metaG2)
      return "bg-green-200 border-green-400 text-green-950 dark:text-green-950";
    if (value <= metaG6)
      return "bg-yellow-200 border-yellow-400 text-yellow-950 dark:text-yellow-950";
    return "bg-yellow-100 border-yellow-300 text-yellow-950 dark:text-yellow-950";
  };

  const formatGoalPct = (value: number | null) => {
    if (value == null) return "-";
    return `${Number(value.toFixed(1))}%`;
  };

  const getGoalRangeColor = (value: number | null) => {
    if (value == null) return "bg-transparent";
    return value >= OFFENSIVE_GOALS.g6Pct
      ? "bg-green-200 border-green-400 text-green-950 dark:text-green-950"
      : "bg-yellow-100 border-yellow-300 text-yellow-950 dark:text-yellow-950";
  };

  const getRoundLabel = (roundKey: RoundKey) => {
    if (roundKey === "fec_media") return "FEC MÉDIA";
    const numberPart = roundKey.replace(/^r/i, "");
    return `RODADA ${numberPart}`;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard KPIs</h1>
          <p className="text-muted-foreground dark:text-white">
            Visualização por competição e rodada
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56 space-y-1">
            <Label className="dark:text-white">Competição</Label>
            <Select
              value={selectedCompetition}
              onValueChange={setSelectedCompetition}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a competição" />
              </SelectTrigger>
              <SelectContent>
                {availableCompetitions.map(competition => (
                  <SelectItem key={competition} value={competition}>
                    {competition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompetition === "Brasileirão" && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-48 space-y-1">
                <Label className="dark:text-white">
                  Rodada para exportação
                </Label>
                <Select
                  value={selectedExportRound}
                  onValueChange={setSelectedExportRound}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as rodadas</SelectItem>
                    {exportRounds.map(r => (
                      <SelectItem key={r} value={r}>
                        {`Rodada ${r.replace("r", "")}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleExportReport}
                className="h-9 gap-2"
                disabled={!exportRounds.length}
              >
                <FileDown className="w-4 h-4" />
                Exportar Relatório
              </Button>
            </div>
          )}

          <Button
            onClick={addRound}
            variant="outline"
            className="h-9 gap-2 dark:text-white"
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar Rodada
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metas ofensivas de pontuação</CardTitle>
          <CardDescription>
            Acompanhamento dinâmico do aproveitamento para atingir as metas G2 e
            G6.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-white/5">
              <TableRow>
                <TableHead>Equipe</TableHead>
                <TableHead className="text-center">Pontos</TableHead>
                <TableHead className="text-center">Vitórias</TableHead>
                <TableHead className="text-center">% Aproveitamento</TableHead>
                <TableHead className="text-center">
                  G2% p/atingir meta
                </TableHead>
                <TableHead className="text-center">
                  G6% p/atingir meta
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-gray-50 dark:hover:bg-white/5">
                <TableCell className="font-medium">FEC</TableCell>
                <TableCell className="text-center font-semibold">
                  {offensiveGoalsSummary.points}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {offensiveGoalsSummary.wins}
                </TableCell>
                <TableCell className="text-center p-1">
                  <div
                    className={`mx-auto w-full max-w-28 rounded border px-2 py-1 text-sm font-semibold ${getGoalRangeColor(offensiveGoalsSummary.pct)}`}
                  >
                    {formatGoalPct(offensiveGoalsSummary.pct)}
                  </div>
                </TableCell>
                <TableCell className="text-center p-1">
                  <div
                    className={`mx-auto w-full max-w-28 rounded border px-2 py-1 text-sm font-semibold ${getGoalRangeColor(offensiveGoalsSummary.pct)}`}
                  >
                    {formatGoalPct(offensiveGoalsSummary.g2Remaining)}
                  </div>
                </TableCell>
                <TableCell className="text-center p-1">
                  <div
                    className={`mx-auto w-full max-w-28 rounded border px-2 py-1 text-sm font-semibold ${getGoalRangeColor(offensiveGoalsSummary.pct)}`}
                  >
                    {formatGoalPct(offensiveGoalsSummary.g6Remaining)}
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50 dark:hover:bg-white/5">
                <TableCell className="font-medium">G2</TableCell>
                <TableCell className="text-center font-semibold">
                  {OFFENSIVE_GOALS.g2Points}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {OFFENSIVE_GOALS.g2Wins}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {OFFENSIVE_GOALS.g2Pct}%
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  -
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  -
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-gray-50 dark:hover:bg-white/5">
                <TableCell className="font-medium">G6</TableCell>
                <TableCell className="text-center font-semibold">
                  {OFFENSIVE_GOALS.g6Points}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {OFFENSIVE_GOALS.g6Wins}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {OFFENSIVE_GOALS.g6Pct}%
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  -
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  -
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {[
        { title: "KPIs Ofensivos", data: groups.offensive },
        { title: "KPIs Defensivos", data: groups.defensive },
        { title: "KPIs Gerais", data: groups.general },
      ].map(group => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>
              Metas G2 e G6 fixas — dados por competição/rodada
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-white/5">
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead className="text-center">Meta G2</TableHead>
                  <TableHead className="text-center">Meta G6</TableHead>
                  {rounds.map(c => (
                    <TableHead key={c} className="text-center">
                      {getRoundLabel(c)}
                      {c !== "fec_media" && (
                        <button
                          title="Remover rodada"
                          className="ml-2 text-red-500"
                          onClick={() => removeRound(c)}
                        >
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
                {group.data.map(k => {
                  const avg = kpiAverage(k.id);
                  const meetsG2 =
                    avg != null
                      ? k.better === "lower"
                        ? avg <= k.metaG2
                        : avg >= k.metaG2
                      : false;
                  const meetsG6 =
                    avg != null
                      ? k.better === "lower"
                        ? avg <= k.metaG6
                        : avg >= k.metaG6
                      : false;
                  const isPercent = /%|posse|pct/.test(k.name.toLowerCase());
                  return (
                    <TableRow
                      key={k.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell className="text-center font-semibold">
                        {k.metaG2}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {k.metaG6}
                      </TableCell>
                      {rounds.map(c => {
                        const cellValue =
                          c === "fec_media"
                            ? kpiAverage(k.id)
                            : (values[k.id]?.[c] ?? null);
                        const statusClass = getStatusColor(
                          cellValue,
                          k.metaG2,
                          k.metaG6,
                          k.better
                        );
                        const isAverageColumn = c === "fec_media";
                        const inputClass = isAverageColumn
                          ? "bg-slate-50 text-slate-900 dark:bg-slate-800 dark:!text-white"
                          : statusClass;
                        const suffixClass = isAverageColumn
                          ? "text-slate-900 dark:text-white"
                          : cellValue == null
                            ? "text-slate-500 dark:text-slate-300"
                            : "text-slate-900";

                        return (
                          <TableCell key={c} className="text-center p-1">
                            <div className="relative mx-auto w-28 max-w-full">
                              <input
                                inputMode="numeric"
                                value={cellValue ?? ""}
                                onChange={e => {
                                  if (isAverageColumn) return;
                                  setCell(
                                    k.id,
                                    c,
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value)
                                  );
                                }}
                                className={`h-8 w-full rounded border px-2 ${isPercent ? "pr-7" : "pr-2"} text-right focus:outline-none focus:ring-2 focus:ring-input placeholder:text-slate-500 ${inputClass}`}
                                placeholder="-"
                                step={isPercent ? "0.1" : "0.01"}
                                type="number"
                                readOnly={isAverageColumn}
                              />

                              {isPercent && (
                                <span
                                  className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium ${suffixClass}`}
                                >
                                  %
                                </span>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-semibold">
                        {avg == null ? "-" : Number(avg.toFixed(2))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={meetsG2 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {avg == null
                            ? "-"
                            : `${Math.round((avg / k.metaG2) * 100)}%`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={meetsG6 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {avg == null
                            ? "-"
                            : `${Math.round((avg / k.metaG6) * 100)}%`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
