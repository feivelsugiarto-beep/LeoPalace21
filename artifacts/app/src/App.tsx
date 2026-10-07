import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import RegisterPage from "@/pages/register";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/register" component={RegisterPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}
