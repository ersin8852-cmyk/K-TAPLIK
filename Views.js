const BookCard = ({ book, onOpen, showIndicator = false, draggable = false, folderPath = null, onNavigate = null }) => {
  const dnd = useDragDrop();
  const isDragged = draggable && dnd && dnd.draggedId === book.id;
  const over = draggable && dnd && dnd.overTarget && dnd.overTarget.type === 'book' && dnd.overTarget.id === book.id ? dnd.overTarget.placement : null;
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const ghostRef = useRef(null);

  // Siyah kutucuğu engelle
  useEffect(() => {
    if (isDragged) {
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
      
      const handleDragStart = (e) => {
        e.dataTransfer.setDragImage(img, 0, 0);
      };
      
      document.addEventListener('dragstart', handleDragStart);
      return () => document.removeEventListener('dragstart', handleDragStart);
    }
  }, [isDragged]);

  const handlePointerDown = (e) => {
    if (!draggable || !dnd) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    dnd.startDrag(book.id, e);
  };

  const handlePointerMove = (e) => {
    if (!draggable || !dnd || dnd.draggedId !== book.id) return;
    e.stopPropagation();
    const dy = e.clientY - startPosRef.current.y;
    setDragOffset({ x: 0, y: dy });
    dnd.updateDrag(e);
  };

  const handlePointerUp = (e) => {
    if (!draggable || !dnd || dnd.draggedId !== book.id) return;
    e.stopPropagation();
    setDragOffset({ x: 0, y: 0 });
    dnd.endDrag();
  };

  return (
    <>
      <div
        id={`book-node-${book.id}`}
        data-book-target={draggable ? book.id : undefined}
        data-book-target-folder={draggable ? (book.folderId === null ? 'root' : book.folderId) : undefined}
        style={{
          marginTop: over === 'after' ? '2rem' : '0.375rem',
          marginBottom: over === 'before' ? '2rem' : '0.375rem',
          transition: 'margin 0.2s ease, opacity 0.2s ease',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: draggable ? 'none' : 'auto',
        }}
        className={`group flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm hover:border-zinc-300 ml-2 sm:ml-4 ${isDragged ? 'opacity-30' : 'border-zinc-100'} ${draggable ? 'cursor-grab active:cursor-grabbing touch-none select-none' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { if (draggable && dnd) { setDragOffset({ x: 0, y: 0 }); dnd.cancelDrag(); } }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="flex-1 flex items-center gap-3 overflow-hidden">
          <div className="bg-zinc-50 rounded-lg text-zinc-400 border border-zinc-100 shrink-0 overflow-hidden w-8 h-11 flex items-center justify-center">
            {book.cover ? (
              <img src={book.cover} alt="" draggable="false" className="w-full h-full object-cover" />
            ) : (
              <BookOpen size={16} />
            )}
          </div>
          <div className="truncate flex-1">
            <h4 className="font-semibold text-zinc-800 text-sm truncate">{book.title}</h4>
            {folderPath ? (
               <p 
                 className="text-[10px] font-medium text-zinc-500 truncate flex items-center gap-1 mt-1 cursor-pointer hover:text-zinc-900 transition-colors bg-zinc-100 hover:bg-zinc-200 w-fit px-2 py-0.5 rounded-full"
                 onClick={(e) => { if (onNavigate) { e.stopPropagation(); onNavigate(book); } }}
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

      {isDragged && (
        <div
          ref={cardRef}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: startPosRef.current.y - 30,
            transform: `translateY(${dragOffset.y}px)`,
            zIndex: 9999,
            marginLeft: '0.5rem',
            marginRight: '0.5rem',
            pointerEvents: 'none',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
          }}
          className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl"
        >
          <div className="flex-1 flex items-center gap-3 overflow-hidden">
            <div className="bg-zinc-50 rounded-lg text-zinc-400 border border-zinc-100 shrink-0 overflow-hidden w-8 h-11 flex items-center justify-center">
              {book.cover ? (
                <img src={book.cover} alt="" draggable="false" className="w-full h-full object-cover" />
              ) : (
                <BookOpen size={16} />
              )}
            </div>
            <div className="truncate flex-1">
              <h4 className="font-semibold text-zinc-800 text-sm truncate">{book.title}</h4>
              <p className="text-[11px] text-zinc-500 truncate">{book.publisher || 'Yayınevi Yok'}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const FolderNode = ({ folder, allFolders, allBooks, level = 0, onAddBook, onOpenBook, isLibraryView = false, draggable = false }) => {
  const { addFolder, reorderFolder, deleteFolder } = useArchive();
  const dnd = useDragDrop();
  const isDropTarget = draggable && dnd && dnd.overTarget && dnd.overTarget.type === 'folder' && dnd.overTarget.id === folder.id;
  const [isOpen, setIsOpen] = useState(true);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDelConfirm, setShowDelConfirm] = useState(false);

  useEffect(() => {
    const handleExpand = () => setIsOpen(true);
    window.addEventListener(`expand-folder-${folder.id}`, handleExpand);
    return () => window.removeEventListener(`expand-folder-${folder.id}`, handleExpand);
  }, [folder.id]);

  const childFolders = allFolders.filter(f => f.parentId === folder.id).sort((a, b) => a.order - b.order);
  const childBooks = allBooks.filter(b => b.folderId === folder.id).sort((a, b) => a.order - b.order);

  const handleAddSubfolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), folder.id);
      setNewFolderName(''); setIsAddingFolder(false); setIsOpen(true);
    }
  };

  return (
    <div className="mb-1" style={{ marginLeft: level > 0 ? '0.75rem' : '0' }}>
      {showDelConfirm ? (
         <div className="p-2 mb-2 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between text-xs">
            <span className="text-red-800 font-medium truncate">Klasör silinsin mi?</span>
            <div className="flex gap-1 shrink-0 ml-2">
              <button onClick={() => deleteFolder(folder.id)} className="px-2 py-1 bg-red-600 text-white rounded">Sil</button>
              <button onClick={() => setShowDelConfirm(false)} className="px-2 py-1 bg-white text-zinc-600 border rounded">İptal</button>
            </div>
         </div>
      ) : (
        <div
          data-folder-target={draggable ? folder.id : undefined}
          className={`group flex items-center justify-between p-2 rounded-xl transition-colors border ${isDropTarget ? 'bg-zinc-900/5 border-dashed border-zinc-900' : 'border-transparent hover:bg-zinc-50 hover:border-zinc-100'}`}
        >
          <div className="flex items-center gap-2 cursor-pointer flex-1 overflow-hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronDown size={18} className="text-zinc-400 shrink-0" /> : <ChevronRight size={18} className="text-zinc-400 shrink-0" />}
            <span className="font-semibold text-zinc-700 text-sm truncate">{folder.name}</span>
            <span className="text-[10px] text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-full shrink-0">{childBooks.length}</span>
          </div>

          {!isLibraryView && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => setShowDelConfirm(true)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Klasörü Sil"><Trash2 size={14} /></button>
              <button onClick={() => setIsAddingFolder(true)} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg" title="Alt Klasör Ekle"><FolderPlus size={14} /></button>
              <button onClick={() => onAddBook(folder.id)} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg" title="Kitap Ekle"><Plus size={14} /></button>
              <div className="flex flex-col ml-1 border-l border-zinc-200 pl-1">
                <button onClick={() => reorderFolder(folder.id, 'up')} className="p-0.5 text-zinc-400 hover:text-zinc-800"><ArrowUp size={10} /></button>
                <button onClick={() => reorderFolder(folder.id, 'down')} className="p-0.5 text-zinc-400 hover:text-zinc-800"><ArrowDown size={10} /></button>
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
              <button type="button" onClick={() => setIsAddingFolder(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600 bg-zinc-100 rounded-lg"><X size={16} /></button>
            </form>
          )}
          <div className="mt-1">
            {childBooks.map(book => <BookCard key={book.id} book={book} onOpen={onOpenBook} showIndicator={!isLibraryView} draggable={draggable} />)}
          </div>
          <div>
            {childFolders.map(childFolder => (
              <FolderNode key={childFolder.id} folder={childFolder} allFolders={allFolders} allBooks={allBooks} level={level + 1} onAddBook={onAddBook} onOpenBook={onOpenBook} isLibraryView={isLibraryView} draggable={draggable} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RootDropZone = ({ children }) => {
  const dnd = useDragDrop();
  const isOver = dnd && dnd.overTarget && dnd.overTarget.type === 'folder' && dnd.overTarget.id === 'root';
  return (
    <div data-folder-target="root" className={`space-y-1 min-h-[60px] rounded-xl transition-colors ${isOver ? 'bg-zinc-900/5 ring-2 ring-dashed ring-zinc-900' : ''}`}>
      {children}
    </div>
  );
};

const ListsView = () => {
  const { folders, books, addFolder, moveBookToPosition } = useArchive();
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeFolderForAdd, setActiveFolderForAdd] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeBookId, setActiveBookId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const rootFolders = folders.filter(f => f.parentId === null).sort((a, b) => a.order - b.order);
  const rootBooks = books.filter(b => b.folderId === null).sort((a, b) => a.order - b.order);

  const filteredBooks = searchTerm 
    ? books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase())))
    : [];

  const handleAddRootFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), null);
      setNewFolderName(''); setIsAddingRoot(false);
    }
  };

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

  const handleNavigate = (book) => {
      setIsSearching(false);
      setSearchTerm('');
      
      let currentFolder = folders.find(f => f.id === book.folderId);
      while(currentFolder) {
          window.dispatchEvent(new Event(`expand-folder-${currentFolder.id}`));
          currentFolder = folders.find(f => f.id === currentFolder.parentId);
      }

      setTimeout(() => {
          const el = document.getElementById(`book-node-${book.id}`);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-zinc-900', 'bg-zinc-50');
              setTimeout(() => el.classList.remove('ring-2', 'ring-zinc-900', 'bg-zinc-50'), 2000);
          }
      }, 150);
  };

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
          <div className="flex w-full justify-between items-center">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Listelerim</h1>
            <div className="flex gap-2">
              <button onClick={() => setIsSearching(true)} className="p-2 text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors" title="Listelerde Ara"><Search size={18} /></button>
              <button onClick={() => setIsAddingRoot(true)} className="p-2 text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors" title="Klasör Ekle"><FolderPlus size={18} /></button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {isSearching ? (
          searchTerm.trim() === '' ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <Search size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Aramak istediğiniz kitabın adını yazın.</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-1">
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} showIndicator={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <FileText size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Bu isimde bir kitap bulunamadı.</p>
            </div>
          )
        ) : (
          <>
            {isAddingRoot && (
              <form onSubmit={handleAddRootFolder} className="mb-4 flex items-center gap-2 p-2 bg-zinc-50 rounded-xl border border-zinc-200 shadow-inner">
                <input autoFocus type="text" placeholder="Yeni liste adı..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="flex-1 bg-transparent px-2 focus:outline-none text-zinc-800 text-sm" />
                <button type="submit" className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-600"><Check size={16} /></button>
                <button type="button" onClick={() => setIsAddingRoot(false)} className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-400"><X size={16} /></button>
              </form>
            )}

            {books.length === 0 && folders.length === 0 && !isAddingRoot ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
                <FileText size={48} className="opacity-20" />
                <p className="text-center text-sm font-medium">Klasör veya kitap ekleyerek başlayın.</p>
              </div>
            ) : (
              <DragDropProvider onDrop={(bookId, targetFolderId, anchorId, placement) => moveBookToPosition(bookId, targetFolderId, anchorId, placement)}>
                <RootDropZone>
                  {rootBooks.map(book => <BookCard key={book.id} book={book} onOpen={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} showIndicator={true} draggable={true} />)}
                  {rootFolders.map(folder => <FolderNode key={folder.id} folder={folder} allFolders={folders} allBooks={books} onAddBook={(fid) => { setActiveFolderForAdd(fid); setSearchModalOpen(true); }} onOpenBook={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} draggable={true} />)}
                </RootDropZone>
              </DragDropProvider>
            )}
          </>
        )}
      </div>

      {/* Yuvarlak Siyah Artı Butonu - Sağ Alt Köşe */}
      <div className="absolute bottom-24 right-6 z-20">
        <button
          onClick={() => { setActiveFolderForAdd(null); setSearchModalOpen(true); }}
          className="w-14 h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
          title="Kitap Ekle"
        >
          <Plus size={24} />
        </button>
      </div>

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

  const visibleFolders = folders.filter(f => visibleFolderIds.has(f.id));
  const rootFolders = visibleFolders.filter(f => f.parentId === null).sort((a, b) => a.order - b.order);
  const rootBooks = libraryBooks.filter(b => b.folderId === null).sort((a, b) => a.order - b.order);

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

  const handleNavigate = (book) => {
      setIsSearching(false);
      setSearchTerm('');
      
      let currentFolder = folders.find(f => f.id === book.folderId);
      while(currentFolder) {
          window.dispatchEvent(new Event(`expand-folder-${currentFolder.id}`));
          currentFolder = folders.find(f => f.id === currentFolder.parentId);
      }

      setTimeout(() => {
          const el = document.getElementById(`book-node-${book.id}`);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-zinc-900', 'bg-zinc-50');
              setTimeout(() => el.classList.remove('ring-2', 'ring-zinc-900', 'bg-zinc-50'), 2000);
          }
      }, 150);
  };

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
          <div className="flex w-full justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Kütüphanem</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5 uppercase font-semibold tracking-wider">Sahip Olduğunuz Kitaplar</p>
            </div>
            {libraryBooks.length > 0 && (
              <button onClick={() => setIsSearching(true)} className="p-2 text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors" title="Kütüphanede Ara"><Search size={18} /></button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {isSearching ? (
           searchTerm.trim() === '' ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 pb-20">
              <Search size={48} className="opacity-20" />
              <p className="text-center text-sm font-medium">Aramak istediğiniz kitabın adını yazın.</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-1">
              {filteredBooks.map(book => <BookCard key={book.id} book={book} onOpen={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} isLibraryView={true} folderPath={getFolderPath(book.folderId)} onNavigate={handleNavigate} />)}
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
          <div className="space-y-1">
             {rootBooks.map(book => <BookCard key={book.id} book={book} onOpen={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} isLibraryView={true} />)}
            {rootFolders.map(folder => <FolderNode key={folder.id} folder={folder} allFolders={visibleFolders} allBooks={libraryBooks} onOpenBook={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} isLibraryView={true} />)}
          </div>
        )}
      </div>
      <BookDetailModal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} bookId={activeBookId} />
    </div>
  );
};

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
    e.target.value = ''; // Input'u sıfırla ki aynı dosyayı tekrar seçebilsin
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
      return { total: arr.length, pages: totalPages, avg: Math.round(totalPages/arr.length)||0, long: longest.title||'-', short: shortest.pageCount>0?shortest.title:'-', fav: favAuth, price: totalPrice };
    };
    const listS = calc(books) || { total: 0, pages: 0, avg: 0, long: '-', short: '-', fav: '-', price: 0 };
    const libS = calc(libBooks) || { total: 0, pages: 0, avg: 0, long: '-', short: '-', fav: '-', price: 0 };
    const read = libBooks.filter(b => b.isRead);
    const unread = libBooks.filter(b => !b.isRead);
    const rPages = read.reduce((s, b) => s + (parseInt(b.pageCount)||0), 0);
    const uPages = unread.reduce((s, b) => s + (parseInt(b.pageCount)||0), 0);
    return { list: listS, lib: libS, read: { rCount: read.length, rPages, uCount: unread.length, uPages } };
  }, [books]);

  const Box = ({ label, value }) => (
    <div className="bg-white border border-zinc-100 p-4 rounded-xl flex flex-col justify-center shadow-sm">
      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">{label}</span>
      <span className="text-lg font-bold text-zinc-900 truncate">{value}</span>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-zinc-50">
      <div className="p-4 pt-6 pb-3 sticky top-0 bg-zinc-50/90 backdrop-blur-md z-10 border-b border-zinc-200">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Verilerim</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        <section>
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5"><List size={16} className="text-zinc-400"/> Listelerim</h2>
          <div className="grid grid-cols-2 gap-2">
            <Box label="Toplam Kitap" value={stats.list.total} />
            <Box label="Toplam Sayfa" value={stats.list.pages.toLocaleString()} />
            <Box label="Ort. Sayfa" value={stats.list.avg} />
            <Box label="Favori Yazar" value={stats.list.fav} />
            <div className="col-span-2 bg-white border border-zinc-100 p-3 rounded-xl shadow-sm">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">En Uzun Kitap</span>
                <span className="text-sm font-semibold text-zinc-800 truncate block">{stats.list.long}</span>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5"><Library size={16} className="text-zinc-400"/> Kütüphanem</h2>
          <div className="grid grid-cols-2 gap-2">
            <Box label="Toplam Kitap" value={stats.lib.total} />
            <Box label="Toplam Değer" value={`₺${stats.lib.price.toLocaleString()}`} />
            <Box label="Toplam Sayfa" value={stats.lib.pages.toLocaleString()} />
            <Box label="Favori Yazar" value={stats.lib.fav} />
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
            <Box label="Okunmayan Kitap" value={stats.read.uCount} />
            <Box label="Okunmayan Sayfa" value={stats.read.uPages.toLocaleString()} />
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
