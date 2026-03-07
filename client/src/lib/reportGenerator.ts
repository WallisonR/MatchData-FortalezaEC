import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportData {
  rounds: string[];
  values: Record<string, Record<string, number | null>>;
  seasonYear: number;
}

export async function generatePDFReport(data: ReportData) {
  // Create a temporary container for rendering HTML to canvas
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '1400px';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = getReportHTML(data);
  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
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

    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    pdf.save(`matchdata-relatorio-${new Date().getTime()}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function getReportHTML(data: ReportData): string {
  const { rounds, values, seasonYear } = data;
  
  // Filter out 'fec_media' for display rounds
  const displayRounds = rounds.filter(r => r !== 'fec_media');
  
  const kpiDefs = [
    { id: 'pontos', name: 'Pontos', group: 'offensive' },
    { id: 'media_gols', name: 'Média de Gols', group: 'offensive' },
    { id: 'xg', name: 'XG (Expected Goals)', group: 'offensive' },
    { id: 'diferencial_gols', name: 'Diferencial de Gols (Gols - xG)', group: 'offensive' },
    { id: 'posse', name: 'Posse %', group: 'offensive' },
    { id: 'pct_jogos_marcou', name: '% de jogos que marcou', group: 'offensive' },
    { id: 'finalizacoes', name: 'Finalização/90min', group: 'offensive' },
    { id: 'pct_final_certa', name: '% Finalização Certa/90min', group: 'offensive' },
    { id: 'final_dentro', name: 'Finalização de Dentro da área/90min', group: 'offensive' },
    
    { id: 'media_gols_sofridos', name: 'Média de Gols Sofridos', group: 'defensive' },
    { id: 'xg_contra', name: 'XG Contra', group: 'defensive' },
    { id: 'posse_contra', name: 'Posse Contra', group: 'defensive' },
    { id: 'pct_nao_sofreu', name: '% de jogos que não sofreu gols', group: 'defensive' },
    { id: 'final_sofrida', name: 'Finalização Sofrida/90min', group: 'defensive' },
    { id: 'pct_final_certa_sofrida', name: '% Finalização Certa Sofrida/90min', group: 'defensive' },
    { id: 'final_dentro_sofrida', name: 'Finalização de Dentro da área Sofrida/90min', group: 'defensive' },
  ];

  const offensiveKpis = kpiDefs.filter(k => k.group === 'offensive');
  const defensiveKpis = kpiDefs.filter(k => k.group === 'defensive');

  const formatValue = (val: number | null) => {
    if (val === null) return '-';
    return val % 1 !== 0 ? val.toFixed(2) : val.toString();
  };

  const roundNumberHeaders = displayRounds
    .map(round => {
      const match = round.match(/r(\d+)/);
      const num = match ? match[1] : round;
      return `<td style="padding: 8px 4px; text-align: center; font-weight: 600; color: white; border: 1px solid #062a57;">${num}</td>`;
    })
    .join('');

  const offensiveRows = offensiveKpis
    .map(kpi => {
      const cells = displayRounds
        .map(round => {
          const val = values[kpi.id]?.[round] ?? null;
          return `<td style="padding: 6px 4px; text-align: center; font-size: 12px; border-right: 1px solid #ddd;">${formatValue(val)}</td>`;
        })
        .join('');
      return `<tr style="border-bottom: 1px solid #ddd; height: 28px;">
        <td style="padding: 6px 8px; text-align: left; font-weight: 500; font-size: 12px; border-right: 1px solid #ddd;">${kpi.name}</td>
        ${cells}
      </tr>`;
    })
    .join('');

  const defensiveRows = defensiveKpis
    .map(kpi => {
      const cells = displayRounds
        .map(round => {
          const val = values[kpi.id]?.[round] ?? null;
          return `<td style="padding: 6px 4px; text-align: center; font-size: 12px; border-right: 1px solid #ddd;">${formatValue(val)}</td>`;
        })
        .join('');
      return `<tr style="border-bottom: 1px solid #ddd; height: 28px;">
        <td style="padding: 6px 8px; text-align: left; font-weight: 500; font-size: 12px; border-right: 1px solid #ddd;">${kpi.name}</td>
        ${cells}
      </tr>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: white; }
        .page { width: 1400px; background: white; }
        
        .header-top {
          background: linear-gradient(to bottom, #0e4c92 0%, #0e4c92 85%, #e31e24 85%, #e31e24 100%);
          color: white;
          padding: 16px;
          text-align: center;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 2px;
        }
        
        .header-subtitle {
          background: white;
          padding: 12px 16px;
          font-size: 11px;
          text-align: center;
          color: #333;
          border-bottom: 1px solid #ccc;
          letter-spacing: 1px;
          font-weight: 600;
        }
        
        .content { padding: 0; }
        
        .main-section {
          display: flex;
          gap: 0;
        }
        
        .logo-section {
          flex: 0 0 150px;
          border-right: 2px solid #0e4c92;
          padding: 20px;
          background: white;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
        }
        
        .logo-box {
          border: 2px solid #0e4c92;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #0e4c92;
          font-size: 10px;
          text-align: center;
          background: #f0f0f0;
        }
        
        .title-section {
          flex: 1;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .title-main {
          font-size: 18px;
          font-weight: bold;
          color: #0e4c92;
          margin-bottom: 4px;
        }
        
        .title-sub {
          font-size: 14px;
          color: #0e4c92;
          margin-bottom: 12px;
        }
        
        .rounds-info {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 12px;
        }
        
        .round-badge {
          background: #0e4c92;
          color: white;
          padding: 4px 8px;
          border-radius: 3px;
          font-weight: 600;
        }

        .tables-wrapper {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: white;
        }

        .table-group {
          flex: 1;
        }

        .table-title {
          background: #0e4c92;
          color: white;
          padding: 10px;
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 0;
          text-align: center;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #0e4c92;
        }

        thead tr {
          background: #0e4c92;
          color: white;
        }

        th {
          padding: 8px 4px;
          text-align: center;
          font-weight: 600;
          font-size: 11px;
          border-right: 1px solid #062a57;
          border-bottom: 1px solid #062a57;
        }

        th:first-child {
          text-align: left;
          border-left: none;
        }

        tbody tr {
          background: white;
        }

        tbody tr:nth-child(even) {
          background: #f9f9f9;
        }

        td {
          padding: 6px 4px;
          font-size: 12px;
          border-right: 1px solid #ddd;
        }

        td:first-child {
          text-align: left;
          font-weight: 500;
          padding-left: 8px;
        }

        .footer {
          background: linear-gradient(to top, #e31e24 0%, #e31e24 15%, #0e4c92 15%, #0e4c92 100%);
          color: white;
          padding: 16px;
          text-align: center;
          font-weight: bold;
          font-size: 13px;
          position: relative;
          margin-top: 20px;
        }

        .footer-text {
          font-size: 12px;
          margin-top: 4px;
        }

        .footer-source {
          position: absolute;
          right: 20px;
          bottom: 16px;
          font-size: 11px;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header-top">
          MÉTRICAS SÉRIE B - TEMPORADA ${seasonYear}
        </div>
        
        <div class="header-subtitle">
          CADJU - CENTRO DE ANÁLISE DE DESEMPENHO DENTALEZA
        </div>

        <div class="content">
          <div class="main-section">
            <div class="logo-section">
              <div class="logo-box">FORTALEZA</div>
            </div>

            <div class="title-section">
              <div class="title-main">TEMPORADA ${seasonYear} FORTALEZA</div>
              <div class="title-sub">MÉTRICAS SÉRIE B</div>
              <div class="rounds-info">
                ${displayRounds.map(r => {
                  const match = r.match(/r(\d+)/);
                  const num = match ? match[1] : r;
                  return `<div class="round-badge">${num}</div>`;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="tables-wrapper">
            <div class="table-group">
              <div class="table-title">MÉTRICAS OFENSIVAS</div>
              <table>
                <thead>
                  <tr>
                    <th>ROD.38 (FORTALEZA)</th>
                    ${roundNumberHeaders}
                  </tr>
                </thead>
                <tbody>
                  ${offensiveRows}
                </tbody>
              </table>
            </div>

            <div class="table-group">
              <div class="table-title">MÉTRICAS DEFENSIVAS</div>
              <table>
                <thead>
                  <tr>
                    <th>ROD.38 (FORTALEZA 2026)</th>
                    ${roundNumberHeaders}
                  </tr>
                </thead>
                <tbody>
                  ${defensiveRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="footer">
          CENTRO DE ANÁLISE DE DESEMPENHO DO FORTALEZA
          <div class="footer-text"></div>
          <div class="footer-source">FONTE: MATCHDATA</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
