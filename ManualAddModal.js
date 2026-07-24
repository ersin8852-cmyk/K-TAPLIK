const ManualAddModal = ({ isOpen, onClose, folderId }) => {
  const { addBook, showToast, processImageFile } = useArchive();
  const [formData, setFormData] = useState({ title: '', author: '', publisher: '', pageCount: '', year: '', price: '', cover: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData({ title: '', author: '', publisher: '', pageCount: '', year: '', price: '', cover: '' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.title || !formData.title.trim()) {
      showToast('Kitap başlığı boş olamaz.', 'error');
      return;
    }
    const success = addBook(formData, folderId);
    if (success) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-[100]">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] sm:h-auto animate-in slide-in-from-bottom-10">
        <div className="p-4 border-b flex justify-between items-start bg-zinc-50 relative gap-3">
          <div className="w-16 h-24 shrink-0 relative group rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 cursor-pointer flex items-center justify-center shadow-sm">
            <BookOpen size={24} className="text-zinc-400 absolute z-0" />
            <img src={formData.cover || 'default-cover.png'} alt="" className="w-full h-full object-cover absolute inset-0 z-10" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
               <Camera size={20} className="text-white" />
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
          <div className="flex-1 pr-4 min-w-0 pt-1">
            <input name="title" placeholder="Kitap Adı *" value={formData.title} onChange={handleChange} className="w-full font-bold text-lg border-b border-zinc-300 focus:outline-none focus:border-zinc-800 bg-transparent mb-2 placeholder-zinc-400" autoFocus />
            <input name="author" placeholder="Yazar" value={formData.author} onChange={handleChange} className="w-full text-sm border-b border-zinc-200 focus:outline-none focus:border-zinc-500 bg-transparent mb-1 placeholder-zinc-400" />
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 rounded-full transition-colors bg-zinc-100 shrink-0"><X size={18} /></button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Yayınevi', name: 'publisher', col: 2 }, { label: 'Sayfa', name: 'pageCount', type: 'number', col: 1 }, { label: 'Yıl', name: 'year', type: 'number', col: 1 }, { label: 'Fiyat (₺)', name: 'price', type: 'number', col: 2 }].map(field => (
              <div key={field.name} className={`flex flex-col ${field.col === 2 ? 'col-span-2' : 'col-span-1'} bg-zinc-50 p-3 rounded-xl border border-zinc-100`}>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{field.label}</label>
                <input type={field.type || 'text'} name={field.name} placeholder="-" value={formData[field.name]} onChange={handleChange} className="w-full text-sm border-b border-zinc-300 focus:outline-none focus:border-zinc-800 bg-transparent py-0.5" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t bg-zinc-50 flex justify-end">
          <button onClick={handleSave} className="px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2">
            <Check size={18} /> Kaydet
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
