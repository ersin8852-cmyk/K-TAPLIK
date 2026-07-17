const SearchAddModal = ({ isOpen, onClose, folderId }) => {
  const { addBook, showToast } = useArchive();
  const [query, setQuery] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery(''); setPublisherFilter(''); setResults([]); setHasSearched(false); setShowCamera(false); setSearchStatus('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Gemini API çağrısı için model fonksiyonu
  const askGeminiForIsbn = async (searchQuery, publisher) => {
    // Vercel üzerinden tanımladığın ortam değişkenini kullanır
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Anahtarı bulunamadı! Vercel Environment Variables ayarlarını kontrol et.");
      return null;
    }
    
    const model = 'gemini-1.5-flash'; 
    const prompt = `Kitap: "${searchQuery}". Yayınevi: "${publisher}". Sadece 10 veya 13 haneli ISBN numarasını ver. Başka hiçbir şey yazma. Bilmiyorsan YOK yaz.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates.length > 0) {
        const textResponse = data.candidates[0].content.parts[0].text.trim().replace(/[- ]/g, '');
        if (/^\d{10,13}$/.test(textResponse)) return textResponse;
      }
    } catch (e) {
      console.warn("Gemini API hatası:", e);
    }
    return null;
  };

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
    if (publisher && publisher.trim()) searchQ = `${searchQ} publisher:"${publisher.trim()}"`;
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQ)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,cover_edition_key,edition_key,isbn,publisher`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    const docs = json.docs || [];
    return await Promise.all(docs.map(async (doc) => {
      const cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '';
      return { isbn: '', title: doc.title, author: doc.author_name?.join(', '), publisher: (doc.publisher && doc.publisher[0]) || 'Yayınevi Belirtilmemiş', pageCount: 0, year: doc.first_publish_year || '', price: '', cover };
    }));
  };

  const performSearch = async (searchQuery) => {
    const q = (searchQuery ?? query).trim();
    const pub = publisherFilter.trim();
    if (!q && !pub) return;
    
    setLoading(true); setResults([]); setHasSearched(true);
    const cleanQuery = q.replace(/[- ]/g, '');
    const isDirectIsbn = q.length > 0 && /^\d{10,13}$/.test(cleanQuery);
    
    try {
      if (isDirectIsbn) {
        setSearchStatus('Barkod/ISBN aranıyor...');
        const items = await fetchByIsbn(cleanQuery);
        setResults(items);
      } else {
        setSearchStatus('Yapay zeka (Gemini) ISBN bulmaya çalışıyor...');
        const geminiIsbn = await askGeminiForIsbn(q, pub);
        
        if (geminiIsbn) {
           setSearchStatus(`ISBN bulundu (${geminiIsbn}). Kitap getiriliyor...`);
           const items = await fetchByIsbn(geminiIsbn);
           setResults(items);
        } else {
           setSearchStatus('Klasik arama yapılıyor...');
           const fallbackItems = await fetchByTitle(q, pub);
           setResults(fallbackItems);
        }
      }
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-zinc-400" size={18} />
              <input type="text" placeholder="Kitap Adı, Yazar veya ISBN..." className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && performSearch()} />
            </div>
            <button onClick={() => setShowCamera(!showCamera)} className="p-2.5 rounded-xl border bg-zinc-100 text-zinc-600 border-zinc-200"><Camera size={20} /></button>
          </div>
          <input type="text" placeholder="Yayınevi (opsiyonel)..." className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm" value={publisherFilter} onChange={e => setPublisherFilter(e.target.value)} onKeyDown={e => e.key === 'Enter' && performSearch()} />
          <button onClick={() => performSearch()} disabled={loading} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl font-medium disabled:opacity-50">
            {loading ? searchStatus : 'Ara'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50">
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm gap-2">
               <div className="w-6 h-6 border-2 border-zinc-900 rounded-full animate-spin"></div>
               <p>{searchStatus}</p>
             </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-3">
              {results.map((book, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    {book.cover ? <img src={book.cover} className="w-10 h-14 object-cover rounded" /> : <div className="w-10 h-14 bg-zinc-100 rounded" />}
                    <div className="truncate"><h3 className="font-semibold truncate">{book.title}</h3><p className="text-xs text-zinc-500">{book.author}</p></div>
                  </div>
                  <button onClick={() => handleAdd(book)} className="p-2 bg-zinc-100 rounded-xl"><Plus size={20} /></button>
                </div>
              ))}
            </div>
          ) : hasSearched ? <p className="text-center text-zinc-400 mt-10">Sonuç bulunamadı.</p> : null}
        </div>
      </div>
    </div>
  );
};
