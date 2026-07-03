import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import ScanView from "./components/Views/ScanView";
import ResultsView from "./components/Views/ResultsView";
import FeedbackModal from "./components/Views/FeedbackModal";
import { ROUTES } from "./models/constant";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-white via-slate-50 to-blue-50/40 text-slate-900">
      <Header />
      <FeedbackModal />
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path={ROUTES.SCAN} element={<ScanView />} />
          <Route path={ROUTES.RESULTS} element={<ResultsView />} />
          <Route path="*" element={<Navigate to={ROUTES.SCAN} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
