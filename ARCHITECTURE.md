# MatchData - Fortaleza Esporte Clube
## Arquitetura e Especificação Técnica

### 🎨 Identidade Visual
- **Cor Primária (Azul)**: #0E4C92
- **Cor Secundária (Vermelho)**: #E31E24
- **Cor Neutra**: #FFFFFF (branco)
- **Tema**: Dark mode com acentos nas cores do clube

### 📊 Estrutura de KPIs

#### OFENSIVOS (Tabela Azul)
1. **Pontos** - Meta G2: 65.4 | Meta G6: 60.8
2. **Média de Gols** - Meta G2: 1.23 | Meta G6: 1.244
3. **XG (Expected Goals)** - Meta G2: 1.302 | Meta G6: 1.33
4. **Posse %** - Meta G2: 51% | Meta G6: 50%
5. **% de jogos que marcou** - Meta G2: 76% | Meta G6: 72%
6. **Finalização/90min** - Meta G2: 12.4 | Meta G6: 12.2
7. **% Finalização Certa/90min** - Meta G2: 35% | Meta G6: 33%
8. **Finalização de Dentro da área/90min** - Meta G2: 8 | Meta G6: 6.2
9. **Cruzamentos % Acerto** - Meta G2: 34% | Meta G6: 35%
10. **Entradas da Área/por 90 min** - Meta G2: 22 | Meta G6: 21
11. **Toques na área/90min** - Meta G2: 15 | Meta G6: 15

#### DEFENSIVOS (Tabela Vermelha)
1. **Média de Gols Sofridos** - Meta G2: 0.88 | Meta G6: 0.92
2. **XG Contra** - Meta G2: 0.97 | Meta G6: 1.10
3. **Posse Contra** - Meta G2: 49% | Meta G6: 50%
4. **% de jogos que não sofreu gols** - Meta G2: 45% | Meta G6: 38%
5. **Finalização Sofrida/90min** - Meta G2: 11 | Meta G6: 12
6. **% Finalização CertaSofrida/90min** - Meta G2: 32% | Meta G6: 31%
7. **Finalização de Dentro da área Sofrida/90min** - Meta G2: 6 | Meta G6: 6
8. **Cruzamentos % Acerto Sofridos** - Meta G2: 31% | Meta G6: 34%
9. **Entradas da Área Sofrida/por 90 min** - Meta G2: 19 | Meta G6: 18
10. **Toques na área Sofridos/90min** - Meta G2: 12 | Meta G6: 13

#### GERAIS (Tabela Amarela)
1. **Intensidade de Jogo** - G2: 16 | G6: 15
2. **% Duelos Ofensivos** - G2: 41% | G6: 42%
3. **% Duelos Defensivos** - G2: 61% | G6: 59%
4. **% Duelos Aéreos** - G2: 47% | G6: 46%
5. **Recuperações Altas/Médias** - G2: 44 | G6: 42
6. **PPDA** - G2: 10 | G6: 10
7. **Média de Passes/por jogo** - G2: 395 | G6: 374
8. **% Acerto de Passes** - G2: 83% | G6: 82%

### 🗄️ Estrutura de Banco de Dados

#### Tabelas Principais

**clubs**
- id (PK)
- name: "Fortaleza Esporte Clube"
- logo_url
- primary_color: #0E4C92
- secondary_color: #E31E24
- created_at

**players**
- id (PK)
- club_id (FK)
- name
- position (GK, DEF, MID, FWD)
- number
- birth_date
- nationality
- height
- weight
- created_at
- updated_at

**matches**
- id (PK)
- club_id (FK)
- date
- opponent
- competition
- result (W/D/L)
- goals_for
- goals_against
- created_at

**player_stats** (por partida)
- id (PK)
- player_id (FK)
- match_id (FK)
- minutes_played
- goals
- assists
- shots
- shots_on_target
- passes
- pass_accuracy
- tackles
- interceptions
- fouls
- yellow_cards
- red_cards

**team_stats** (agregado por partida)
- id (PK)
- match_id (FK)
- club_id (FK)
- possession_pct
- shots
- shots_on_target
- passes
- pass_accuracy
- tackles
- interceptions
- fouls
- corners
- offsides

**kpi_targets** (metas fixas)
- id (PK)
- club_id (FK)
- kpi_name
- meta_g2
- meta_g6
- unit
- category (OFFENSIVE, DEFENSIVE, GENERAL)

**kpi_values** (valores reais)
- id (PK)
- match_id (FK)
- kpi_id (FK)
- value
- period (1T, 2T, FULL)

### 🎯 Funcionalidades Principais

1. **Dashboard Principal**
   - Visualização de KPIs em tempo real
   - Gráficos interativos (Recharts)
   - Comparação com metas G2 e G6
   - Filtros por período, jogador e competição

2. **Gestão de Jogadores**
   - CRUD completo
   - Histórico de estatísticas
   - Análise individual

3. **Metas e Acompanhamento**
   - Definição de metas por período
   - Progresso em tempo real
   - Alertas de desvio

4. **Análise Comparativa**
   - Jogador vs Jogador
   - Período vs Período
   - Clube vs Série A (dados de referência)

5. **Relatórios PDF**
   - Geração automática
   - Marca do Fortaleza EC
   - Gráficos e análises

6. **Importação Excel**
   - Upload de KPIS.xlsx
   - Processamento automático
   - Validação de dados

### 🔐 Autenticação
- JWT com Manus OAuth
- Multi-tenant (um clube por instância)
- Roles: admin, analyst, coach

### 📱 Responsividade
- Mobile-first
- Breakpoints: 640px, 768px, 1024px, 1280px
- Temas: Light/Dark com cores do Fortaleza

### 🚀 Stack Técnico
- **Backend**: Python/FastAPI (conforme MatchData) → React/Express (template)
- **Frontend**: React 19 + Tailwind 4 + Recharts
- **Database**: MySQL/TiDB
- **PDF**: ReportLab/WeasyPrint
- **Excel**: openpyxl
- **Deployment**: Manus

