import { Navigate, Route, Routes } from "react-router-dom";
import SideBarMenu, { SIDEBAR_MARGIN } from "./components/SideBarMenu";
import ScanView from "./components/Views/ScanView";
import ResultsView from "./components/Views/ResultsView";
import DashboardView from "./components/Views/DashboardView";
import HistoryView from "./components/Views/HistoryView";
import ModalManager from "./components/ModalManager";
import { ROUTES } from "./models/constant";

function App() {
  return (
    <div className="min-h-screen bg-linear-to-b from-white via-slate-50 to-blue-50/40 text-slate-900">
      <SideBarMenu />
      <div className={`min-h-screen ${SIDEBAR_MARGIN}`}>
        <ModalManager />
        <main className="flex min-h-screen flex-col">
          <Routes>
            <Route path={ROUTES.SCAN} element={<ScanView />} />
            <Route path={ROUTES.DUPLICATES} element={<ResultsView />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardView />} />
            <Route path={ROUTES.HISTORY} element={<HistoryView />} />
            <Route path="*" element={<Navigate to={ROUTES.SCAN} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
