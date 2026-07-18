
// --- YARDIMCI HOOK'LAR VE FONKSİYONLAR ---

// Klasör ağacı, açık klasörler ve yönlendirme işlemlerini merkezi yöneten Hook
const useTreeManager = (folders, books, searchTerm) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleFolder = useCallback((folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  // Performans: Tüm klasör ve kitapları ebeveyn ID'lerine göre Map (Dictionary) olarak grupluyoruz.
  const { groupedFolders, groupedBooks, rootFolders, rootBooks } = useMemo(() => {
    const fMap = new Map();
    const bMap = new Map();
    const rootsF = [];
    const rootsB = [];

    // Klasörleri Grupla
    folders.forEach(f => {
      if (f.parentId === null) {
        rootsF.push(f);
      } else {
        if (!fMap.has(f.parentId)) fMap.set(f.parentId, []);
        fMap.get(f.parentId).push(f);
      }
    });

    // Kitapları Grupla
    books.forEach(b => {
      if (b.folderId === null) {
        rootsB.push(b);
      } else {
        if (!bMap.has(b.folderId)) bMap.set(b.folderId, []);
        bMap.get(b.folderId).push(b);
      }
    });

    // Sıralamaları bir kez yap
    const sortByOrder = (a, b) => a.order - b.order;
    rootsF.sort(sortByOrder);
    rootsB.sort(sortByOrder);
    fMap.forEach(arr => arr.sort(sortByOrder));
    bMap.forEach(arr => arr.sort(sortByOrder));

    return { groupedFolders: fMap, groupedBooks: bMap, rootFolders: rootsF, rootBooks: rootsB };
  }, [folders, books]);

  // Türkçe Karakter Duyarlı Arama
  const filteredBooks = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') return [];
    const term = searchTerm.toLocaleLowerCase("tr-TR");
    return books.filter(b => 
      b.title.toLocaleLowerCase("tr-TR").includes(term) || 
      (b.author && b.author.toLocaleLowerCase("tr-TR").includes(term))
    );
  }, [books, searchTerm]);

  // Klasör yolunu bulma (Sonsuz döngü korumalı)
  const getFolderPath = useCallback((folderId) => {
    if (!folderId) return 'Ana Dizin';
    let current = folders.find(f => f.id === folderId);
    let path = [];
    const visited = new Set();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current.name);
      current = folders.find(f => f.id === current.parentId);
    }
    return path.join(' / ') || 'Ana Dizin';
  }, [folders]);

  return { expandedFolders, setExpandedFolders, toggleFolder, groupedFolders, groupedBooks, rootFolders, rootBooks, filteredBooks, getFolderPath };
};


// --- BİLEŞENLER ---

const EmptyState = ({ icon: Icon, message, subMessage }) => (
  <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
    <Icon size={48} className="opacity-20" />
    <p className="text-center text-sm font-medium px-4">
      {message}
      {subMessage && <><br/><span className="text-xs font-normal">{subMessage}</span></>}
    </p>
  </div>
);

const HeaderBar = ({ title, subTitle, isSearching, setIsSearching, searchTerm, setSearchTerm, onAddFolder }) => (
  <div className="p-4 pt-6 pb-3 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-zinc-100 shadow-sm min-h-[70px] flex items-center">
    {isSearching ? (
      <div className="flex w-full items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
          <input 
            autoFocus 
            type="text" 
            placeholder="Ara..." 
            className="w-full pl-9 pr-3 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <button aria-label="Aramayı Kapat" onClick={() => { setIsSearching(false); setSearchTerm(''); }} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-xl">
          <X size={18} />
        </button>
      </div>
    ) : (
      <div className="flex w-full justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{title}</h1>
          {subTitle && <p className="text-[11px] text-zinc-500 mt-0.5 uppercase font-semibold tracking-wider">{subTitle}</p>}
        </div>
        <div className="flex gap-2">
          <button aria-label="Ara" onClick={() => setIsSearching(true)} className="p-2 text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors" title="Ara">
            <Search size={18} />
          </button>
          {onAddFolder && (
            <button aria-label="Klasör Ekle" onClick={onAddFolder} className="p-2 text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors" title="Klasör Ekle">
              <FolderPlus size={18} />
            </button>
          )}
        </div>
      </div>
    )}
  </div>
);

const ActionButton = ({ onClick, icon: Icon, title }) => (
  <div className="absolute bottom-24 right-6 z-20">
    <button
      aria-label={title}
      onClick={onClick}
      className="w-14 h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
      title={title}
    >
      <Icon size={24} />
    </button>
  </div>
);

const BookCard = ({ book, onOpen, showIndicator = false, folderPath = null, onNavigate = null }) => {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    if (onOpen) onOpen(book.id);
  };

  return (
    <div
      id={`book-node-${book.id}`}
      className="group flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-xl shadow-sm hover:border-zinc-300 ml-2 sm:ml-4 cursor-pointer transition-colors my-1.5"
      onClick={handleClick}
    >
      <div className="flex-1 flex items-center gap-3 overflow-hidden">
        <div className="bg-zinc-50 rounded-lg text-zinc-400 border border-zinc-100 shrink-0 overflow-hidden w-8 h-11 flex items-center justify-center">
          {book.cover && !imgError ? (
            <img src={book.cover} alt="" onError={() => setImgError(true)} className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={16} />
          )}
        </div>
        <div className="truncate flex-1">
          <h4 className="font-semibold text-zinc-800 text-sm truncate">{book.title}</h4>
          {folderPath ? (
             <p 
               className="text-[10px] font-medium text-zinc-500 truncate flex items-center gap-1 mt-1 cursor-pointer hover:text-zinc-900 transition-colors bg-zinc-100 hover:bg-zinc-200 w-fit px-2 py-0.5 rounded-full"
               onClick={(e) => { 
                 e.stopPropagation();
                 if (onNavigate) onNavigate(book); 
               }}
               title="Klasördeki yerine git"
             >
               <Folder size={10} /> {folderPath} <MoveRight size={10} className="ml-0.5 opacity-60" />
             </p>
          ) : (
             <p className="text-[11px] text-zinc-500 truncate">{book.publisher || 'Yayınevi Yok'}</p>
          )}
        </div>
        {showIndicator && book.inLibrary && (
          <span className="ml-auto w-2 h-2 rounded-full bg-zinc-900 shrink-0" title="Kütüphanemde"></span>
        )}
      </div>
    </div>
  );
};

const FolderNode = ({ folder, groupedFolders, groupedBooks, expandedFolders, toggleFolder, level = 0, onAddBook, onOpenBook, isLibraryView = false }) => {
  const { addFolder, reorderFolder, deleteFolder } = useArchive();
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDelConfirm, setShowDelConfirm] = useState(false);

  // Doğrudan parent komponentin hesapladığı O(1) map sözlüğünden çocukları çekiyoruz.
  const childFolders = groupedFolders.get(folder.id) || [];
  const childBooks = groupedBooks.get(folder.id) || [];
  const isOpen = expandedFolders.has(folder.id);

  const handleAddSubfolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), folder.id);
      setNewFolderName(''); setIsAddingFolder(false);
      // Eklenen alt klasörü görebilmek için kendimizi açıyoruz
      if (!isOpen) toggleFolder(folder.id);
    }
  };

  return (
    <div className="mb-1" style={{ marginLeft: level > 0 ? '0.75rem' : '0' }}>
      {showDelConfirm ? (
         <div className="p-2 mb-2 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between text-xs">
            <span className="text-red-800 font-medium truncate">Klasör silinsin mi?</span>
            <div className="flex gap-1 shrink-0 ml-2">
              <button aria-label="Sil" onClick={() => deleteFolder(folder.id)} className="px-2 py-1 bg-red-600 text-white rounded">Sil</button>
              <button aria-label="İptal" onClick={() => setShowDelConfirm(false)} className="px-2 py-1 bg-white text-zinc-600 border rounded">İptal</button>
            </div>
         </div>
      ) : (
        <div className="group flex items-center justify-between p-2 rounded-xl transition-colors border border-transparent hover:bg-zinc-50 hover:border-zinc-100">
          <div className="flex items-center gap-2 cursor-pointer flex-1 overflow-hidden" onClick={() => toggleFolder(folder.id)}>
            {isOpen ? <ChevronDown size={18} className="text-zinc-400 shrink-0" /> : <ChevronRight size={18} className="text-zinc-400 shrink-0" />}
            <span className="font-semibold text-zinc-700 text-sm truncate">{folder.name}</span>
            <span className="text-[10px] text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-full shrink-0">{childBooks.length}</span>
          </div>

          {!isLibraryView && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button aria-label="Klasörü Sil" onClick={() => setShowDelConfirm(true)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Klasörü Sil"><Trash2 size={14} /></button>
              <button aria-label="Alt Klasör Ekle" onClick={() => setIsAddingFolder(true)} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg" title="Alt Klasör Ekle"><FolderPlus size={14} /></button>
              <button aria-label="Kitap Ekle" onClick={() => onAddBook(folder.id)} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg" title="Kitap Ekle"><Plus size={14} /></button>
              <div className="flex flex-col ml-1 border-l border-zinc-200 pl-1">
                <button aria-label="Yukarı Taşı" onClick={() => reorderFolder(folder.id, 'up')} className="p-0.5 text-zinc-400 hover:text-zinc-800"><ArrowUp size={10} /></button>
                <button aria-label="Aşağı Taşı" onClick={() => reorderFolder(folder.id, 'down')} className="p-0.5 text-zinc-400 hover:text-zinc-800"><ArrowDown size={10} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="mt-1 border-l-2 border-zinc-100 ml-3">
          {isAddingFolder && (
            <form onSubmit={handleAddSubfolder} className="ml-2 mb-2 flex items-center gap-2">
              <input autoFocus type="text" placeholder="Klasör adı..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="text-sm px-3 py-1.5 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-zinc-50 w-full" />
              <button aria-label="İptal" type="button" onClick={() => setIsAddingFolder(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600 bg-zinc-100 rounded-lg"><X size={16} /></button>
            </form>
          )}
          <div className="mt-1">
            {childBooks.map(book => <BookCard key={book.id} book={book} onOpen={onOpenBook} showIndicator={!isLibraryView} />)}
          </div>
          <div>
            {childFolders.map(childFolder => (
              <FolderNode 
                key={childFolder.id} 
                folder={childFolder} 
                groupedFolders={groupedFolders} 
                groupedBooks={groupedBooks} 
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                level={level + 1} 
                onAddBook={onAddBook} 
                onOpenBook={onOpenBook} 
                isLibraryView={isLibraryView} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ListsView = () => {
  const { folders, books, addFolder } = useArchive();
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeFolderForAdd, setActiveFolderForAdd] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeBookId, setActiveBookId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { expandedFolders, setExpandedFolders, toggleFolder, groupedFolders, groupedBooks, rootFolders, rootBooks, filteredBooks, getFolderPath } = useTreeManager(folders, books, searchTerm);

  const handleAddRootFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), null);
      setNewFolderName(''); setIsAddingRoot(false);
    }
  };

  const handleNavigate = useCallback((book) => {
    setIsSearching(false);
    setSearchTerm('');
    
    // Klasörleri güvenli şekilde (sonsuz döngü engeliyle) açıyoruz
    setExpandedFolders(prev => {
      const next = new Set(prev);
      let currId = book.folderId;
      const visited = new Set();
      while (currId && !visited.has(currId)) {
        visited.add(currId);
        next.add(currId);
        const f = folders.find(f => f.id === currId);
        currId = f ? f.parentId : null;
      }
      return next;
    });

    // React'in DOM'u render edip boyamasını beklemek için çift requestAnimationFrame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(`book-node-${book.id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-zinc-900', 'bg-zinc-50');
            setTimeout(() => el.classList.remove('ring-2', 'ring-zinc-900', 'bg-zinc-50'), 2000);
        }
      });
    });
  }, [folders, setExpandedFolders]);

  return (
    <div className="h-full flex flex-col bg-white relative">
      <HeaderBar 
        title="Listelerim" 
        isSearching={isSearching} 
        setIsSearching={setIsSearching} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onAddFolder={() => setIsAddingRoot(true)} 
      />

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {isSearching ? (
          searchTerm.trim() === '' ? (
            <EmptyState icon={Search} message="Aramak istediğiniz kitabın adını yazın." />
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-1">
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} showIndicator={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
            <EmptyState icon={FileText} message="Bu isimde bir kitap bulunamadı." />
          )
        ) : (
          <>
            {isAddingRoot && (
              <form onSubmit={handleAddRootFolder} className="mb-4 flex items-center gap-2 p-2 bg-zinc-50 rounded-xl border border-zinc-200 shadow-inner">
                <input autoFocus type="text" placeholder="Yeni liste adı..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="flex-1 bg-transparent px-2 focus:outline-none text-zinc-800 text-sm" />
                <button aria-label="Onayla" type="submit" className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-600"><Check size={16} /></button>
                <button aria-label="İptal" type="button" onClick={() => setIsAddingRoot(false)} className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-400"><X size={16} /></button>
              </form>
            )}

            {books.length === 0 && folders.length === 0 && !isAddingRoot ? (
              <EmptyState icon={FileText} message="Klasör veya kitap ekleyerek başlayın." />
            ) : (
              <div className="space-y-1 min-h-[60px] rounded-xl transition-colors">
                  {rootBooks.map(book => <BookCard key={book.id} book={book} onOpen={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} showIndicator={true} />)}
                  {rootFolders.map(folder => (
                    <FolderNode 
                      key={folder.id} 
                      folder={folder} 
                      groupedFolders={groupedFolders} 
                      groupedBooks={groupedBooks}
                      expandedFolders={expandedFolders}
                      toggleFolder={toggleFolder}
                      onAddBook={(fid) => { setActiveFolderForAdd(fid); setSearchModalOpen(true); }} 
                      onOpenBook={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} 
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      <ActionButton onClick={() => { setActiveFolderForAdd(null); setSearchModalOpen(true); }} icon={Plus} title="Kitap Ekle" />

      {/* Bu modalların import edildiğini/projenin başka yerinde olduğunu varsayıyorum */}
      <SearchAddModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} folderId={activeFolderForAdd} />
      <BookDetailModal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} bookId={activeBookId} />
    </div>
  );
};

const LibraryView = () => {
  const { folders, books } = useArchive();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeBookId, setActiveBookId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const libraryBooks = useMemo(() => books.filter(b => b.inLibrary), [books]);
  
  const visibleFolders = useMemo(() => {
    const ids = new Set();
    const addAncestors = (folderId, visited = new Set()) => {
      if (!folderId || ids.has(folderId) || visited.has(folderId)) return;
      visited.add(folderId);
      ids.add(folderId);
      const folder = folders.find(f => f.id === folderId);
      if (folder && folder.parentId) addAncestors(folder.parentId, visited);
    };
    libraryBooks.forEach(book => { if (book.folderId) addAncestors(book.folderId); });
    return folders.filter(f => ids.has(f.id));
  }, [libraryBooks, folders]);

  const { expandedFolders, setExpandedFolders, toggleFolder, groupedFolders, groupedBooks, rootFolders, rootBooks, filteredBooks, getFolderPath } = useTreeManager(visibleFolders, libraryBooks, searchTerm);

  const handleNavigate = useCallback((book) => {
    setIsSearching(false);
    setSearchTerm('');
    
    setExpandedFolders(prev => {
      const next = new Set(prev);
      let currId = book.folderId;
      const visited = new Set();
      while (currId && !visited.has(currId)) {
        visited.add(currId);
        next.add(currId);
        const f = folders.find(f => f.id === currId);
        currId = f ? f.parentId : null;
      }
      return next;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(`book-node-${book.id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-zinc-900', 'bg-zinc-50');
            setTimeout(() => el.classList.remove('ring-2', 'ring-zinc-900', 'bg-zinc-50'), 2000);
        }
      });
    });
  }, [folders, setExpandedFolders]);

  return (
    <div className="h-full flex flex-col bg-white">
      <HeaderBar 
        title="Kütüphanem" 
        subTitle="Sahip Olduğunuz Kitaplar"
        isSearching={isSearching} 
        setIsSearching={setIsSearching} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        // Arama butonunun çıkması için
        onAddFolder={libraryBooks.length > 0 ? null : undefined} 
      />

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {isSearching ? (
           searchTerm.trim() === '' ? (
             <EmptyState icon={Search} message="Aramak istediğiniz kitabın adını yazın." />
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-1">
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} isLibraryView={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
             <EmptyState icon={FileText} message="Kütüphanenizde bu isimde kitap yok." />
          )
        ) : libraryBooks.length === 0 ? (
           <EmptyState icon={Library} message="Kütüphanenizde kitap yok." subMessage='Listelerinizdeki kitapları "Kütüphanemde" olarak işaretleyin.' />
        ) : (
          <div className="space-y-1">
             {rootBooks.map(book => <BookCard key={book.id} book={book} onOpen={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} isLibraryView={true} />)}
            {rootFolders.map(folder => (
              <FolderNode 
                key={folder.id} 
                folder={folder} 
                groupedFolders={groupedFolders} 
                groupedBooks={groupedBooks}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onOpenBook={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} 
                isLibraryView={true} 
              />
            ))}
          </div>
        )}
      </div>
      <BookDetailModal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} bookId={activeBookId} />
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
    // Versiyon eklendi. İleride veri yapısı değiştiğinde migration yazabilmek için faydalı.
    const dataStr = JSON.stringify({ version: 1, books, folders }, null, 2);
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
        if (!parsed || typeof parsed !== 'object') throw new Error('Geçersiz dosya.');
        
        // Validation (Doğrulama)
        const importedBooks = parsed.books;
        const importedFolders = parsed.folders;
        if (!Array.isArray(importedBooks) || !Array.isArray(importedFolders)) {
            showToast('Dosya formatı hatalı. Bu geçerli bir yedek değil.', 'error');
            return;
        }

        // Context içerisine (importData'ya) sadece ihtiyacı olanı pasla.
        importData({ books: importedBooks, folders: importedFolders });
        showToast('Veriler başarıyla içe aktarıldı.');
      } catch (err) {
        showToast('Dosya okunamadı veya bozuk JSON.', 'error');
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
        // Döngü içerisinde aynı değeri birden fazla Parse etmek yerine bir kere okuyoruz
        const p = parseInt(b.pageCount, 10);
        const validPageCount = !isNaN(p) && p > 0 ? p : 0;
        const price = parseFloat(b.price);
        const validPrice = !isNaN(price) && price > 0 ? price : 0;

        totalPages += validPageCount; 
        totalPrice += validPrice;

        const currentLongest = parseInt(longest.pageCount, 10) || 0;
        const currentShortest = parseInt(shortest.pageCount, 10) || 0;

        if (validPageCount > currentLongest) longest = b;
        
        if (validPageCount > 0) {
            if (currentShortest === 0 || validPageCount < currentShortest) {
                shortest = b;
            }
        }

        if (b.author) authors[b.author] = (authors[b.author] || 0) + 1;
      });

      let favAuth = '-', max = 0;
      Object.entries(authors).forEach(([a, c]) => { if (c > max) { max = c; favAuth = a; } });
      
      const isShortestValid = (parseInt(shortest.pageCount, 10) || 0) > 0;
      
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
    
    const rPages = read.reduce((s, b) => s + (parseInt(b.pageCount, 10)||0), 0);
    const uPages = unread.reduce((s, b) => s + (parseInt(b.pageCount, 10)||0), 0);
    
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
              <button aria-label="Yedekle" onClick={handleExport} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                <Download size={16} /> Yedekle
              </button>
              <button aria-label="Geri Yükle" onClick={() => fileInputRef.current.click()} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
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
