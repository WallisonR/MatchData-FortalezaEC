import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Trophy, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Match {
  id: number;
  date: string;
  opponent: string;
  competition: string;
  result: "W" | "D" | "L";
  goalsFor: number;
  goalsAgainst: number;
  possession?: number;
  xg?: number;
  pct_jogos_marcou?: number;
  finalizacoes?: number;
  pct_final_certa?: number;
  final_dentro?: number;
  xg_contra?: number;
  pct_nao_sofreu?: number;
  final_sofrida?: number;
  pct_final_certa_sofrida?: number;
  final_dentro_sofrida?: number;
  shots?: number;
  shotsOnTarget?: number;
  passes?: number;
  passAccuracy?: number;
  tackles?: number;
  corners?: number;
}

interface MatchStats {
  matchId: number;
  possession: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  corners: number;
}

const MOCK_MATCHES: Match[] = [
 
];

const MOCK_STATS: Record<number, MatchStats> = {

};

function getResultBadge(result: string) {
  const colors = {
    W: "bg-green-100 text-green-800",
    D: "bg-yellow-100 text-yellow-800",
    L: "bg-red-100 text-red-800",
  };
  const labels = { W: "Vitória", D: "Empate", L: "Derrota" };
  return { color: colors[result as keyof typeof colors], label: labels[result as keyof typeof labels] };
}

export default function Partidas() {
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const stored = localStorage.getItem("matches");
      return stored ? JSON.parse(stored) : MOCK_MATCHES;
    } catch {
      return MOCK_MATCHES;
    }
  });
  const [open, setOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    opponent: "",
    competition: "",
    result: "D",
    goalsFor: "",
    goalsAgainst: "",
    possession: "",
    xg: "",
    pct_jogos_marcou: "",
    finalizacoes: "",
    pct_final_certa: "",
    final_dentro: "",
    xg_contra: "",
    pct_nao_sofreu: "",
    final_sofrida: "",
    pct_final_certa_sofrida: "",
    final_dentro_sofrida: "",
    shots: "",
    shotsOnTarget: "",
    passes: "",
    passAccuracy: "",
    tackles: "",
    corners: "",
    selectedRound: "new",
  });

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      opponent: "",
      competition: "",
      result: "D",
      goalsFor: "",
      goalsAgainst: "",
      possession: "",
      xg: "",
      pct_jogos_marcou: "",
      finalizacoes: "",
      pct_final_certa: "",
      final_dentro: "",
      xg_contra: "",
      pct_nao_sofreu: "",
      final_sofrida: "",
      pct_final_certa_sofrida: "",
      final_dentro_sofrida: "",
      shots: "",
      shotsOnTarget: "",
      passes: "",
      passAccuracy: "",
      tackles: "",
      corners: "",
      selectedRound: "new",
    });
    setOpen(true);
  };

  const handleEditClick = (match: Match) => {
    setEditingId(match.id);
    // determine selectedRound from round map if available
    let selected = "new";
    try {
      const roundMap = JSON.parse(localStorage.getItem("match_round_map") || "{}");
      if (roundMap[match.id]) selected = roundMap[match.id];
    } catch (e) {}

    setFormData({
      date: match.date,
      opponent: match.opponent,
      competition: match.competition,
      result: match.result,
      goalsFor: match.goalsFor.toString(),
      goalsAgainst: match.goalsAgainst.toString(),
      selectedRound: selected,
      possession: match.possession == null ? "" : String(match.possession),
      xg: match.xg == null ? "" : String(match.xg),
      pct_jogos_marcou: match.pct_jogos_marcou == null ? "" : String(match.pct_jogos_marcou),
      finalizacoes: match.finalizacoes == null ? "" : String(match.finalizacoes),
      pct_final_certa: match.pct_final_certa == null ? "" : String(match.pct_final_certa),
      final_dentro: match.final_dentro == null ? "" : String(match.final_dentro),
      xg_contra: match.xg_contra == null ? "" : String(match.xg_contra),
      pct_nao_sofreu: match.pct_nao_sofreu == null ? "" : String(match.pct_nao_sofreu),
      final_sofrida: match.final_sofrida == null ? "" : String(match.final_sofrida),
      pct_final_certa_sofrida: match.pct_final_certa_sofrida == null ? "" : String(match.pct_final_certa_sofrida),
      final_dentro_sofrida: match.final_dentro_sofrida == null ? "" : String(match.final_dentro_sofrida),
      shots: match.shots == null ? "" : String(match.shots),
      shotsOnTarget: match.shotsOnTarget == null ? "" : String(match.shotsOnTarget),
      passes: match.passes == null ? "" : String(match.passes),
      passAccuracy: match.passAccuracy == null ? "" : String(match.passAccuracy),
      tackles: match.tackles == null ? "" : String(match.tackles),
      corners: match.corners == null ? "" : String(match.corners),
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!formData.opponent || !formData.date) {
      alert("Preencha os dados obrigatórios");
      return;
    }

    let toPersistMatches = matches;
    if (editingId) {
      const updatedMatches = matches.map((m) =>
        m.id === editingId
          ? {
              ...m,
              date: formData.date,
              opponent: formData.opponent,
              competition: formData.competition,
              result: formData.result as "W" | "D" | "L",
              goalsFor: parseInt(formData.goalsFor),
              goalsAgainst: parseInt(formData.goalsAgainst),
              possession: formData.possession === "" ? undefined : Number(formData.possession),
            }
          : m
      );
      setMatches(updatedMatches);
      toPersistMatches = updatedMatches;
      // sync updated match to dashboard using the form values
      try {
        const updatedMatch: Match = {
          id: editingId,
          date: formData.date,
          opponent: formData.opponent,
          competition: formData.competition,
          result: formData.result as "W" | "D" | "L",
          goalsFor: parseInt(formData.goalsFor) || 0,
          goalsAgainst: parseInt(formData.goalsAgainst) || 0,
          possession: formData.possession === "" ? undefined : Number(formData.possession),
          xg: formData.xg === "" ? undefined : Number(formData.xg),
          pct_jogos_marcou: formData.pct_jogos_marcou === "" ? undefined : Number(formData.pct_jogos_marcou),
          finalizacoes: formData.finalizacoes === "" ? undefined : Number(formData.finalizacoes),
          pct_final_certa: formData.pct_final_certa === "" ? undefined : Number(formData.pct_final_certa),
          final_dentro: formData.final_dentro === "" ? undefined : Number(formData.final_dentro),
          xg_contra: formData.xg_contra === "" ? undefined : Number(formData.xg_contra),
          pct_nao_sofreu: formData.pct_nao_sofreu === "" ? undefined : Number(formData.pct_nao_sofreu),
          final_sofrida: formData.final_sofrida === "" ? undefined : Number(formData.final_sofrida),
          pct_final_certa_sofrida: formData.pct_final_certa_sofrida === "" ? undefined : Number(formData.pct_final_certa_sofrida),
          final_dentro_sofrida: formData.final_dentro_sofrida === "" ? undefined : Number(formData.final_dentro_sofrida),
          shots: formData.shots === "" ? undefined : Number(formData.shots),
          shotsOnTarget: formData.shotsOnTarget === "" ? undefined : Number(formData.shotsOnTarget),
          passes: formData.passes === "" ? undefined : Number(formData.passes),
          passAccuracy: formData.passAccuracy === "" ? undefined : Number(formData.passAccuracy),
          tackles: formData.tackles === "" ? undefined : Number(formData.tackles),
          corners: formData.corners === "" ? undefined : Number(formData.corners),
        };

        const roundMap = JSON.parse(localStorage.getItem("match_round_map") || "{}");
        const existingKey = roundMap[updatedMatch.id];
        // if user selected a different round (Brasileirão case), update mapping
        let targetKey = existingKey;
        if (formData.selectedRound && formData.selectedRound !== "new") {
            targetKey = formData.selectedRound;
            roundMap[updatedMatch.id] = targetKey;
            localStorage.setItem("match_round_map", JSON.stringify(roundMap));
            try {
              const rounds = JSON.parse(localStorage.getItem("kpi_rounds") || "[\"fec_media\"]");
              if (!rounds.includes(targetKey)) {
                rounds.push(targetKey);
                localStorage.setItem("kpi_rounds", JSON.stringify(rounds));
              }
            } catch (e) {}
        }
        if (targetKey) {
          writeMatchKpis(targetKey, updatedMatch);
          try {
            const statsMap = JSON.parse(localStorage.getItem("match_stats") || "{}");
            statsMap[updatedMatch.id] = {
              matchId: updatedMatch.id,
              possession: updatedMatch.possession ?? 0,
              shots: updatedMatch.shots ?? 0,
              shotsOnTarget: updatedMatch.shotsOnTarget ?? 0,
              passes: updatedMatch.passes ?? 0,
              passAccuracy: updatedMatch.passAccuracy ?? 0,
              tackles: updatedMatch.tackles ?? 0,
              corners: updatedMatch.corners ?? 0,
            };
            localStorage.setItem("match_stats", JSON.stringify(statsMap));
          } catch (e) {}
        }
      } catch (err) {
        // ignore
      }
    } else {
      const newMatch: Match = {
        id: Math.max(...matches.map((m) => m.id), 0) + 1,
        date: formData.date,
        opponent: formData.opponent,
        competition: formData.competition,
        result: formData.result as "W" | "D" | "L",
        goalsFor: parseInt(formData.goalsFor) || 0,
        goalsAgainst: parseInt(formData.goalsAgainst) || 0,
        possession: formData.possession === "" ? undefined : Number(formData.possession),
        xg: formData.xg === "" ? undefined : Number(formData.xg),
        pct_jogos_marcou: formData.pct_jogos_marcou === "" ? undefined : Number(formData.pct_jogos_marcou),
        finalizacoes: formData.finalizacoes === "" ? undefined : Number(formData.finalizacoes),
        pct_final_certa: formData.pct_final_certa === "" ? undefined : Number(formData.pct_final_certa),
        final_dentro: formData.final_dentro === "" ? undefined : Number(formData.final_dentro),
        xg_contra: formData.xg_contra === "" ? undefined : Number(formData.xg_contra),
        pct_nao_sofreu: formData.pct_nao_sofreu === "" ? undefined : Number(formData.pct_nao_sofreu),
        final_sofrida: formData.final_sofrida === "" ? undefined : Number(formData.final_sofrida),
        pct_final_certa_sofrida: formData.pct_final_certa_sofrida === "" ? undefined : Number(formData.pct_final_certa_sofrida),
        final_dentro_sofrida: formData.final_dentro_sofrida === "" ? undefined : Number(formData.final_dentro_sofrida),
        shots: formData.shots === "" ? undefined : Number(formData.shots),
        shotsOnTarget: formData.shotsOnTarget === "" ? undefined : Number(formData.shotsOnTarget),
        passes: formData.passes === "" ? undefined : Number(formData.passes),
        passAccuracy: formData.passAccuracy === "" ? undefined : Number(formData.passAccuracy),
        tackles: formData.tackles === "" ? undefined : Number(formData.tackles),
        corners: formData.corners === "" ? undefined : Number(formData.corners),
      };
      const newMatches = [...matches, newMatch].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMatches(newMatches);
      toPersistMatches = newMatches;

      // persist match and sync to dashboard localStorage
      try {
        // decide which round to use: selectedRound (r1..r38) or create nextKey if none selected
        let useKey = formData.selectedRound || "new";
        const rounds = JSON.parse(localStorage.getItem("kpi_rounds") || "[\"fec_media\"]");
        if (useKey === "new") {
          const nextKey = `r${rounds.length}`;
          rounds.push(nextKey);
          localStorage.setItem("kpi_rounds", JSON.stringify(rounds));
          useKey = nextKey;
        } else {
          // ensure the selected round is present in stored rounds
          if (!rounds.includes(useKey)) {
            rounds.push(useKey);
            localStorage.setItem("kpi_rounds", JSON.stringify(rounds));
          }
        }

        // map match id to round
        const roundMap = JSON.parse(localStorage.getItem("match_round_map") || "{}");
        roundMap[newMatch.id] = useKey;
        localStorage.setItem("match_round_map", JSON.stringify(roundMap));

        // write all KPIs for this match's round
        writeMatchKpis(useKey, newMatch);
        try {
          const statsMap = JSON.parse(localStorage.getItem("match_stats") || "{}");
          statsMap[newMatch.id] = {
            matchId: newMatch.id,
            possession: newMatch.possession ?? 0,
            shots: Number(formData.shots) || 0,
            shotsOnTarget: Number(formData.shotsOnTarget) || 0,
            passes: Number(formData.passes) || 0,
            passAccuracy: Number(formData.passAccuracy) || 0,
            tackles: Number(formData.tackles) || 0,
            corners: Number(formData.corners) || 0,
          };
          localStorage.setItem("match_stats", JSON.stringify(statsMap));
        } catch (e) {}
      } catch (err) {
        // ignore storage errors
      }
    }

    // persist matches list
    try {
      localStorage.setItem("matches", JSON.stringify(toPersistMatches));
    } catch {}

    setOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta partida?")) {
      const remaining = matches.filter((m) => m.id !== id);
      setMatches(remaining);
      // remove round mapping and values
      try {
        const roundMap = JSON.parse(localStorage.getItem("match_round_map") || "{}");
        const roundKey = roundMap[id];
        if (roundKey) {
          delete roundMap[id];
          localStorage.setItem("match_round_map", JSON.stringify(roundMap));
          // remove round from rounds list
          const rounds = JSON.parse(localStorage.getItem("kpi_rounds") || "[\"fec_media\"]");
          const idx = rounds.indexOf(roundKey);
          if (idx !== -1) {
            rounds.splice(idx, 1);
            localStorage.setItem("kpi_rounds", JSON.stringify(rounds));
          }
          // remove values for that round across all KPIs
          const values = JSON.parse(localStorage.getItem("kpi_values") || "{}");
          Object.keys(values).forEach((k) => {
            if (values[k] && values[k][roundKey] !== undefined) {
              delete values[k][roundKey];
            }
          });
          localStorage.setItem("kpi_values", JSON.stringify(values));
          window.dispatchEvent(new Event("kpi-updated"));
        }
      } catch (err) {}
    }
  };

  // helper: write all KPI values for a given roundKey from a match object
  const writeMatchKpis = (roundKey: string, m: Match) => {
    try {
      const values = JSON.parse(localStorage.getItem("kpi_values") || "{}");
      // pontos
      values["pontos"] = values["pontos"] || {};
      const points = m.goalsFor > m.goalsAgainst ? 3 : m.goalsFor === m.goalsAgainst ? 1 : 0;
      values["pontos"][roundKey] = points;
      // goals
      values["media_gols"] = values["media_gols"] || {};
      values["media_gols"][roundKey] = m.goalsFor;
      values["media_gols_sofridos"] = values["media_gols_sofridos"] || {};
      values["media_gols_sofridos"][roundKey] = m.goalsAgainst;
      // possession team and opponent
      if (m.possession != null) {
        const teamPos = Number(m.possession);
        const oppPos = Math.max(0, Math.min(100, 100 - teamPos));
        values["posse"] = values["posse"] || {};
        values["posse"][roundKey] = teamPos;
        values["posse_contra"] = values["posse_contra"] || {};
        values["posse_contra"][roundKey] = oppPos;
      }

      // other offensive KPIs
      const maybeSet = (key: string, val: any) => {
        if (val !== undefined && val !== null && val !== "") {
          values[key] = values[key] || {};
          values[key][roundKey] = Number(val);
        }
      };

      maybeSet("xg", m.xg);
      maybeSet("pct_jogos_marcou", m.pct_jogos_marcou);
      maybeSet("finalizacoes", m.finalizacoes);
      maybeSet("pct_final_certa", m.pct_final_certa);
      maybeSet("final_dentro", m.final_dentro);

      // defensive KPIs
      maybeSet("xg_contra", m.xg_contra);
      maybeSet("pct_nao_sofreu", m.pct_nao_sofreu);
      maybeSet("final_sofrida", m.final_sofrida);
      maybeSet("pct_final_certa_sofrida", m.pct_final_certa_sofrida);
      maybeSet("final_dentro_sofrida", m.final_dentro_sofrida);

      localStorage.setItem("kpi_values", JSON.stringify(values));
      window.dispatchEvent(new Event("kpi-updated"));
    } catch (err) {
      // ignore
    }
  };

  const handleViewStats = (match: Match) => {
    setSelectedMatch(match);
    setStatsOpen(true);
  };

  const stats = (() => {
    if (!selectedMatch) return null;
    try {
      const statsMap = JSON.parse(localStorage.getItem("match_stats") || "{}");
      if (statsMap && statsMap[selectedMatch.id]) return statsMap[selectedMatch.id];
    } catch (e) {}
    return MOCK_STATS[selectedMatch.id] || null;
  })();
  const totalMatches = matches.length;
  const wins = matches.filter((m) => m.result === "W").length;
  const draws = matches.filter((m) => m.result === "D").length;
  const losses = matches.filter((m) => m.result === "L").length;
  const goalsFor = matches.reduce((sum, m) => sum + m.goalsFor, 0);
  const goalsAgainst = matches.reduce((sum, m) => sum + m.goalsAgainst, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciador de Partidas</h1>
          <p className="text-gray-600">Fortaleza Esporte Clube - Histórico de Jogos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Partida
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Partida" : "Registrar Nova Partida"}</DialogTitle>
              <DialogDescription>Preencha os dados da partida</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pb-2">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Adversário</Label>
                  <Input
                    value={formData.opponent}
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    placeholder="Nome do time"
                  />
                </div>
                <div>
                  <Label>Competição</Label>
                  <Select value={formData.competition} onValueChange={(value) => setFormData({ ...formData, competition: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a competição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Brasileirão">Brasileirão</SelectItem>
                      <SelectItem value="Cearense">Cearense</SelectItem>
                      <SelectItem value="Copa do Nordeste">Copa do Nordeste</SelectItem>
                      <SelectItem value="Copa do Brasil">Copa do Brasil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.competition === "Brasileirão" && (
                <div className="mt-2">
                  <Label>Relacionar Rodada (Brasileirão)</Label>
                  <Select value={formData.selectedRound} onValueChange={(value) => setFormData({ ...formData, selectedRound: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha a rodada (ou deixe vazio)" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 38 }, (_, i) => i + 1).map((n) => {
                        const key = `r${n}`;
                        return (
                          <SelectItem key={key} value={key}>{`Rodada ${n}`}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600 mt-1">Se nenhuma rodada for selecionada, uma nova rodada será criada ao salvar.</div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Resultado</Label>
                  <Select value={formData.result} onValueChange={(value) => setFormData({ ...formData, result: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="W">Vitória</SelectItem>
                      <SelectItem value="D">Empate</SelectItem>
                      <SelectItem value="L">Derrota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gols a Favor</Label>
                  <Input
                    type="number"
                    value={formData.goalsFor}
                    onChange={(e) => setFormData({ ...formData, goalsFor: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Gols Contra</Label>
                  <Input
                    type="number"
                    value={formData.goalsAgainst}
                    onChange={(e) => setFormData({ ...formData, goalsAgainst: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Posse de Bola (%)</Label>
                  <Input
                    type="number"
                    value={formData.possession}
                    onChange={(e) => setFormData({ ...formData, possession: e.target.value })}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Estatísticas da Partida</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Finalizações</Label>
                    <Input type="number" value={formData.shots} onChange={(e) => setFormData({ ...formData, shots: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <Label>Finalizações no Alvo</Label>
                    <Input type="number" value={formData.shotsOnTarget} onChange={(e) => setFormData({ ...formData, shotsOnTarget: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <Label>Passes</Label>
                    <Input type="number" value={formData.passes} onChange={(e) => setFormData({ ...formData, passes: e.target.value })} placeholder="0" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                  <div>
                    <Label>% Acerto de Passes</Label>
                    <Input type="number" value={formData.passAccuracy} onChange={(e) => setFormData({ ...formData, passAccuracy: e.target.value })} placeholder="84" />
                  </div>
                  <div>
                    <Label>Desarmes</Label>
                    <Input type="number" value={formData.tackles} onChange={(e) => setFormData({ ...formData, tackles: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <Label>Escanteios</Label>
                    <Input type="number" value={formData.corners} onChange={(e) => setFormData({ ...formData, corners: e.target.value })} placeholder="0" />
                  </div>
                </div>

                <div className="text-sm font-semibold text-gray-700 mb-2 mt-4">KPIs adicionais (preencha se souber)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>XG</Label>
                    <Input type="number" value={formData.xg} onChange={(e) => setFormData({ ...formData, xg: e.target.value })} placeholder="1.23" step="0.01" />
                  </div>
                  <div>
                    <Label>Finalizações/90</Label>
                    <Input type="number" value={formData.finalizacoes} onChange={(e) => setFormData({ ...formData, finalizacoes: e.target.value })} placeholder="12" />
                  </div>
                  <div>
                    <Label>% Finalização Certa</Label>
                    <Input type="number" value={formData.pct_final_certa} onChange={(e) => setFormData({ ...formData, pct_final_certa: e.target.value })} placeholder="35" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                  <div>
                    <Label>Finalizações dentro da área</Label>
                    <Input type="number" value={formData.final_dentro} onChange={(e) => setFormData({ ...formData, final_dentro: e.target.value })} placeholder="8" />
                  </div>
                  <div>
                    <Label>XG Contra</Label>
                    <Input type="number" value={formData.xg_contra} onChange={(e) => setFormData({ ...formData, xg_contra: e.target.value })} placeholder="1.0" step="0.01" />
                  </div>
                  <div>
                    <Label>Finalizações sofridas</Label>
                    <Input type="number" value={formData.final_sofrida} onChange={(e) => setFormData({ ...formData, final_sofrida: e.target.value })} placeholder="11" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                  <div>
                    <Label>% Não sofreu gols (0/1)</Label>
                    <Input type="number" value={formData.pct_nao_sofreu} onChange={(e) => setFormData({ ...formData, pct_nao_sofreu: e.target.value })} placeholder="1" />
                  </div>
                  <div>
                    <Label>% Finalização certa sofrida</Label>
                    <Input type="number" value={formData.pct_final_certa_sofrida} onChange={(e) => setFormData({ ...formData, pct_final_certa_sofrida: e.target.value })} placeholder="32" />
                  </div>
                  <div>
                    <Label>Finalizações dentro sofridas</Label>
                    <Input type="number" value={formData.final_dentro_sofrida} onChange={(e) => setFormData({ ...formData, final_dentro_sofrida: e.target.value })} placeholder="6" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Partidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalMatches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Vitórias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{wins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Empates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{draws}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Derrotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{losses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {goalsFor} - {goalsAgainst}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Partidas</CardTitle>
          <CardDescription>Últimas partidas do Fortaleza</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Adversário</TableHead>
                <TableHead>Competição</TableHead>
                <TableHead className="text-center">Placar</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => {
                const resultBadge = getResultBadge(match.result);
                const matchDate = new Date(match.date).toLocaleDateString("pt-BR");
                return (
                  <TableRow key={match.id} className="hover:bg-gray-50">
                    <TableCell>{matchDate}</TableCell>
                    <TableCell className="font-medium">{match.opponent}</TableCell>
                    <TableCell className="text-sm text-gray-600">{match.competition}</TableCell>
                    <TableCell className="text-center font-bold">
                      {match.goalsFor} x {match.goalsAgainst}
                    </TableCell>
                    <TableCell>
                      <Badge className={resultBadge.color}>{resultBadge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewStats(match)}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Stats
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(match)}
                        className="gap-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(match.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats Dialog */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Estatísticas - {selectedMatch?.opponent} ({selectedMatch?.date})
            </DialogTitle>
          </DialogHeader>
          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Posse de Bola</div>
                      <div className="text-2xl font-bold text-blue-600">{stats.possession}%</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Acurácia de Passes</div>
                      <div className="text-2xl font-bold text-green-600">{stats.passAccuracy}%</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Finalizações</div>
                  <div className="space-y-1 text-sm">
                    <div>Total: {stats.shots}</div>
                    <div>Na Trave: {stats.shotsOnTarget}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Passes</div>
                  <div className="space-y-1 text-sm">
                    <div>Total: {stats.passes}</div>
                    <div>Aproximação: {stats.tackles}</div>
                  </div>
                </div>
              </div>

              <div className="text-sm">
                <div className="font-semibold text-gray-700 mb-2">Outros</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>Escanteios: {stats.corners}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
