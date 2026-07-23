const StatBox = ({ label, value }) => (
  <div className="bg-white border border-zinc-100 p-4 rounded-xl flex flex-col justify-center shadow-sm">
    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">{label}</span>
    <span className="text-lg font-bold text-zinc-900 truncate">{value}</span>
  </div>
);

const StatsView = () => {
  const { books, folders, importData, showToast } = useArchive();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const dataStr = JSON.stringify({ books, folders }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `kutuphane_yedegi_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Yedekleme dosyası cihazınıza indirildi.');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        importData(parsed);
      } catch (err) {
        showToast('Dosya okunamadı veya geçersiz format.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const stats = useMemo(() => {
    const libBooks = books.filter(b => b.inLibrary);
    const calc = (arr) => {
      if (arr.length === 0) return null;
      let totalPages = 0, totalPrice = 0, longest = arr[0], shortest = arr[0];
      const authors = {};
      arr.forEach(b => {
        const p = parseInt(b.pageCount) || 0;
        totalPages += p; totalPrice += parseFloat(b.price) || 0;
        if (p > (parseInt(longest.pageCount) || 0)) longest = b;
        if (p > 0 && (parseInt(shortest.pageCount) || 0) === 0) shortest = b;
        else if (p > 0 && p < (parseInt(shortest.pageCount) || Infinity)) shortest = b;
        if (b.author) authors[b.author] = (authors[b.author] || 0) + 1;
      });
      let favAuth = '-', max = 0;
      Object.entries(authors).forEach(([a, c]) => { if (c > max) { max = c; favAuth = a; } });
      
      const isShortestValid = (parseInt(shortest.pageCount) || 0) > 0;
      
      return { 
        total: arr.length, 
        pages: totalPages, 
        avg: Math.round(totalPages/arr.length)||0, 
        long: longest.title||'-', 
        short: isShortestValid ? shortest.title : '-', 
        fav: favAuth, 
        price: totalPrice 
      };
    };
    
    const listS = calc(books) || { total: 0, pages: 0, avg: 0, long: '-', short: '-', fav: '-', price: 0 };
    const libS = calc(libBooks) || { total: 0, pages: 0, avg: 0, long: '-', short: '-', fav: '-', price: 0 };
    const read = libBooks.filter(b => b.isRead);
    const unread = libBooks.filter(b => !b.isRead);
    const rPages = read.reduce((s, b) => s + (parseInt(b.pageCount)||0), 0);
    const uPages = unread.reduce((s, b) => s + (parseInt(b.pageCount)||0), 0);
    return { list: listS, lib: libS, read: { rCount: read.length, rPages, uCount: unread.length, uPages } };
  }, [books]);

  return (
    <div className="h-full flex flex-col bg-zinc-50">
      <div className="p-4 pt-6 pb-3 sticky top-0 bg-zinc-50/90 backdrop-blur-md z-10 border-b border-zinc-200">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Verilerim</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        <section>
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5"><List size={16} className="text-zinc-400"/> Listelerim</h2>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Toplam Kitap" value={stats.list.total} />
            <StatBox label="Toplam Sayfa" value={stats.list.pages.toLocaleString()} />
            <StatBox label="Ort. Sayfa" value={stats.list.avg} />
            <StatBox label="Favori Yazar" value={stats.list.fav} />
            <div className="col-span-2 bg-white border border-zinc-100 p-3 rounded-xl shadow-sm">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">En Uzun Kitap</span>
                <span className="text-sm font-semibold text-zinc-800 truncate block">{stats.list.long}</span>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5"><Library size={16} className="text-zinc-400"/> Kütüphanem</h2>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Toplam Kitap" value={stats.lib.total} />
            <StatBox label="Toplam Değer" value={`₺${stats.lib.price.toLocaleString()}`} />
            <StatBox label="Toplam Sayfa" value={stats.lib.pages.toLocaleString()} />
            <StatBox label="Favori Yazar" value={stats.lib.fav} />
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5"><BookOpen size={16} className="text-zinc-400"/> Okuma (Kütüphane)</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 bg-zinc-900 p-4 rounded-xl flex items-center justify-between shadow-md">
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Okunan Kitap</p>
                <p className="text-xl font-bold text-white">{stats.read.rCount}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Okunan Sayfa</p>
                <p className="text-xl font-bold text-white">{stats.read.rPages.toLocaleString()}</p>
              </div>
            </div>
            <StatBox label="Okunmayan Kitap" value={stats.read.uCount} />
            <StatBox label="Okunmayan Sayfa" value={stats.read.uPages.toLocaleString()} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5"><Download size={16} className="text-zinc-400"/> Yedekleme & Geri Yükleme</h2>
          <div className="bg-white border border-zinc-100 p-4 rounded-xl shadow-sm flex flex-col gap-3">
            <p className="text-xs text-zinc-500 leading-relaxed">Uygulama verilerinizi cihazınıza dosya olarak indirebilir veya daha önce indirdiğiniz bir dosyayı (başka bir cihazdan) içeri aktarabilirsiniz.</p>
            <div className="flex gap-2">
              <button onClick={handleExport} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                <Download size={16} /> Yedekle
              </button>
              <button onClick={() => fileInputRef.current.click()} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
                <Upload size={16} /> Geri Yükle
              </button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
