const useHistoryModal = (modalId) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handlePopState = (e) => {
      const stateModal = e.state?.modal;
      if (isOpen && stateModal !== modalId) setIsOpen(false);
      if (!isOpen && stateModal === modalId) setIsOpen(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, modalId]);

  const openModal = React.useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      const s = window.history.state || {};
      if (s.modal) {
        window.history.replaceState({ ...s, modal: modalId }, '');
      } else {
        window.history.pushState({ ...s, modal: modalId }, '');
      }
    }
  }, [isOpen, modalId]);

  const closeModal = React.useCallback(() => {
    if (isOpen) {
      if (window.history.state?.modal === modalId) {
        window.history.back();
      } else {
        setIsOpen(false);
      }
    }
  }, [isOpen, modalId]);

  return [isOpen, openModal, closeModal, setIsOpen];
};

const ListsView = ({ activeFolderId, setActiveFolderId }) => {
  const { folders, books, addFolder } = useArchive();
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();
  const [searchModalOpen, openSearchModal, closeSearchModal] = useHistoryModal('search');
  const [activeFolderForAdd, setActiveFolderForAdd] = useState(null);
  const [detailModalOpen, openDetailModal, closeDetailModal] = useHistoryModal('detail-lists');
  const [activeBookId, setActiveBookId] = useState(null);
  const [listEditModalOpen, openListEditModal, closeListEditModal] = useHistoryModal('list-edit');
  const [activeFolderForEdit, setActiveFolderForEdit] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fabMenuOpen, openFabMenu, closeFabMenu, setFabMenuOpen] = useHistoryModal('fab');
  const [listCreateModalOpen, openListCreateModal, closeListCreateModal] = useHistoryModal('list-create');
  const [manualAddModalOpen, openManualAddModal, closeManualAddModal] = useHistoryModal('manual-add');

  const currentFolders = folders.filter(f => f.parentId === activeFolderId);
  const currentBooks = books.filter(b => b.folderId === activeFolderId);

  const currentItems = [
    ...currentFolders.map(f => ({ ...f, _type: 'folder' })),
    ...currentBooks.map(b => ({ ...b, _type: 'book' }))
  ].sort((a, b) => a.order - b.order);

  const breadcrumbs = [];
  let curr = folders.find(f => f.id === activeFolderId);
  while (curr) {
    breadcrumbs.unshift(curr);
    curr = folders.find(f => f.id === curr.parentId);
  }

  const filteredBooks = searchTerm 
    ? books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase())))
    : [];

  const getFolderPath = (folderId) => {
      if (!folderId) return 'Ana Dizin';
      let current = folders.find(f => f.id === folderId);
      let path = [];
      while(current) {
          path.unshift(current.name);
          current = folders.find(f => f.id === current.parentId);
      }
      return path.join(' / ') || 'Ana Dizin';
  };

  const handleNavigate = React.useCallback((book) => {
      setIsSearching(false);
      setSearchTerm('');
      
      let currentFolder = folders.find(f => f.id === book.folderId);
      if (currentFolder) {
          setActiveFolderId(currentFolder.id);
      } else {
          setActiveFolderId(null);
      }

      setTimeout(() => {
          const el = document.getElementById(`book-node-${book.id}`);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-zinc-900', 'bg-zinc-50');
              setTimeout(() => el.classList.remove('ring-2', 'ring-zinc-900', 'bg-zinc-50'), 2000);
          }
      }, 150);
  }, [folders]);

  const handleOpenBook = React.useCallback((id) => {
    setActiveBookId(id);
    openDetailModal();
  }, [openDetailModal]);

  const handleAddBook = React.useCallback((fid) => {
    setActiveFolderForAdd(fid);
    openSearchModal();
  }, [openSearchModal]);

  const handleEditFolder = React.useCallback((fid) => {
    setActiveFolderForEdit(fid);
    openListEditModal();
  }, [openListEditModal]);

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="p-4 pt-6 pb-3 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-zinc-100 shadow-sm min-h-[70px] flex items-center">
        {isSearching ? (
          <div className="flex w-full items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
              <input autoFocus type="text" placeholder="Kitap veya yazar ara..." className="w-full pl-9 pr-3 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => { setIsSearching(false); setSearchTerm(''); }} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-xl"><X size={18} /></button>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <div className="flex w-full justify-between items-start">
              <button onClick={() => setActiveFolderId(null)} className={`text-left flex items-center gap-1.5 transition-all w-full px-2 py-1 rounded-lg border ${(!activeFolderId) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === 'root' && overTarget.source === 'breadcrumb') ? 'ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} data-breadcrumb-target="root">
                {!activeFolderId && <Library size={18} className="mr-1" />}
                Listelerim
              </button>
              <div className="flex gap-2 ml-2 shrink-0">
                <button onClick={() => setIsSearching(true)} className="p-2 text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors" title="Listelerde Ara"><Search size={18} /></button>
              </div>
            </div>
            {breadcrumbs.map((bc, idx) => (
              <div key={bc.id} className="flex items-center mt-1 w-full" style={{ paddingLeft: `${(idx + 1) * 16}px` }}>
                <CornerDownRight size={14} className="text-zinc-400 shrink-0 mr-1.5" />
                <button onClick={() => setActiveFolderId(bc.id)} className={`text-left transition-all w-full px-2 py-1 rounded-lg border ${(activeFolderId === bc.id) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === bc.id && overTarget.source === 'breadcrumb') ? 'ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} data-breadcrumb-target={bc.id}>
                  {bc.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24" data-dnd-scroll data-folder-target={activeFolderId || "root"}>
        {isSearching ? (
          searchTerm.trim() === '' ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <Search size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Aramak istediğiniz kitabın adını yazın.</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-1">
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={handleOpenBook} showIndicator={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <FileText size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Bu isimde bir kitap bulunamadı.</p>
            </div>
          )
        ) : (
          <>
            {currentBooks.length === 0 && currentFolders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
                <List size={48} className="opacity-20" />
                <p className="text-center text-sm font-medium">Bu liste boş. Kitap veya yeni liste ekleyin.</p>
              </div>
            ) : (
              <div className="space-y-1 min-h-[60px] rounded-xl transition-colors" data-folder-target={activeFolderId || "root"}>
                  <ItemList 
                    ids={currentItems.map(i => i.id)}
                    folderKey={activeFolderId || 'root'}
                    items={currentItems}
                    folders={folders}
                    books={books}
                    onOpenFolder={setActiveFolderId}
                    onOpenBook={handleOpenBook}
                    onEditFolder={handleEditFolder}
                  />
              </div>
            )}
          </>
        )}
      </div>

      <div className="absolute bottom-24 right-6 z-50">
        {fabMenuOpen && (
           <div className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm" onClick={closeFabMenu} />
        )}
        <div className="relative z-50 flex flex-col items-end gap-3">
          {fabMenuOpen && (
            <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
              <button onClick={() => { setFabMenuOpen(false); openListCreateModal(); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-2 rounded-xl shadow-md text-[15px] font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">Liste Oluştur</span>
                <div className="w-12 h-12 bg-white text-zinc-600 rounded-full shadow-md flex items-center justify-center group-hover:bg-zinc-50 group-hover:text-zinc-900 transition-colors">
                  <List size={20} />
                </div>
              </button>
              <button onClick={() => { setFabMenuOpen(false); setActiveFolderForAdd(activeFolderId); openSearchModal(); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-2 rounded-xl shadow-md text-[15px] font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">Kitap Ekle</span>
                <div className="w-12 h-12 bg-white text-zinc-600 rounded-full shadow-md flex items-center justify-center group-hover:bg-zinc-50 group-hover:text-zinc-900 transition-colors">
                  <BookOpen size={20} />
                </div>
              </button>
            </div>
          )}
          <button
            onClick={() => fabMenuOpen ? closeFabMenu() : openFabMenu()}
            className={`w-14 h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95 ${fabMenuOpen ? 'rotate-45 bg-zinc-700' : ''}`}
            title="Ekle"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <SearchAddModal isOpen={searchModalOpen} onClose={closeSearchModal} folderId={activeFolderForAdd} onOpenManualAdd={openManualAddModal} />
      <ManualAddModal isOpen={manualAddModalOpen} onClose={closeManualAddModal} folderId={activeFolderForAdd} />
      <BookDetailModal isOpen={detailModalOpen} onClose={closeDetailModal} bookId={activeBookId} />
      <ListCreateModal isOpen={listCreateModalOpen} onClose={closeListCreateModal} onCreate={addFolder} parentId={activeFolderId} />
      <ListEditModal isOpen={listEditModalOpen} onClose={closeListEditModal} folderId={activeFolderForEdit} />
    </div>
  );
};

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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

const LibraryView = ({ activeFolderId, setActiveFolderId }) => {
  const { folders, books } = useArchive();
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();
  const [detailModalOpen, openDetailModal, closeDetailModal] = useHistoryModal('detail-library');
  const [listEditModalOpen, openListEditModal, closeListEditModal] = useHistoryModal('list-edit-library');
  const [activeFolderForEdit, setActiveFolderForEdit] = useState(null);
  const [activeBookId, setActiveBookId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const libraryBooks = useMemo(() => books.filter(b => b.inLibrary), [books]);
  const visibleFolderIds = useMemo(() => {
    const ids = new Set();
    const addFolderAndAncestors = (folderId) => {
      if (!folderId || ids.has(folderId)) return;
      ids.add(folderId);
      const folder = folders.find(f => f.id === folderId);
      if (folder && folder.parentId) addFolderAndAncestors(folder.parentId);
    };
    libraryBooks.forEach(book => { if (book.folderId) addFolderAndAncestors(book.folderId); });
    return ids;
  }, [libraryBooks, folders]);

  const visibleFolders = useMemo(() => folders.filter(f => visibleFolderIds.has(f.id)), [folders, visibleFolderIds]);

  const currentFolders = visibleFolders.filter(f => f.parentId === activeFolderId);
  const currentBooks = libraryBooks.filter(b => b.folderId === activeFolderId);

  const currentItems = [
    ...currentFolders.map(f => ({ ...f, _type: 'folder' })),
    ...currentBooks.map(b => ({ ...b, _type: 'book' }))
  ].sort((a, b) => a.order - b.order);

  const breadcrumbs = [];
  let curr = folders.find(f => f.id === activeFolderId);
  while (curr) {
    breadcrumbs.unshift(curr);
    curr = folders.find(f => f.id === curr.parentId);
  }

  const filteredBooks = searchTerm 
    ? libraryBooks.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase())))
    : [];

  const getFolderPath = (folderId) => {
      if (!folderId) return 'Ana Dizin';
      let current = folders.find(f => f.id === folderId);
      let path = [];
      while(current) {
          path.unshift(current.name);
          current = folders.find(f => f.id === current.parentId);
      }
      return path.join(' / ') || 'Ana Dizin';
  };

  const handleNavigate = React.useCallback((book) => {
      setIsSearching(false);
      setSearchTerm('');
      
      let currentFolder = folders.find(f => f.id === book.folderId);
      if (currentFolder) {
          setActiveFolderId(currentFolder.id);
      } else {
          setActiveFolderId(null);
      }

      setTimeout(() => {
          const el = document.getElementById(`book-node-${book.id}`);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-zinc-900', 'bg-zinc-50');
              setTimeout(() => el.classList.remove('ring-2', 'ring-zinc-900', 'bg-zinc-50'), 2000);
          }
      }, 150);
  }, [folders]);

  const handleOpenBook = React.useCallback((id) => {
    setActiveBookId(id);
    openDetailModal();
  }, [openDetailModal]);

  const handleEditFolder = React.useCallback((fid) => {
    setActiveFolderForEdit(fid);
    openListEditModal();
  }, [openListEditModal]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 pt-6 pb-3 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-zinc-100 shadow-sm min-h-[70px] flex flex-col justify-center">
        {isSearching ? (
          <div className="flex w-full items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
              <input autoFocus type="text" placeholder="Kütüphanede ara..." className="w-full pl-9 pr-3 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => { setIsSearching(false); setSearchTerm(''); }} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-xl"><X size={18} /></button>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <div className="flex w-full justify-between items-start">
              <button onClick={() => setActiveFolderId(null)} className={`text-left flex items-center gap-1.5 transition-all w-full px-2 py-1 rounded-lg border ${(!activeFolderId) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === 'root' && overTarget.source === 'breadcrumb') ? 'ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} data-breadcrumb-target="root">
                {!activeFolderId && <Library size={18} className="mr-1" />}
                Tüm Kitaplık
              </button>
              {libraryBooks.length > 0 && (
                <div className="flex gap-2 ml-2 shrink-0">
                  <button onClick={() => setIsSearching(true)} className="p-2 text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors" title="Kütüphanede Ara"><Search size={18} /></button>
                </div>
              )}
            </div>
            {breadcrumbs.map((bc, idx) => (
              <div key={bc.id} className="flex items-center mt-1 w-full" style={{ paddingLeft: `${(idx + 1) * 16}px` }}>
                <CornerDownRight size={14} className="text-zinc-400 shrink-0 mr-1.5" />
                <button onClick={() => setActiveFolderId(bc.id)} className={`text-left transition-all w-full px-2 py-1 rounded-lg border ${(activeFolderId === bc.id) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === bc.id && overTarget.source === 'breadcrumb') ? 'ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} data-breadcrumb-target={bc.id}>
                  {bc.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

     <div className="flex-1 overflow-y-auto p-4 pb-24" data-dnd-scroll data-folder-target={activeFolderId || "root"}>
        {isSearching ? (
           searchTerm.trim() === '' ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <Search size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Aramak istediğiniz kitabın adını yazın.</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-1">
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={handleOpenBook} isLibraryView={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <FileText size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Kütüphanenizde bu isimde kitap yok.</p>
            </div>
          )
        ) : libraryBooks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
            <Library size={48} className="opacity-20" />
            <p className="text-center text-sm font-medium px-4">Kütüphanenizde kitap yok.<br/><span className="text-xs font-normal">Listelerinizdeki kitapları "Kütüphanemde" olarak işaretleyin.</span></p>
          </div>
        ) : (
          <div className="space-y-1 min-h-[60px] rounded-xl transition-colors" data-folder-target={activeFolderId || "root"}>
             <ItemList 
               ids={currentItems.map(i => i.id)} 
               items={currentItems} 
               folders={visibleFolders} 
               books={libraryBooks} 
               folderKey={activeFolderId || "root"} 
               onOpenBook={handleOpenBook} 
               onOpenFolder={setActiveFolderId} 
               onEditFolder={handleEditFolder}
               isLibraryView={true} 
             />
          </div>
        )}
      </div>
      <BookDetailModal isOpen={detailModalOpen} onClose={closeDetailModal} bookId={activeBookId} />
      <ListEditModal isOpen={listEditModalOpen} onClose={closeListEditModal} folderId={activeFolderForEdit} />
    </div>
  );
};

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
