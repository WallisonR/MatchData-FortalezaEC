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
  metaG2: number;
  metaG6: number;
  better: "higher" | "lower";
};

const KPI_DEFS: KpiDef[] = [
  {
    id: "pontos",
    name: "Pontos",
    metaG2: 65,
    metaG6: 61,
    group: "offensive",
    better: "higher",
  },
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
  container.style.width = "1500px";
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
  const currentRound = displayRounds[displayRounds.length - 1] ?? null;

  const offensiveKpis = KPI_DEFS.filter(k => k.group === "offensive");
  const defensiveKpis = KPI_DEFS.filter(k => k.group === "defensive");
  const generalKpis = KPI_DEFS.filter(k => k.group === "general");

  const kpiAverage = (kpiId: string) => {
    const numeric = displayRounds
      .map(round => values[kpiId]?.[round])
      .filter((val): val is number => val != null);

    if (numeric.length === 0) return null;
    return numeric.reduce((acc, val) => acc + val, 0) / numeric.length;
  };

  const getRoundValue = (kpiId: string) => {
    if (!currentRound) return null;
    return values[kpiId]?.[currentRound] ?? null;
  };

  const formatValue = (val: number | null, metricName?: string) => {
    if (val === null) return "-";
    const isPercentMetric = metricName
      ? /%|posse|pct|duelos|acerto/i.test(metricName)
      : false;
    const formatted = val % 1 !== 0 ? val.toFixed(2) : val.toString();
    return isPercentMetric ? `${formatted}%` : formatted;
  };

  const getCellColor = (kpi: KpiDef, val: number | null) => {
    if (val === null) return "#ffffff";

    if (kpi.better === "higher") {
      if (val >= kpi.metaG2) return "#dcfce7";
      if (val >= kpi.metaG6) return "#fef9c3";
      return "#fef3c7";
    }

    if (val <= kpi.metaG2) return "#dcfce7";
    if (val <= kpi.metaG6) return "#fef9c3";
    return "#fef3c7";
  };

  const buildMainRows = (list: KpiDef[]) =>
    list
      .map(kpi => {
        const avg = kpiAverage(kpi.id);
        const roundVal = getRoundValue(kpi.id);

        return `<tr>
          <td class="metric-cell">${kpi.name}</td>
          <td class="meta-cell">${formatValue(kpi.metaG2, kpi.name)}</td>
          <td class="meta-cell">${formatValue(kpi.metaG6, kpi.name)}</td>
          <td class="value-cell" style="background:${getCellColor(kpi, avg)}">${formatValue(avg, kpi.name)}</td>
          <td class="value-cell" style="background:${getCellColor(kpi, roundVal)}">${formatValue(roundVal, kpi.name)}</td>
        </tr>`;
      })
      .join("");

  const buildGeneralMetaRow = (label: string, getter: (kpi: KpiDef) => string) => {
    const cols = generalKpis
      .map(kpi => `<td class="value-cell">${getter(kpi)}</td>`)
      .join("");

    return `<tr><td class="metric-cell">${label}</td>${cols}</tr>`;
  };

  const generalHeaderCols = generalKpis
    .map(kpi => `<th class="general-head">${kpi.name}</th>`)
    .join("");

  const generalRows = [
    buildGeneralMetaRow("G2", kpi => formatValue(kpi.metaG2, kpi.name)),
    buildGeneralMetaRow("G6", kpi => formatValue(kpi.metaG6, kpi.name)),
    buildGeneralMetaRow("FEC MÉDIA", kpi => formatValue(kpiAverage(kpi.id), kpi.name)),
    buildGeneralMetaRow(
      currentRound ? `RODADA ${extractRoundNumber(currentRound)}` : "RODADA -",
      kpi => formatValue(getRoundValue(kpi.id), kpi.name)
    ),
  ].join("");

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
        .page { width: 1500px; padding: 20px 24px; }

        .top-bar {
          background: linear-gradient(90deg, #0e4c92 0%, #0e4c92 72%, #e31e24 72%, #e31e24 100%);
          color: #fff;
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 12px;
        }

        .title { font-size: 24px; font-weight: 700; }
        .subtitle { font-size: 14px; margin-top: 4px; opacity: 0.95; }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }

        .meta-card {
          border: 1px solid #dbe3ef;
          border-radius: 8px;
          padding: 8px 10px;
          background: #f8fafc;
        }

        .meta-label { font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.4px; }
        .meta-value { margin-top: 3px; font-size: 14px; font-weight: 700; color: #0e4c92; }

        .round-description {
          border-left: 4px solid #e31e24;
          background: #fff7f7;
          color: #991b1b;
          padding: 8px 10px;
          border-radius: 6px;
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 12px;
        }

        .legend {
          display: flex;
          gap: 20px;
          align-items: center;
          margin: 4px 0 10px;
          font-size: 11px;
        }

        .legend-item { display: flex; align-items: center; gap: 8px; }
        .legend-color { width: 12px; height: 12px; border-radius: 3px; border: 1px solid #cbd5e1; }
        .legend-color.green { background: #dcfce7; }
        .legend-color.yellow { background: #fef9c3; }

        .tables-main { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .table-wrap { border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
        .table-title { background: #0e4c92; color: white; padding: 8px 10px; font-weight: 700; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f3f4f6; color: #111827; }
        th, td { border: 1px solid #e5e7eb; }
        th { padding: 6px 4px; font-size: 10px; text-align: center; font-weight: 700; }
        .metric-head { text-align: left; min-width: 160px; }
        .metric-cell { font-size: 11px; padding: 6px 6px; font-weight: 600; }
        .meta-cell { font-size: 11px; padding: 6px 4px; text-align: center; font-weight: 700; }
        .value-cell { font-size: 11px; text-align: center; padding: 6px 4px; }

        .general-wrap { border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
        .general-head { font-size: 10px; min-width: 120px; }

        .footer {
          margin-top: 10px;
          font-size: 10px;
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
            <div class="meta-label">Rodada atual no relatório</div>
            <div class="meta-value">${currentRound ? extractRoundNumber(currentRound) : "-"}</div>
          </div>
        </div>

        <div class="round-description">${roundDescription}</div>
        ${legend}

        <div class="tables-main">
          <div class="table-wrap">
            <div class="table-title">Métricas Ofensivas</div>
            <table>
              <thead>
                <tr>
                  <th class="metric-head">Ofensivo</th>
                  <th>Meta G2</th>
                  <th>Meta G6</th>
                  <th>FEC MÉDIA</th>
                  <th>${currentRound ? `RODADA ${extractRoundNumber(currentRound)}` : "RODADA -"}</th>
                </tr>
              </thead>
              <tbody>
                ${buildMainRows(offensiveKpis)}
              </tbody>
            </table>
          </div>

          <div class="table-wrap">
            <div class="table-title">Métricas Defensivas</div>
            <table>
              <thead>
                <tr>
                  <th class="metric-head">Defensivo</th>
                  <th>Meta G2</th>
                  <th>Meta G6</th>
                  <th>FEC MÉDIA</th>
                  <th>${currentRound ? `RODADA ${extractRoundNumber(currentRound)}` : "RODADA -"}</th>
                </tr>
              </thead>
              <tbody>
                ${buildMainRows(defensiveKpis)}
              </tbody>
            </table>
          </div>
        </div>

        <div class="general-wrap">
          <div class="table-title">KPIs Gerais (horizontal)</div>
          <table>
            <thead>
              <tr>
                <th class="metric-head">Base</th>
                ${generalHeaderCols}
              </tr>
            </thead>
            <tbody>
              ${generalRows}
            </tbody>
          </table>
        </div>

        <div class="footer">FONTE: MATCHDATA | Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
      </div>
    </body>
    </html>
  `;
}
