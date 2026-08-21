import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Tracker from "./pages/Tracker";

type TrackerPage = "overview" | "applications" | "resumes" | "skill-match" | "analytics" | "profile";

function DashboardPage({ page }: { page: TrackerPage }) {
  return (
    <DashboardLayout>
      <Tracker page={page} />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={() => <DashboardPage page="overview" />} />
      <Route path={"/applications"} component={() => <DashboardPage page="applications" />} />
      <Route path={"/resumes"} component={() => <DashboardPage page="resumes" />} />
      <Route path={"/skill-match"} component={() => <DashboardPage page="skill-match" />} />
      <Route path={"/analytics"} component={() => <DashboardPage page="analytics" />} />
      <Route path={"/profile"} component={() => <DashboardPage page="profile" />} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
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
