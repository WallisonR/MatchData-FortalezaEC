import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ReportData {
  rounds: string[];
  values: Record<string, Record<string, number | null>>;
  seasonYear: number;
  competition: string;
}

type KpiDef = {
  id: string;
  name: string;
  group: "offensive" | "defensive" | "general";
  meta: number;
  better: "higher" | "lower";
};

const KPI_DEFS: KpiDef[] = [
  {
    id: "pontos",
    name: "Pontos",
    group: "offensive",
    meta: 65,
    better: "higher",
  },
  {
    id: "media_gols",
    name: "Média de Gols",
    group: "offensive",
    meta: 1.23,
    better: "higher",
  },
  {
    id: "xg",
    name: "XG (Expected Goals)",
    group: "offensive",
    meta: 1.3,
    better: "higher",
  },
  {
    id: "posse",
    name: "Posse %",
    group: "offensive",
    meta: 51,
    better: "higher",
  },
  {
    id: "pct_jogos_marcou",
    name: "% de jogos que marcou",
    group: "offensive",
    meta: 76,
    better: "higher",
  },
  {
    id: "finalizacoes",
    name: "Finalização/90min",
    group: "offensive",
    meta: 12,
    better: "higher",
  },
  {
    id: "pct_final_certa",
    name: "% Finalização Certa/90min",
    group: "offensive",
    meta: 35,
    better: "higher",
  },
  {
    id: "final_dentro",
    name: "Finalização de Dentro da área/90min",
    group: "offensive",
    meta: 8,
    better: "higher",
  },
  {
    id: "pct_cruzamentos_acerto",
    name: "Cruzamentos % Acerto",
    group: "offensive",
    meta: 34,
    better: "higher",
  },
  {
    id: "entradas_area_90",
    name: "Entradas da Área /90min",
    group: "offensive",
    meta: 22,
    better: "higher",
  },
  {
    id: "toques_area_90",
    name: "Toques na Área /90min",
    group: "offensive",
    meta: 15,
    better: "higher",
  },

  {
    id: "media_gols_sofridos",
    name: "Média de Gols Sofridos",
    group: "defensive",
    meta: 0.88,
    better: "lower",
  },
  {
    id: "xg_contra",
    name: "XG Contra",
    group: "defensive",
    meta: 0.97,
    better: "lower",
  },
  {
    id: "posse_contra",
    name: "Posse Contra",
    group: "defensive",
    meta: 49,
    better: "lower",
  },
  {
    id: "pct_nao_sofreu",
    name: "% de jogos que não sofreu gols",
    group: "defensive",
    meta: 45,
    better: "higher",
  },
  {
    id: "final_sofrida",
    name: "Finalização Sofrida/90min",
    group: "defensive",
    meta: 11,
    better: "lower",
  },
  {
    id: "pct_final_certa_sofrida",
    name: "% Finalização Certa Sofrida/90min",
    group: "defensive",
    meta: 32,
    better: "lower",
  },
  {
    id: "final_dentro_sofrida",
    name: "Finalização de Dentro da área Sofrida/90min",
    group: "defensive",
    meta: 6,
    better: "lower",
  },
  {
    id: "pct_cruzamentos_acerto_sofridos",
    name: "Cruzamentos % Acerto Sofridos",
    group: "defensive",
    meta: 31,
    better: "lower",
  },
  {
    id: "entradas_area_sofrida_90",
    name: "Entradas da Área Sofrida /90min",
    group: "defensive",
    meta: 19,
    better: "lower",
  },
  {
    id: "toques_area_sofridos_90",
    name: "Toques na Área Sofridos /90min",
    group: "defensive",
    meta: 12,
    better: "lower",
  },

  {
    id: "intensidade_jogo",
    name: "Intensidade de Jogo",
    group: "general",
    meta: 16,
    better: "higher",
  },
  {
    id: "duelos_ofensivos_pct",
    name: "% Duelos Ofensivos",
    group: "general",
    meta: 41,
    better: "higher",
  },
  {
    id: "duelos_defensivos_pct",
    name: "% Duelos Defensivos",
    group: "general",
    meta: 61,
    better: "higher",
  },
  {
    id: "duelos_aereos_pct",
    name: "% Duelos Aéreos",
    group: "general",
    meta: 47,
    better: "higher",
  },
  {
    id: "recuperacoes_altas_medias",
    name: "Recuperações Altas/Médias",
    group: "general",
    meta: 44,
    better: "higher",
  },
  {
    id: "ppda",
    name: "PPDA",
    group: "general",
    meta: 10,
    better: "higher",
  },
  {
    id: "media_passes_jogo",
    name: "Média de Passes/ por jogo",
    group: "general",
    meta: 395,
    better: "higher",
  },
  {
    id: "acerto_passes_pct",
    name: "% Acerto de Passes",
    group: "general",
    meta: 83,
    better: "higher",
  },
];

const extractRoundNumber = (round: string) => {
  const match = round.match(/r(\d+)/i);
  return match?.[1] || round;
};

const getDisplayRounds = (rounds: string[]) =>
  rounds.filter(round => round !== "fec_media");

const getRoundDescription = (displayRounds: string[]) => {
  if (displayRounds.length === 0) return "Sem rodada selecionada";
  if (displayRounds.length === 1) {
    return `Relatório referente à Rodada ${extractRoundNumber(displayRounds[0])}`;
  }
  return `Relatório referente às Rodadas ${displayRounds.map(extractRoundNumber).join(", ")}`;
};

const formatForFileName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();

export async function generatePDFReport(data: ReportData) {
  const displayRounds = getDisplayRounds(data.rounds);
  const roundDescription = getRoundDescription(displayRounds);

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "1400px";
  container.style.backgroundColor = "#ffffff";
  container.innerHTML = getReportHTML(data, roundDescription);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    let finalWidth = pdfWidth;
    let finalHeight = pdfWidth / ratio;

    if (finalHeight > pdfHeight) {
      finalHeight = pdfHeight;
      finalWidth = pdfHeight * ratio;
    }

    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;

    const fileCompetition = formatForFileName(data.competition);
    const fileRound = formatForFileName(roundDescription);

    pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
    pdf.save(`relatorio-${fileCompetition}-${fileRound}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function getReportHTML(data: ReportData, roundDescription: string): string {
  const { rounds, values, seasonYear, competition } = data;
  const displayRounds = getDisplayRounds(rounds);

  const offensiveKpis = KPI_DEFS.filter(k => k.group === "offensive");
  const defensiveKpis = KPI_DEFS.filter(k => k.group === "defensive");
  const generalKpis = KPI_DEFS.filter(k => k.group === "general");

  const formatValue = (val: number | null) => {
    if (val === null) return "-";
    return val % 1 !== 0 ? val.toFixed(2) : val.toString();
  };

  const getCellColor = (kpi: KpiDef, val: number | null) => {
    if (val === null) return "#ffffff";
    const onTarget =
      kpi.better === "higher" ? val >= kpi.meta : val <= kpi.meta;
    return onTarget ? "#dcfce7" : "#fef9c3";
  };

  const roundNumberHeaders = displayRounds
    .map(round => `<td class="round-col">${extractRoundNumber(round)}</td>`)
    .join("");

  const buildRows = (list: KpiDef[]) =>
    list
      .map(kpi => {
        const cells = displayRounds
          .map(round => {
            const val = values[kpi.id]?.[round] ?? null;
            return `<td class="value-cell" style="background:${getCellColor(kpi, val)}">${formatValue(val)}</td>`;
          })
          .join("");

        return `<tr>
          <td class="metric-cell">${kpi.name}</td>
          ${cells}
        </tr>`;
      })
      .join("");

  const legend = `
    <div class="legend">
      <div class="legend-item"><span class="legend-color green"></span> Dentro ou acima da meta</div>
      <div class="legend-item"><span class="legend-color yellow"></span> Abaixo da meta</div>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; color: #111827; }
        .page { width: 1400px; padding: 24px 28px; }

        .top-bar {
          background: linear-gradient(90deg, #0e4c92 0%, #0e4c92 72%, #e31e24 72%, #e31e24 100%);
          color: #fff;
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 14px;
        }

        .title { font-size: 28px; font-weight: 700; }
        .subtitle { font-size: 15px; margin-top: 6px; opacity: 0.95; }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        .meta-card {
          border: 1px solid #dbe3ef;
          border-radius: 8px;
          padding: 10px 12px;
          background: #f8fafc;
        }

        .meta-label { font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.4px; }
        .meta-value { margin-top: 4px; font-size: 15px; font-weight: 700; color: #0e4c92; }

        .round-description {
          border-left: 4px solid #e31e24;
          background: #fff7f7;
          color: #991b1b;
          padding: 10px 12px;
          border-radius: 6px;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .legend {
          display: flex;
          gap: 20px;
          align-items: center;
          margin: 6px 0 16px;
          font-size: 12px;
        }

        .legend-item { display: flex; align-items: center; gap: 8px; }
        .legend-color { width: 14px; height: 14px; border-radius: 3px; border: 1px solid #cbd5e1; }
        .legend-color.green { background: #dcfce7; }
        .legend-color.yellow { background: #fef9c3; }

        .tables { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .table-wrap { border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
        .table-title { background: #0e4c92; color: white; padding: 10px 12px; font-weight: 700; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #0e4c92; color: white; }
        th, td { border: 1px solid #e5e7eb; }
        th { padding: 7px 6px; font-size: 11px; text-align: center; }
        .metric-head { text-align: left; width: 54%; }
        .round-col-head { width: 46%; }
        .metric-cell { font-size: 12px; padding: 7px 8px; font-weight: 600; }
        .value-cell { font-size: 12px; text-align: center; padding: 7px 4px; }
        .round-col { font-size: 11px; text-align: center; padding: 7px 3px; font-weight: 700; }

        .footer {
          margin-top: 14px;
          font-size: 11px;
          color: #4b5563;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="top-bar">
          <div class="title">Relatório de Performance - Fortaleza EC</div>
          <div class="subtitle">Modelo MatchData | KPIs Ofensivos, Defensivos e Gerais</div>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">Competição</div>
            <div class="meta-value">${competition}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Temporada</div>
            <div class="meta-value">${seasonYear}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Rodadas no relatório</div>
            <div class="meta-value">${displayRounds.map(extractRoundNumber).join(", ") || "-"}</div>
          </div>
        </div>

        <div class="round-description">${roundDescription}</div>
        ${legend}

        <div class="tables">
          <div class="table-wrap">
            <div class="table-title">Métricas Ofensivas</div>
            <table>
              <thead>
                <tr>
                  <th class="metric-head">Indicador</th>
                  ${roundNumberHeaders || '<th class="round-col-head">Sem rodada</th>'}
                </tr>
              </thead>
              <tbody>
                ${buildRows(offensiveKpis)}
              </tbody>
            </table>
          </div>

          <div class="table-wrap">
            <div class="table-title">Métricas Defensivas</div>
            <table>
              <thead>
                <tr>
                  <th class="metric-head">Indicador</th>
                  ${roundNumberHeaders || '<th class="round-col-head">Sem rodada</th>'}
                </tr>
              </thead>
              <tbody>
                ${buildRows(defensiveKpis)}
              </tbody>
            </table>
          </div>

          <div class="table-wrap">
            <div class="table-title">Métricas Gerais</div>
            <table>
              <thead>
                <tr>
                  <th class="metric-head">Indicador</th>
                  ${roundNumberHeaders || '<th class="round-col-head">Sem rodada</th>'}
                </tr>
              </thead>
              <tbody>
                ${buildRows(generalKpis)}
              </tbody>
            </table>
          </div>
        </div>

        <div class="footer">FONTE: MATCHDATA | Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
      </div>
    </body>
    </html>
  `;
}
