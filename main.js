const AppLayout = () => {
  const [activeTab, setActiveTab] = useState('lists');
  return (
    <div className="flex justify-center bg-white sm:bg-zinc-100 min-h-[100dvh]">
      <div className="w-full sm:max-w-md bg-white h-[100dvh] flex flex-col relative sm:shadow-xl overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {activeTab === 'lists' && <ListsView />}
          {activeTab === 'library' && <LibraryView />}
          {activeTab === 'stats' && <StatsView />}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-zinc-200 pb-safe">
          <div className="flex justify-around items-center px-2 py-2">
            {[
              { id: 'lists', icon: List, label: 'Listelerim' },
              { id: 'library', icon: Library, label: 'Kütüphanem' },
              { id: 'stats', icon: BarChart3, label: 'Verilerim' }
            ].map(tab => (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all w-20 ${activeTab === tab.id ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'mb-1' : 'mb-1'} />
                <span className={`text-[10px] uppercase tracking-wide transition-all ${activeTab === tab.id ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('Uygulama hatası:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] flex flex-col items-center justify-center bg-white text-center p-6 gap-3">
          <AlertCircle size={40} className="text-red-500" />
          <h2 className="font-bold text-zinc-800">Bir şeyler ters gitti</h2>
          <p className="text-sm text-zinc-500">Sayfayı yenilemeyi deneyin. Verileriniz tarayıcınızda saklı kalmaya devam eder.</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium">Sayfayı Yenile</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppLayoutWithDnd = () => {
  const { moveBookToPosition } = useArchive();
  return (
    <DragDropProvider onDrop={moveBookToPosition}>
      <AppLayout />
    </DragDropProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ArchiveProvider><AppLayoutWithDnd /></ArchiveProvider>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);
