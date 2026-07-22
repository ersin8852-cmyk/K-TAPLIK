const BookDetailModal = ({ bookId, isOpen, onClose }) => {
  const { books, updateBook, deleteBook, folders, showToast, moveItemToPosition, processImageFile } = useArchive();
  const book = books.find(b => b.id === bookId);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showMove, setShowMove] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (book) { setFormData(book); setShowDeleteConfirm(false); setIsEditing(false); setShowMove(false); }
  }, [book?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !book) return null;

  const handleSave = () => {
    if (!formData.title || !formData.title.trim()) { showToast('Kitap başlığı boş olamaz.', 'error'); return; }
    updateBook(book.id, formData);
    setIsEditing(false);
  };

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const toggleLibrary = () => updateBook(book.id, { inLibrary: !book.inLibrary });
  const toggleRead = () => updateBook(book.id, { isRead: !book.isRead });
  const handleDelete = () => { deleteBook(book.id); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-40">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] sm:h-auto animate-in slide-in-from-bottom-10">
        <div className="p-4 border-b flex justify-between items-start bg-zinc-50 relative gap-3">
          {isEditing ? (
            <div className="w-14 h-20 shrink-0 relative group rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 cursor-pointer flex items-center justify-center shadow-sm">
              <BookOpen size={20} className="text-zinc-400 absolute z-0" />
              <img src={formData.cover || 'default-cover.png'} alt="" className="w-full h-full object-cover absolute inset-0 z-10" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                 <Camera size={16} className="text-white" />
              </div>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-30" onChange={async (e) => {
                 try {
                   if(e.target.files[0]) {
                     const b64 = await processImageFile(e.target.files[0]);
                     setFormData(prev => ({...prev, cover: b64}));
                   }
                 } catch (err) {
                   showToast(err.message, 'error');
                 }
              }} />
            </div>
          ) : (
            <div className="w-14 h-20 shrink-0 relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center shadow-sm">
              <BookOpen size={20} className="text-zinc-400 absolute z-0" />
              <img src={book.cover || 'default-cover.png'} alt="" className="w-full h-full object-cover absolute inset-0 z-10" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
          )}
          <div className="flex-1 pr-4 min-w-0">
            {isEditing ? <input name="title" value={formData.title} onChange={handleChange} className="w-full font-bold text-lg border-b border-zinc-300 focus:outline-none focus:border-zinc-800 bg-transparent mb-1" /> : <h2 className="text-xl font-bold text-zinc-900 leading-tight mb-1">{book.title}</h2>}
            <p className="text-xs text-zinc-500">ISBN: {book.isbn || 'Belirtilmemiş'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 rounded-full transition-colors bg-zinc-100 shrink-0"><X size={18} /></button>
        </div>
        <div className="flex border-b divide-x divide-zinc-100 bg-white">
          <button onClick={toggleLibrary} className={`flex-1 py-3 px-2 flex flex-col items-center gap-1.5 transition-colors ${book.inLibrary ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}><Library size={18} /><span className="text-[10px] uppercase font-bold tracking-wider">Kütüphanemde</span></button>
          <button onClick={toggleRead} className={`flex-1 py-3 px-2 flex flex-col items-center gap-1.5 transition-colors ${book.isRead ? 'bg-green-600 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}><Check size={18} /><span className="text-[10px] uppercase font-bold tracking-wider">Okundu</span></button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Yazar', name: 'author', col: 2 }, { label: 'Yayınevi', name: 'publisher', col: 2 }, { label: 'Sayfa', name: 'pageCount', type: 'number', col: 1 }, { label: 'Yıl', name: 'year', type: 'number', col: 1 }, { label: 'Fiyat (₺)', name: 'price', type: 'number', col: 2 }].map(field => (
              <div key={field.name} className={`flex flex-col ${field.col === 2 ? 'col-span-2' : 'col-span-1'} bg-zinc-50 p-3 rounded-xl border border-zinc-100`}>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{field.label}</label>
                {isEditing ? <input type={field.type || 'text'} name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="w-full text-sm border-b border-zinc-300 focus:outline-none focus:border-zinc-800 bg-transparent py-0.5" /> : <div className="text-zinc-800 text-sm font-medium">{book[field.name] || '-'}</div>}
              </div>
            ))}
          </div>
          {!isEditing && (
            <div className="pt-2">
              <button onClick={() => setShowMove(!showMove)} className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 font-medium py-2"><MoveRight size={16} /> Klasörü Değiştir</button>
              {showMove && (
                <div className="mt-2 p-2 border border-zinc-200 rounded-xl bg-white max-h-40 overflow-y-auto shadow-inner">
                  <div onClick={() => { moveItemToPosition(book.id, 'book', null); setShowMove(false); }} className={`p-2.5 text-sm rounded-lg cursor-pointer transition-colors ${book.folderId === null ? 'bg-zinc-100 font-semibold text-zinc-900' : 'hover:bg-zinc-50 text-zinc-600'}`}>/ Ana Dizin</div>
                  {folders.map(f => (
                    <div key={f.id} onClick={() => { moveItemToPosition(book.id, 'book', f.id); setShowMove(false); }} className={`p-2.5 text-sm rounded-lg cursor-pointer transition-colors ${book.folderId === f.id ? 'bg-zinc-100 font-semibold text-zinc-900' : 'hover:bg-zinc-50 text-zinc-600'}`}>{f.name}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-zinc-100 bg-white flex flex-col gap-2">
          {showDeleteConfirm ? (
            <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col gap-2">
              <p className="text-xs text-red-800 font-medium flex items-center gap-1.5"><AlertCircle size={14}/> Bu kitabı silmek istediğinize emin misiniz?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-white text-zinc-600 text-sm font-medium rounded-lg border border-zinc-200">İptal</button>
                <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg">Evet, Sil</button>
              </div>
            </div>
          ) : isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => { setFormData(book); setIsEditing(false); }} className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50 transition-colors">İptal</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors">Kaydet</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(true)} className="p-2.5 rounded-xl border border-zinc-200 text-red-500 hover:bg-red-50 transition-colors shrink-0" title="Kitabı Sil"><Trash2 size={20} /></button>
              <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors">Bilgileri Düzenle</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
