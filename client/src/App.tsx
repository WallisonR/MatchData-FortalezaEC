import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Partidas from "./pages/Partidas";

function RootRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/dashboard", { replace: true });
  }, [setLocation]);

  return null;
}

function RequireLogin({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch("/api/session", { credentials: "include" });
        const data = await response.json();
        setAuthenticated(Boolean(data?.authenticated));
      } catch {
        setAuthenticated(false);
      } finally {
        setChecked(true);
      }
    };

    verify();
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!authenticated) {
      setLocation("/login", { replace: true });
    }
  }, [authenticated, checked, setLocation]);

  if (!checked) return null;
  if (!authenticated) return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={RootRedirect} />
      <Route path={"/login"} component={Login} />
      <Route path={"/dashboard"}>
        {() => (
          <RequireLogin>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </RequireLogin>
        )}
      </Route>
      <Route path={"/partidas"}>
        {() => (
          <RequireLogin>
            <DashboardLayout>
              <Partidas />
            </DashboardLayout>
          </RequireLogin>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
