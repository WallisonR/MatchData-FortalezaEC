import { Button } from "@/components/ui/button";
import { Loader2, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col p-8 bg-background text-foreground">
      <main className="flex flex-col gap-8 max-w-4xl mx-auto">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="gap-2"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-4 h-4" />
                Escuro
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" />
                Claro
              </>
            )}
          </Button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">MatchData</h1>
          <p className="text-lg text-muted-foreground">Fortaleza Esporte Clube - Sistema de Análise de Dados</p>
        </div>

        {/* Hero Section */}
        <div className="bg-card rounded-lg shadow-lg p-8 border-l-4 border-l-primary">
          <h2 className="text-2xl font-bold text-foreground mb-4">Bem-vindo ao MatchData</h2>
          <p className="text-muted-foreground mb-6">
            Sistema completo de gestão de dados de desempenho do Fortaleza Esporte Clube.
            Acompanhe KPIs, registre partidas e analise estatísticas detalhadas.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/dashboard")}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Ir para o Dashboard
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg shadow p-6 border-t-4 border-t-primary">
            <h3 className="font-bold text-lg text-foreground mb-2">📊 Dashboard KPIs</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe métricas ofensivas, defensivas e gerais com metas G2 e G6.
            </p>
          </div>

          <div className="bg-card rounded-lg shadow p-6 border-t-4 border-t-accent">
            <h3 className="font-bold text-lg text-foreground mb-2">⚽ Histórico de Partidas</h3>
            <p className="text-sm text-muted-foreground">
              Registre e analise estatísticas detalhadas de cada partida.
            </p>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin text-primary" size={20} />
          <span></span>
        </div>
      </main>
    </div>
  );
}
