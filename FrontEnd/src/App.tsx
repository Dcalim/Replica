import Header from "./components/Header";
import UploadView from "./components/Views/UploadView";
import ResultsView from "./components/Views/ResultsView";
import { VIEWS } from "./models/constant";
import { useAppSelector } from "./store/store";

function App() {
  const currentView = useAppSelector(state => state.ui.currentView);

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-white via-slate-50 to-blue-50/40 text-slate-900">
      <Header />
      <main className="flex flex-1 flex-col">
        {currentView === VIEWS.UPLOAD && <UploadView />}
        {currentView === VIEWS.RESULTS && <ResultsView />}
      </main>
    </div>
  );
}

export default App;
