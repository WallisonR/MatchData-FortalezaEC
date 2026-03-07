# MatchData - Fortaleza Esporte Clube - TODO

## Fase 1: Modelagem e Backend

### Banco de Dados
- [x] Criar tabela `clubs` com informações do Fortaleza
- [x] Criar tabela `players` com posição, número e dados pessoais
- [x] Criar tabela `matches` com informações de partidas
- [x] Criar tabela `player_stats` com estatísticas por jogador/partida
- [x] Criar tabela `team_stats` com agregados por partida
- [x] Criar tabela `kpi_targets` com metas G2 e G6 fixas
- [x] Criar tabela `kpi_values` com valores reais dos KPIs
- [x] Criar tabela `performance_goals` para metas individuais/coletivas
- [x] Executar migrations no banco

### APIs Backend
- [x] API de autenticação (já existe via Manus OAuth)
- [x] CRUD de jogadores
- [x] CRUD de partidas
- [x] CRUD de metas
- [x] Endpoints de estatísticas e KPIs
- [ ] Endpoint de importação Excel (KPIS.xlsx)
- [x] Endpoints de análise comparativa
- [ ] Endpoint de geração de PDF
- [x] Validação de dados e tratamento de erros

## Fase 2: Frontend - Estrutura e Tema

### Configuração Visual
- [ ] Implementar cores do Fortaleza (#0E4C92, #E31E24, #FFFFFF)
- [ ] Configurar tema dark mode com acentos
- [ ] Adicionar logo do Fortaleza
- [ ] Criar componentes base com identidade visual
- [ ] Configurar Tailwind com cores customizadas

### Layout e Navegação
- [ ] Criar layout principal com sidebar
- [ ] Implementar navegação entre módulos
- [ ] Criar header com informações do usuário
- [ ] Implementar responsive design
- [ ] Adicionar footer com marca do clube

## Fase 3: Dashboard Principal

### Visualização de KPIs
- [ ] Tabela de KPIs Ofensivos (azul)
- [ ] Tabela de KPIs Defensivos (vermelho)
- [ ] Tabela de KPIs Gerais (amarelo)
- [ ] Exibir Metas G2, Metas G6, Média FEC, Rodada Atual
- [ ] Gráficos de comparação com Recharts
- [ ] Indicadores de progresso vs metas
- [ ] Filtros por período, jogador e competição

### Gráficos Interativos
- [ ] Gráfico de linha - Evolução de KPIs ao longo do tempo
- [ ] Gráfico de barras - Comparação entre períodos
- [ ] Gráfico de radar - Perfil ofensivo vs defensivo
- [ ] Gráfico de área - Tendências
- [ ] Heatmap de desempenho de jogadores

## Fase 4: Gestão de Jogadores

### CRUD de Jogadores
- [ ] Página de listagem de jogadores
- [ ] Formulário de cadastro de novo jogador
- [ ] Formulário de edição de jogador
- [ ] Exclusão de jogador
- [ ] Busca e filtros (por posição, número, etc)

### Perfil do Jogador
- [ ] Visualização de dados pessoais
- [ ] Histórico de estatísticas
- [ ] Gráficos de evolução individual
- [ ] Comparação com média do time
- [ ] Análise de desempenho por competição

## Fase 5: Metas e Acompanhamento

### Definição de Metas
- [ ] Página de configuração de metas
- [ ] Definir metas individuais por jogador
- [ ] Definir metas coletivas por período
- [ ] Atribuir pesos aos KPIs
- [ ] Histórico de metas anteriores

### Acompanhamento
- [ ] Dashboard de progresso vs metas
- [ ] Alertas de desvio significativo
- [ ] Relatório de cumprimento de metas
- [ ] Projeção de resultado final
- [ ] Comparação G2 vs G6

## Fase 6: Análise Comparativa

### Comparações
- [ ] Jogador vs Jogador (mesma posição)
- [ ] Período vs Período (mesma competição)
- [ ] Clube vs Série A (dados de referência)
- [ ] Evolução temporal com gráficos
- [ ] Exportar comparações em PDF

### Filtros Avançados
- [ ] Filtrar por posição
- [ ] Filtrar por período
- [ ] Filtrar por competição
- [ ] Filtrar por intervalo de datas
- [ ] Salvar filtros personalizados

## Fase 7: Importação de Dados

### Excel Upload
- [ ] Página de upload de KPIS.xlsx
- [ ] Parser do arquivo Excel
- [ ] Validação de estrutura
- [ ] Mapeamento de dados para banco
- [ ] Feedback de sucesso/erro
- [ ] Histórico de importações

### Processamento
- [ ] Extrair dados de todas as abas
- [ ] Validar integridade dos dados
- [ ] Atualizar KPIs no banco
- [ ] Recalcular metas e projeções
- [ ] Notificar usuário de conclusão

## Fase 8: Geração de Relatórios PDF

### Relatório Completo
- [ ] Cabeçalho com logo do Fortaleza
- [ ] Resumo executivo com KPIs principais
- [ ] Tabelas de KPIs (ofensivo, defensivo, geral)
- [ ] Gráficos de análise
- [ ] Comparações com metas
- [ ] Análise de tendências
- [ ] Rodapé com data e assinatura

### Personalização
- [ ] Seleção de período para relatório
- [ ] Seleção de jogadores para incluir
- [ ] Seleção de KPIs para exibir
- [ ] Temas de cores (Fortaleza)
- [ ] Download automático

## Fase 9: Painel de Estatísticas em Tempo Real

### Estatísticas Gerais
- [ ] Total de partidas
- [ ] Vitórias, empates, derrotas
- [ ] Gols marcados/sofridos
- [ ] Média de posse
- [ ] Média de passes

### Por Jogador
- [ ] Gols marcados
- [ ] Assistências
- [ ] Cartões
- [ ] Minutos jogados
- [ ] Rating de desempenho

### Filtros
- [ ] Por período
- [ ] Por jogador
- [ ] Por competição
- [ ] Por posição
- [ ] Por intervalo de datas

## Fase 10: Funcionalidades Finais

### Testes
- [ ] Testes unitários do backend
- [ ] Testes de integração
- [ ] Testes do frontend
- [ ] Testes de performance
- [ ] Testes de responsividade

### Documentação
- [ ] README do projeto
- [ ] Guia de instalação
- [ ] Documentação da API
- [ ] Guia do usuário
- [ ] Troubleshooting

### Deployment
- [ ] Configurar variáveis de ambiente
- [ ] Setup do banco de dados
- [ ] Build do projeto
- [ ] Deploy no Manus
- [ ] Testes em produção

### Melhorias UX
- [ ] Animações e transições
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Confirmações de ação

