const SearchAddModal = ({ isOpen, onClose, folderId }) => {
  const { addBook, showToast } = useArchive();
  const [query, setQuery] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery(''); setPublisherFilter(''); setResults([]); setHasSearched(false); setShowCamera(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (showCamera) {
      const html5QrcodeScanner = new window.Html5Qrcode("reader");
      scannerRef.current = html5QrcodeScanner;
      html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          setQuery(decodedText); setShowCamera(false);
          html5QrcodeScanner.stop().catch(() => {});
          performSearch(decodedText);
        },
        (errorMessage) => {}
      ).catch(err => { setShowCamera(false); showToast('Kamera başlatılamadı.', 'error'); });
    }
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [showCamera]);

  const performSearch = async (searchQuery) => {
    const q = (searchQuery ?? query).trim();
    if (!q && !publisherFilter.trim()) return;
    setLoading(true); setResults([]); setHasSearched(true);
    
    try {
      // 1. Akıllı Barkod/ISBN Algılama
      const cleanQuery = q.replace(/[- ]/g, '');
      if (/^\d{10,13}$/.test(cleanQuery)) {
        const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanQuery}&format=json&jscmd=data`);
        const json = await res.json();
        const data = json[`ISBN:${cleanQuery}`];
        
        if (data) {
          setResults([{
            title: data.title || 'Bilinmeyen Kitap',
            author: data.authors?.map(a => a.name).join(', ') || 'Bilinmeyen Yazar',
            publisher: data.publishers?.map(p => p.name).join(', ') || 'Bilinmiyor',
            cover: data.cover?.medium || data.cover?.large || ''
          }]);
          setLoading(false);
          return;
        }
      }

      // 2. Normal Arama ve Popülerlik Sıralaması (sort=editions eklendi)
      let searchQ = q;
      if (publisherFilter.trim()) searchQ = `${searchQ} publisher:"${publisherFilter.trim()}"`;
      
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQ)}&limit=15&sort=editions`);
      const json = await res.json();
      
      const books = json.docs.map(doc => ({
        title: doc.title,
        author: doc.author_name?.join(', ') || 'Bilinmiyor',
        publisher: doc.publisher?.[0] || 'Bilinmiyor',
        cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : ''
      }));
      setResults(books);
    } catch (err) {
      showToast('Arama başarısız.', 'error');
    }
    setLoading(false);
  };

  const handleAdd = (book) => { if (addBook(book, folderId)) onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-zinc-50">
          <h2 className="text-lg font-semibold text-zinc-800">Yeni Kitap Ekle</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <input type="text" placeholder="Kitap veya ISBN..." className="flex-1 p-2.5 border rounded-xl bg-zinc-50 text-sm" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && performSearch()} />
            <button onClick={() => setShowCamera(!showCamera)} className="p-2.5 bg-zinc-100 rounded-xl"><Camera size={20} /></button>
          </div>
          <input type="text" placeholder="Yayınevi (opsiyonel)..." className="w-full p-2.5 border rounded-xl bg-zinc-50 text-sm" value={publisherFilter} onChange={e => setPublisherFilter(e.target.value)} onKeyDown={e => e.key === 'Enter' && performSearch()} />
          <button onClick={() => performSearch()} disabled={loading || (!query.trim() && !publisherFilter.trim())} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl disabled:opacity-50">
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
        {showCamera && <div className="px-4 pb-4"><div id="reader"></div></div>}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50">
          {loading ? <div className="text-center py-10">Aranıyor...</div> : results.map((book, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border mb-3 flex justify-between items-center">
              <div className="flex items-center gap-3 truncate">
                {book.cover && <img src={book.cover} className="w-10 h-14 object-cover rounded" />}
                <div className="truncate"><h3 className="font-semibold truncate">{book.title}</h3><p className="text-xs text-zinc-500">{book.author}</p></div>
              </div>
              <button onClick={() => handleAdd(book)} className="p-2 bg-zinc-100 rounded-xl"><Plus size={20} /></button>
            </div>
          ))}
          {(!loading && results.length === 0 && hasSearched) && (
            <p className="text-center text-zinc-400 mt-10">Sonuç bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
};
