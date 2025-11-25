import { Button, Icon, Layout } from "@stellar/design-system";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { Routes, Route, Outlet, NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Scaffold from "./pages/Scaffold.tsx";
import Debugger from "./pages/Debugger.tsx";
import Disputes from "./pages/Disputes";
import CategoryAmount from "./pages/CategoryAmount";
import LoadingDisputes from "./pages/LoadingDisputes";
import DisputeOverview from "./pages/DisputeOverview";
import ClaimantEvidence from "./pages/ClaimantEvidence";
import DefendantEvidence from "./pages/DefendantEvidence";
import Vote from "./pages/Vote";

const AppLayout: React.FC = () => (
  <main>
    <Layout.Header
      projectId="Noir App"
      projectTitle="Noir App"
      contentRight={
        <>
          <nav>
            <NavLink
              to="/debug"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button variant="tertiary" size="md" disabled={isActive}>
                  <Icon.Code02 size="md" />
                  Debugger
                </Button>
              )}
            </NavLink>
          </nav>
          <ConnectAccount />
        </>
      }
    />
    <Outlet />
    <Layout.Footer>
      <span>
        © {new Date().getFullYear()} Noir App. Licensed under the{" "}
        <a
          href="http://www.apache.org/licenses/LICENSE-2.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Apache License, Version 2.0
        </a>
        .
      </span>
    </Layout.Footer>
  </main>
);

// Componente para prefetching de rutas
const PrefetchRoutes: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Prefetch de rutas relacionadas basado en la ruta actual
    const prefetchRoutes = async () => {
      if (location.pathname.includes("/dispute-overview")) {
        // Prefetch de la siguiente pantalla
        await import("./pages/ClaimantEvidence");
        // Preload también los componentes necesarios
        await Promise.all([
          import("./components/claimant-evidence/ClaimantInfoCard"),
          import("./components/claimant-evidence/DemandDetailSection"),
          import("./components/claimant-evidence/EvidenceList"),
        ]);
      } else if (location.pathname.includes("/claimant-evidence")) {
        // Prefetch de la pantalla anterior y siguiente
        await Promise.all([
          import("./pages/DisputeOverview"),
          import("./pages/DefendantEvidence"),
        ]);
      } else if (location.pathname.includes("/defendant-evidence")) {
        // Prefetch de la pantalla anterior y siguiente
        await Promise.all([
          import("./pages/ClaimantEvidence"),
          import("./pages/DisputeOverview"),
          import("./pages/Vote"),
        ]);
      } else if (location.pathname.includes("/vote")) {
        // Prefetch de la pantalla anterior
        await Promise.all([
          import("./pages/DefendantEvidence"),
          import("./pages/ClaimantEvidence"),
        ]);
      }
    };

    void prefetchRoutes();
  }, [location.pathname]);

  return null;
};

function App() {
  return (
    <>
      <PrefetchRoutes />
      <Routes>
        {/* Disputes page without main layout (mobile-first design) */}
        <Route path="/disputes" element={<Disputes />} />
        <Route path="/category-amount" element={<CategoryAmount />} />

        {/* Pass ID to loading screen so it knows where to go next */}
        <Route path="/loading-disputes/:id" element={<LoadingDisputes />} />

        {/* Add IDs to the flow pages */}
        <Route path="/dispute-overview/:id" element={<DisputeOverview />} />
        <Route path="/claimant-evidence/:id" element={<ClaimantEvidence />} />
        <Route path="/defendant-evidence/:id" element={<DefendantEvidence />} />
        <Route path="/vote/:id" element={<Vote />} />

        {/* Other pages with main layout */}
        <Route path="/" element={<Disputes />} />
        <Route element={<AppLayout />}>
          <Route path="/scaffold" element={<Scaffold />} />
          <Route path="/debug" element={<Debugger />} />
          <Route path="/debug/:contractName" element={<Debugger />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
