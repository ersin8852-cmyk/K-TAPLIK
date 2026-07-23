const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const SearchAddModal = ({ isOpen, onClose, folderId, onOpenManualAdd }) => {
  const { addBook, showToast } = useArchive();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery(''); setResults([]); setHasSearched(false); setShowCamera(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!showCamera) return;

    let isComponentMounted = true;
    
    let html5Scanner = null;
    let zxingScanner = null;
    let optimizeTimeout = null;

    const onScanSuccess = (decodedText) => {
      if (!isComponentMounted) return;
      setQuery(decodedText); 
      setShowCamera(false);
      
      if (html5Scanner && html5Scanner.isScanning) html5Scanner.stop().catch(() => {});
      if (zxingScanner) zxingScanner.reset();
      
      performSearch(decodedText);
    };

    const safelyApplyConstraints = async (track, constraints) => {
      try {
        const current = track.getConstraints();
        await track.applyConstraints({ ...current, ...constraints });
        return true;
      } catch (e) {
        try {
          const current = track.getConstraints();
          await track.applyConstraints({ ...current, advanced: [constraints] });
          return true;
        } catch (e2) {
          return false;
        }
      }
    };

    const optimizeOpenedCamera = async (track) => {
      if (!track || !isComponentMounted) return;
      try {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        let newConstraints = {};
        
        if (capabilities.focusDistance) newConstraints.focusDistance = { ideal: capabilities.focusDistance.min || 0 };
        else if (capabilities.focusMode?.includes("macro")) newConstraints.focusMode = "macro";
        else if (capabilities.focusMode?.includes("continuous")) newConstraints.focusMode = "continuous";

        if (capabilities.exposureMode?.includes("continuous")) newConstraints.exposureMode = "continuous";
        if (capabilities.whiteBalanceMode?.includes("continuous")) newConstraints.whiteBalanceMode = "continuous";

        if (capabilities.zoom) {
          const maxZoom = capabilities.zoom.max || 2;
          newConstraints.zoom = Math.min(2, maxZoom);
        }

        if (Object.keys(newConstraints).length > 0) {
          await safelyApplyConstraints(track, newConstraints);
        }
      } catch (err) {}
    };

    if (isIOS && window.ZXing) {
      console.log("iOS tespit edildi, ZXing başlatılıyor...");
      zxingScanner = new window.ZXing.BrowserMultiFormatReader();
      scannerRef.current = {
        stop: async () => zxingScanner.reset(),
        isScanning: true
      };

      zxingScanner.decodeFromVideoDevice(null, 'zxing-reader', (result, err) => {
        if (!isComponentMounted) return;
        if (result) {
          onScanSuccess(result.getText());
        }
      }).catch(err => {
        console.warn("ZXing başlatılamadı:", err);
        if (isComponentMounted) {
          setShowCamera(false);
          showToast('Kamera başlatılamadı.', 'error');
        }
      });

      const applyZXingZoom = () => {
        if (!isComponentMounted) return;
        const videoEl = document.getElementById("zxing-reader");
        if (videoEl && videoEl.srcObject) {
          const track = videoEl.srcObject.getVideoTracks()[0];
          if (track) {
             optimizeOpenedCamera(track);
             return;
          }
        }
        optimizeTimeout = setTimeout(applyZXingZoom, 300);
      };
      applyZXingZoom();

    } else {
      console.log("Android/Diğer tespit edildi, Html5Qrcode başlatılıyor...");
      html5Scanner = new window.Html5Qrcode("reader");
      scannerRef.current = html5Scanner;

      const fallbackCameraStrategy = async () => {
        if (!isComponentMounted) return;
        try {
          await html5Scanner.start(
            { facingMode: "environment" }, 
            { fps: 15 },
            onScanSuccess,
            () => {}
          );
        } catch (err) {
          setShowCamera(false);
          showToast('Kamera hiçbir şekilde başlatılamadı.', 'error');
        }
      };

      const createCameraStream = async () => {
        try {
          await html5Scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 300, height: 180 },
              videoConstraints: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
            },
            onScanSuccess,
            () => {}
          );
          
          if (!isComponentMounted) return;
          const videoEl = document.querySelector("#reader video");
          if (videoEl && videoEl.srcObject) {
            const track = videoEl.srcObject.getVideoTracks()[0];
            if (track) await optimizeOpenedCamera(track);
          }
        } catch (err) {
          await fallbackCameraStrategy();
        }
      };

      createCameraStream();
    }

    return () => {
      isComponentMounted = false;
      if (optimizeTimeout) clearTimeout(optimizeTimeout);
      if (html5Scanner && html5Scanner.isScanning) {
        html5Scanner.stop().catch(() => {});
      }
      if (zxingScanner) {
        zxingScanner.reset();
      }
    };
  }, [showCamera]);

  const performSearch = async (searchQuery) => {
    const q = (searchQuery ?? query).trim();
    if (!q) return;
    setLoading(true); setResults([]); setHasSearched(true);
    const cleanQuery = q.replace(/[- ]/g, '');
    const isIsbn = q.length > 0 && /^\d{10,13}$/.test(cleanQuery);
    try {
      const items = isIsbn ? await window.api.fetchByIsbn(cleanQuery) : await window.api.fetchByTitle(q);
      setResults(items);
      if (items.length === 0) showToast('Sonuç bulunamadı.', 'error');
    } catch (err) {
      showToast('Arama başarısız oldu.', 'error');
    }
    setLoading(false);
  };

  const handleAdd = (book) => { addBook(book, folderId); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] shadow-2xl animate-in slide-in-from-bottom-10">
        <div className="p-4 border-b flex justify-between items-center bg-zinc-50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-800">Yeni Kitap Ekle</h2>
            <button onClick={() => { if(onOpenManualAdd) onOpenManualAdd(); }} className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-full hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus size={14} /> Manuel Ekle
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-4 flex flex-col gap-3 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-zinc-400" size={18} />
              <input type="text" placeholder="Kitap Adı veya ISBN..." className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-800 bg-zinc-50 text-sm" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && performSearch()} />
            </div>
            <button onClick={() => setShowCamera(!showCamera)} className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center ${showCamera ? 'bg-red-50 text-red-600 border-red-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'}`}>
              <Camera size={20} />
            </button>
          </div>
          <button onClick={() => performSearch()} disabled={loading || !query.trim()} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium transition-colors disabled:opacity-50">
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
        {showCamera && (
          <div className="px-4 pb-2 shrink-0">
            <div className="bg-black rounded-xl overflow-hidden shadow-inner relative flex justify-center">
              {!isIOS ? (
                <div id="reader" className="w-full"></div>
              ) : (
                <video id="zxing-reader" className="w-full" autoPlay playsInline muted></video>
              )}
              <p className="absolute bottom-2 w-full text-center text-white text-xs z-10 bg-black/50 py-1">Kitabın barkodunu okutun</p>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50">
          {loading ? (
            <div className="text-center py-8 text-zinc-500 text-sm animate-pulse">Veritabanlarında aranıyor...</div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-3">
              {results.map((book, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-zinc-200 flex justify-between items-center shadow-sm gap-3">
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    {book.cover ? <img src={book.cover} alt="" className="w-10 h-14 object-cover rounded-md border border-zinc-200 shrink-0 bg-zinc-100" /> : <div className="w-10 h-14 bg-zinc-100 rounded-md border border-zinc-200 shrink-0 flex items-center justify-center"><BookOpen size={14} className="text-zinc-300" /></div>}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-800 leading-tight mb-1 truncate">{book.title}</h3>
                      <p className="text-xs text-zinc-500 mb-0.5 truncate">{book.author} • {book.publisher}</p>
                      <p className="text-[10px] text-zinc-400">ISBN: {book.isbn || 'Yok'} | {book.pageCount || 0} Sayfa</p>
                    </div>
                  </div>
                  <button onClick={() => handleAdd(book)} className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors shrink-0"><Plus size={20} /></button>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="h-full flex flex-col items-center justify-center py-8 text-zinc-400 text-sm gap-2"><WifiOff size={32} className="opacity-20" /><p>Sonuç bulunamadı. Farklı bir arama deneyin.</p></div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-8 text-zinc-400 text-sm gap-2"><Search size={32} className="opacity-20" /><p>Sonuçları görmek için arama yapın.</p></div>
          )}
        </div>
      </div>
    </div>
  );
};
