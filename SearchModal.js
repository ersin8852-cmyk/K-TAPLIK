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
      
      const videoConstraints = {
        facingMode: "environment",
        // Geniş açı (ultra-wide) lenslerde genellikle auto-focus yeteneği yoktur.
        // Sürekli odaklanma (continuous) talep ederek tarayıcının ana lensi seçmesini teşvik ediyoruz.
        focusMode: "continuous",
        // Destekleyen tarayıcılarda zoom'u 1.0 (ana lens) seviyesinde zorlamayı dener
        advanced: [{ zoom: 1.0 }]
      };

      html5QrcodeScanner.start(
        videoConstraints,
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          setQuery(decodedText); setShowCamera(false);
          html5QrcodeScanner.stop().catch(() => {});
          performSearch(decodedText);
        },
        (errorMessage) => {}
      ).catch(err => {
        setShowCamera(false);
        showToast('Kamera başlatılamadı.', 'error');
      });
    }
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [showCamera]);

  const fetchByIsbn = async (isbn) => {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    const data = json[`ISBN:${isbn}`];
    if (!data) return [];
    return [{
      isbn, title: data.title || 'Bilinmeyen Kitap',
      author: (data.authors || []).map(a => a.name).join(', ') || 'Bilinmeyen Yazar',
      publisher: (data.publishers || []).map(p => p.name).join(', ') || 'Yayınevi Belirtilmemiş',
      pageCount: data.number_of_pages || 0,
      year: (data.publish_date && data.publish_date.match(/\d{4}/)?.[0]) || '',
      price: '', cover: data.cover ? (data.cover.medium || data.cover.large || data.cover.small || '') : ''
    }];
  };

  const fetchByTitle = async (q, publisher) => {
    let searchQ = q || '';
    if (publisher && publisher.trim()) {
      searchQ = searchQ ? `${searchQ} publisher:"${publisher.trim()}"` : `publisher:"${publisher.trim()}"`;
    }
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQ)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,cover_edition_key,edition_key,isbn,publisher`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    const docs = json.docs || [];

    return await Promise.all(docs.map(async (doc) => {
      const cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '';
      const isbnCandidate = doc.isbn && doc.isbn[0];
      if (isbnCandidate) {
        try {
          const enriched = await fetchByIsbn(isbnCandidate);
          if (enriched.length && (enriched[0].publisher !== 'Yayınevi Belirtilmemiş' || enriched[0].pageCount)) {
            return { ...enriched[0], title: enriched[0].title || doc.title, author: enriched[0].author || doc.author_name?.join(', '), cover: enriched[0].cover || cover, year: enriched[0].year || doc.first_publish_year };
          }
        } catch (e) {}
      }
      const editionKey = doc.cover_edition_key || (doc.edition_key && doc.edition_key[0]);
      if (editionKey) {
        try {
          const eRes = await fetch(`https://openlibrary.org/books/${editionKey}.json`);
          if (eRes.ok) {
            const e = await eRes.json();
            const isbn = (e.isbn_13 && e.isbn_13[0]) || (e.isbn_10 && e.isbn_10[0]) || '';
            return { isbn, title: e.title || doc.title, author: doc.author_name?.join(', '), publisher: (e.publishers && e.publishers.join(', ')) || (doc.publisher && doc.publisher[0]) || 'Yayınevi Belirtilmemiş', pageCount: e.number_of_pages || 0, year: (e.publish_date && e.publish_date.match(/\d{4}/)?.[0]) || doc.first_publish_year || '', price: '', cover };
          }
        } catch (e) {}
      }
      return { isbn: '', title: doc.title, author: doc.author_name?.join(', '), publisher: (doc.publisher && doc.publisher[0]) || 'Yayınevi Belirtilmemiş', pageCount: 0, year: doc.first_publish_year || '', price: '', cover };
    }));
  };

  const performSearch = async (searchQuery) => {
    const q = (searchQuery ?? query).trim();
    const pub = publisherFilter.trim();
    if (!q && !pub) return;
    setLoading(true); setResults([]); setHasSearched(true);
    const cleanQuery = q.replace(/[- ]/g, '');
    const isIsbn = q.length > 0 && /^\d{10,13}$/.test(cleanQuery);
    try {
      const items = isIsbn ? await fetchByIsbn(cleanQuery) : await fetchByTitle(q, pub);
      setResults(items);
      if (items.length === 0) showToast('Sonuç bulunamadı.', 'error');
    } catch (err) {
      showToast('Arama başarısız oldu.', 'error');
    }
    setLoading(false);
  };

  const handleAdd = (book) => { if (addBook(book, folderId)) onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] shadow-2xl animate-in slide-in-from-bottom-10">
        <div className="p-4 border-b flex justify-between items-center bg-zinc-50">
          <h2 className="text-lg font-semibold text-zinc-800">Yeni Kitap Ekle</h2>
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
          <input type="text" placeholder="Yayınevi (opsiyonel filtre)..." className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-800 bg-zinc-50 text-sm" value={publisherFilter} onChange={e => setPublisherFilter(e.target.value)} onKeyDown={e => e.key === 'Enter' && performSearch()} />
          <button onClick={() => performSearch()} disabled={loading || (!query.trim() && !publisherFilter.trim())} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-medium transition-colors disabled:opacity-50">
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
        {showCamera && (
          <div className="px-4 pb-2 shrink-0">
            <div className="bg-black rounded-xl overflow-hidden shadow-inner relative">
              <div id="reader"></div>
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
