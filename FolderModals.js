const ListCreateModal = ({ isOpen, onClose, onCreate, parentId }) => {
  const [name, setName] = useState('Liste A');
  const [color, setColor] = useState('#71717a');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('Liste A');
      setColor('#71717a');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.select();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), parentId, color);
      onClose();
    }
  };

  const colors = ['#71717a', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900">Yeni Liste Oluştur</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Liste Adı</label>
            <input 
              ref={inputRef}
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 font-medium"
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Renk Seçimi</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors">
            Oluştur
          </button>
        </form>
      </div>
    </div>
  );
};

const ListEditModal = ({ isOpen, onClose, folderId }) => {
  const { folders, updateFolder, deleteFolder } = useArchive();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#71717a');
  const [showDelConfirm, setShowDelConfirm] = useState(false);
  const inputRef = useRef(null);

  const folder = folders.find(f => f.id === folderId);

  useEffect(() => {
    if (isOpen && folder) {
      setName(folder.name || '');
      setColor(folder.color || '#71717a');
      setShowDelConfirm(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.select();
      }, 100);
    }
  }, [isOpen, folder]);

  if (!isOpen || !folder) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      updateFolder(folder.id, name.trim(), color);
      onClose();
    }
  };

  const handleDelete = () => {
    deleteFolder(folder.id);
    onClose();
  };

  const colors = ['#71717a', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900">Liste Ayarları</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        {showDelConfirm ? (
          <div className="p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Listeyi Sil</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Bu listeyi silmek istediğinize emin misiniz? <br/>İçindeki kitaplar silinmeyecek, ana dizine taşınacaktır.
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowDelConfirm(false)} className="flex-1 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-200 transition-colors">İptal</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">Evet, Sil</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Liste Adı</label>
              <input 
                ref={inputRef}
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 font-medium"
                autoFocus
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Renk Seçimi</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowDelConfirm(true)} className="py-3 px-4 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center">
                <Trash2 size={20} />
              </button>
              <button type="submit" className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors">
                Kaydet
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
