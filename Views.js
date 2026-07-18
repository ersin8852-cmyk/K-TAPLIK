const BookCard = memo(({ 
  book, 
  onOpen, 
  showIndicator = false, 
  draggable = false, 
  folderPath = null, 
  onNavigate = null,
  isLibraryView = false 
}) => {
  const dnd = useDragDrop();
  const isDragged = draggable && dnd?.draggedId === book.id;
  const over = draggable && dnd?.overTarget?.type === 'book' && dnd.overTarget.id === book.id ? dnd.overTarget.placement : null;
  
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const hasMovedRef = useRef(false);
  const isPointerDownRef = useRef(false);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
    
    startPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    isDraggingRef.current = false;
    isPointerDownRef.current = true;

    if (!draggable || !dnd) return;
    
    e.preventDefault();
    try { 
      e.currentTarget.setPointerCapture(e.pointerId); 
    } catch(err) {}
    
    longPressTimerRef.current = setTimeout(() => {
      if (isPointerDownRef.current) {
        isDraggingRef.current = true;
        dnd.startDrag(book.id, e);
      }
    }, 300);
  }, [draggable, dnd, book.id]);

  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    
    if (dx > 5 || dy > 5) {
      hasMovedRef.current = true;
    }

    if (!draggable || !dnd) return;
    
    if (hasMovedRef.current && !isDraggingRef.current && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      isDraggingRef.current = true;
      dnd.startDrag(book.id, e);
    }
    
    if (isDraggingRef.current && dnd.draggedId === book.id) {
      const offsetY = e.clientY - startPosRef.current.y;
      setDragOffset({ x: 0, y: offsetY });
      dnd.updateDrag(e);
    }
  }, [draggable, dnd, book.id]);

  const handlePointerUp = useCallback((e) => {
    e.stopPropagation();
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const wasDragging = isDraggingRef.current;
    const wasMoved = hasMovedRef.current;

    isPointerDownRef.current = false;

    if (!wasMoved && !wasDragging) {
      if (onOpen) onOpen(book.id);
    }

    if (!draggable || !dnd) return;

    try { 
      e.currentTarget.releasePointerCapture(e.pointerId); 
    } catch(err) {}
    
    if (wasDragging && dnd.draggedId === book.id) {
      setDragOffset({ x: 0, y: 0 });
      dnd.endDrag();
    }
    
    isDraggingRef.current = false;
  }, [draggable, dnd, onOpen, book.id]);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (draggable && dnd) {
      setDragOffset({ x: 0, y: 0 });
      dnd.cancelDrag();
    }
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    isPointerDownRef.current = false;
  }, [draggable, dnd]);

  return (
    <div
      id={`book-node-${book.id}`}
      data-book-target={draggable ? book.id : undefined}
      data-book-target-folder={draggable ? (book.folderId === null ? 'root' : book.folderId) : undefined}
      style={{
        marginTop: over === 'after' ? '2rem' : '0.375rem',
        marginBottom: over === 'before' ? '2rem' : '0.375rem',
        transition: isDragged ? 'none' : 'margin 0.2s ease, opacity 0.2s ease, transform 0.2s ease',
        transform: isDragged ? `translateY(${dragOffset.y}px)` : 'none',
        opacity: isDragged ? 0.9 : 1,
        zIndex: isDragged ? 50 : 'auto',
        position: isDragged ? 'relative' : undefined,
        boxShadow: isDragged ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: draggable ? 'none' : 'auto',
        msTouchAction: draggable ? 'none' : 'auto',
      }}
      className={`group flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm hover:border-zinc-300 ml-2 sm:ml-4 ${!isDragged ? 'border-zinc-100' : ''} ${draggable && !isDragged ? 'cursor-grab active:cursor-grabbing select-none' : ''} ${isDragged ? 'cursor-grabbing border-zinc-300' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex-1 flex items-center gap-3 overflow-hidden pointer-events-none">
        <div className="bg-zinc-50 rounded-lg text-zinc-400 border border-zinc-100 shrink-0 overflow-hidden w-8 h-11 flex items-center justify-center">
          {book.cover ? (
            <img 
              src={book.cover} 
              alt={`${book.title} kapağı`}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
              }}
            />
          ) : (
            <BookOpen size={16} />
          )}
        </div>
        <div className="truncate flex-1">
          <h4 className="font-semibold text-zinc-800 text-sm truncate">{book.title}</h4>
          {folderPath ? (
             <p 
               className="text-[10px] font-medium text-zinc-500 truncate flex items-center gap-1 mt-1 cursor-pointer pointer-events-auto hover:text-zinc-900 transition-colors bg-zinc-100 hover:bg-zinc-200 w-fit px-2 py-0.5 rounded-full"
               onPointerDown={(e) => e.stopPropagation()}
               onPointerUp={(e) => { 
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
});

// ===================== FOLDER NODE =====================
const FolderNode = memo(({ 
  folder, 
  allFolders, 
  allBooks, 
  level = 0, 
  onAddBook, 
  onOpenBook, 
  isLibraryView = false, 
  draggable = false 
}) => {
  const { addFolder, reorderFolder, deleteFolder } = useArchive();
  const dnd = useDragDrop();
  const isDropTarget = draggable && dnd?.overTarget?.type === 'folder' && dnd.overTarget.id === folder.id;
  const [isOpen, setIsOpen] = useState(true);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDelConfirm, setShowDelConfirm] = useState(false);

  const childFolders = useMemo(() => 
    allFolders
      .filter(f => f.parentId === folder.id)
      .sort((a, b) => a.order - b.order),
    [allFolders, folder.id]
  );

  const childBooks = useMemo(() => 
    allBooks
      .filter(b => b.folderId === folder.id)
      .sort((a, b) => a.order - b.order),
    [allBooks, folder.id]
  );

  useEffect(() => {
    const handleExpand = () => setIsOpen(true);
    window.addEventListener(`expand-folder-${folder.id}`, handleExpand);
    return () => window.removeEventListener(`expand-folder-${folder.id}`, handleExpand);
  }, [folder.id]);

  const handleAddSubfolder = useCallback((e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), folder.id);
      setNewFolderName('');
      setIsAddingFolder(false);
      setIsOpen(true);
    }
  }, [addFolder, folder.id, newFolderName]);

  const handleToggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setShowDelConfirm(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setShowDelConfirm(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    deleteFolder(folder.id);
  }, [deleteFolder, folder.id]);

  const handleAddFolderClick = useCallback(() => {
    setIsAddingFolder(true);
  }, []);

  const handleAddBookClick = useCallback(() => {
    onAddBook(folder.id);
  }, [onAddBook, folder.id]);

  const handleReorderUp = useCallback(() => {
    reorderFolder(folder.id, 'up');
  }, [reorderFolder, folder.id]);

  const handleReorderDown = useCallback(() => {
    reorderFolder(folder.id, 'down');
  }, [reorderFolder, folder.id]);

  return (
    <div className="mb-1" style={{ marginLeft: level > 0 ? '0.75rem' : '0' }}>
      {showDelConfirm ? (
         <div className="p-2 mb-2 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between text-xs">
            <span className="text-red-800 font-medium truncate">Klasör silinsin mi?</span>
            <div className="flex gap-1 shrink-0 ml-2">
              <button onClick={handleConfirmDelete} className="px-2 py-1 bg-red-600 text-white rounded">Sil</button>
              <button onClick={handleCancelDelete} className="px-2 py-1 bg-white text-zinc-600 border rounded">İptal</button>
            </div>
         </div>
      ) : (
        <div
          data-folder-target={draggable ? folder.id : undefined}
          className={`group flex items-center justify-between p-2 rounded-xl transition-colors border ${isDropTarget ? 'bg-zinc-50 border-dashed border-zinc-300' : 'border-transparent hover:bg-zinc-50 hover:border-zinc-100'}`}
        >
          <div className="flex items-center gap-2 cursor-pointer flex-1 overflow-hidden" onClick={handleToggleOpen}>
            {isOpen ? <ChevronDown size={18} className="text-zinc-400 shrink-0" /> : <ChevronRight size={18} className="text-zinc-400 shrink-0" />}
            <span className="font-semibold text-zinc-700 text-sm truncate">{folder.name}</span>
            <span className="text-[10px] text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-full shrink-0">{childBooks.length}</span>
          </div>

          {!isLibraryView && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={handleDeleteClick} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Klasörü Sil"><Trash2 size={14} /></button>
              <button onClick={handleAddFolderClick} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg" title="Alt Klasör Ekle"><FolderPlus size={14} /></button>
              <button onClick={handleAddBookClick} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg" title="Kitap Ekle"><Plus size={14} /></button>
              <div className="flex flex-col ml-1 border-l border-zinc-200 pl-1">
                <button onClick={handleReorderUp} className="p-0.5 text-zinc-400 hover:text-zinc-800"><ArrowUp size={10} /></button>
                <button onClick={handleReorderDown} className="p-0.5 text-zinc-400 hover:text-zinc-800"><ArrowDown size={10} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="mt-1 border-l-2 border-zinc-100 ml-3">
          {isAddingFolder && (
            <form onSubmit={handleAddSubfolder} className="ml-2 mb-2 flex items-center gap-2">
              <input 
                autoFocus 
                type="text" 
                placeholder="Klasör adı..." 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)} 
                className="text-sm px-3 py-1.5 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-zinc-50 w-full" 
              />
              <button type="button" onClick={() => setIsAddingFolder(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600 bg-zinc-100 rounded-lg"><X size={16} /></button>
            </form>
          )}
          <div className="mt-1">
            {childBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onOpen={onOpenBook} 
                showIndicator={!isLibraryView} 
                draggable={draggable} 
                isLibraryView={isLibraryView}
              />
            ))}
          </div>
          <div>
            {childFolders.map(childFolder => (
              <FolderNode 
                key={childFolder.id} 
                folder={childFolder} 
                allFolders={allFolders} 
                allBooks={allBooks} 
                level={level + 1} 
                onAddBook={onAddBook} 
                onOpenBook={onOpenBook} 
                isLibraryView={isLibraryView} 
                draggable={draggable} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ===================== ROOT DROP ZONE =====================
const RootDropZone = ({ children }) => {
  const dnd = useDragDrop();
  const isOver = dnd?.overTarget?.type === 'folder' && dnd.overTarget.id === 'root';
  return (
    <div data-folder-target="root" className={`space-y-1 min-h-[60px] rounded-xl transition-colors ${isOver ? 'bg-zinc-50' : ''}`}>
      {children}
    </div>
  );
};

// ===================== LISTS VIEW =====================
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

  const rootFolders = useMemo(() => 
    folders.filter(f => f.parentId === null).sort((a, b) => a.order - b.order),
    [folders]
  );
  
  const rootBooks = useMemo(() => 
    books.filter(b => b.folderId === null).sort((a, b) => a.order - b.order),
    [books]
  );

  const filteredBooks = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return books.filter(b => 
      b.title.toLowerCase().includes(term) || 
      (b.author && b.author.toLowerCase().includes(term))
    );
  }, [books, searchTerm]);

  const getFolderPath = useCallback((folderId) => {
    if (!folderId) return 'Ana Dizin';
    let current = folders.find(f => f.id === folderId);
    const path = [];
    let maxDepth = 20;
    while(current && maxDepth > 0) {
      path.unshift(current.name);
      current = folders.find(f => f.id === current.parentId);
      maxDepth--;
    }
    return path.join(' / ') || 'Ana Dizin';
  }, [folders]);

  const handleAddRootFolder = useCallback((e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), null);
      setNewFolderName('');
      setIsAddingRoot(false);
    }
  }, [addFolder, newFolderName]);

  const handleNavigate = useCallback((book) => {
    setIsSearching(false);
    setSearchTerm('');
    
    let currentFolder = folders.find(f => f.id === book.folderId);
    const folderIds = [];
    while(currentFolder) {
      folderIds.push(currentFolder.id);
      currentFolder = folders.find(f => f.id === currentFolder.parentId);
    }
    
    folderIds.forEach(id => {
      window.dispatchEvent(new Event(`expand-folder-${id}`));
    });

    const el = document.getElementById(`book-node-${book.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-zinc-900', 'bg-zinc-50');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-zinc-900', 'bg-zinc-50');
      }, 2000);
    }
  }, [folders]);

  const handleOpenBook = useCallback((id) => {
    setActiveBookId(id);
    setDetailModalOpen(true);
  }, []);

  const handleAddBook = useCallback((folderId) => {
    setActiveFolderForAdd(folderId);
    setSearchModalOpen(true);
  }, []);

  const handleSearchToggle = useCallback(() => {
    setIsSearching(prev => !prev);
    if (isSearching) setSearchTerm('');
  }, [isSearching]);

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="p-4 pt-6 pb-3 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-zinc-100 shadow-sm min-h-[70px] flex items-center">
        {isSearching ? (
          <div className="flex w-full items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
              <input 
                autoFocus 
                type="text" 
                placeholder="Kitap veya yazar ara..." 
                className="w-full pl-9 pr-3 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <button onClick={() => { setIsSearching(false); setSearchTerm(''); }} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-xl"><X size={18} /></button>
          </div>
        ) : (
          <div className="flex w-full justify-between items-center">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Listelerim</h1>
            <div className="flex gap-2">
              <button onClick={handleSearchToggle} className="p-2 text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors" title="Listelerde Ara"><Search size={18} /></button>
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
              {filteredBooks.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onOpen={handleOpenBook} 
                  showIndicator={true} 
                  folderPath={getFolderPath(book.folderId)} 
                  onNavigate={handleNavigate} 
                />
              ))}
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
                <input 
                  autoFocus 
                  type="text" 
                  placeholder="Yeni liste adı..." 
                  value={newFolderName} 
                  onChange={e => setNewFolderName(e.target.value)} 
                  className="flex-1 bg-transparent px-2 focus:outline-none text-zinc-800 text-sm" 
                />
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
                  {rootBooks.map(book => (
                    <BookCard 
                      key={book.id} 
                      book={book} 
                      onOpen={handleOpenBook} 
                      showIndicator={true} 
                      draggable={true} 
                    />
                  ))}
                  {rootFolders.map(folder => (
                    <FolderNode 
                      key={folder.id} 
                      folder={folder} 
                      allFolders={folders} 
                      allBooks={books} 
                      onAddBook={handleAddBook} 
                      onOpenBook={handleOpenBook} 
                      draggable={true} 
                    />
                  ))}
                </RootDropZone>
              </DragDropProvider>
            )}
          </>
        )}
      </div>

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

// ===================== LIBRARY VIEW =====================
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
      if (folder?.parentId) addFolderAndAncestors(folder.parentId);
    };
    libraryBooks.forEach(book => {
      if (book.folderId) addFolderAndAncestors(book.folderId);
    });
    return ids;
  }, [libraryBooks, folders]);

  const visibleFolders = useMemo(() => 
    folders.filter(f => visibleFolderIds.has(f.id)),
    [folders, visibleFolderIds]
  );

  const rootFolders = useMemo(() => 
    visibleFolders.filter(f => f.parentId === null).sort((a, b) => a.order - b.order),
    [visibleFolders]
  );

  const rootBooks = useMemo(() => 
    libraryBooks.filter(b => b.folderId === null).sort((a, b) => a.order - b.order),
    [libraryBooks]
  );

  const filteredBooks = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return libraryBooks.filter(b => 
      b.title.toLowerCase().includes(term) || 
      (b.author && b.author.toLowerCase().includes(term))
    );
  }, [libraryBooks, searchTerm]);

  const getFolderPath = useCallback((folderId) => {
    if (!folderId) return 'Ana Dizin';
    let current = folders.find(f => f.id === folderId);
    const path = [];
    let maxDepth = 20;
    while(current && maxDepth > 0) {
      path.unshift(current.name);
      current = folders.find(f => f.id === current.parentId);
      maxDepth--;
    }
    return path.join(' / ') || 'Ana Dizin';
  }, [folders]);

  const handleNavigate = useCallback((book) => {
    setIsSearching(false);
    setSearchTerm('');
    
    let currentFolder = folders.find(f => f.id === book.folderId);
    const folderIds = [];
    while(currentFolder) {
      folderIds.push(currentFolder.id);
      currentFolder = folders.find(f => f.id === currentFolder.parentId);
    }
    
    folderIds.forEach(id => {
      window.dispatchEvent(new Event(`expand-folder-${id}`));
    });

    const el = document.getElementById(`book-node-${book.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-zinc-900', 'bg-zinc-50');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-zinc-900', 'bg-zinc-50');
      }, 2000);
    }
  }, [folders]);

  const handleOpenBook = useCallback((id) => {
    setActiveBookId(id);
    setDetailModalOpen(true);
  }, []);

  const handleSearchToggle = useCallback(() => {
    setIsSearching(prev => !prev);
    if (isSearching) setSearchTerm('');
  }, [isSearching]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 pt-6 pb-3 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-zinc-100 shadow-sm min-h-[70px] flex flex-col justify-center">
        {isSearching ? (
          <div className="flex w-full items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
              <input 
                autoFocus 
                type="text" 
                placeholder="Kütüphanede ara..." 
                className="w-full pl-9 pr-3 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
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
              <button onClick={handleSearchToggle} className="p-2 text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors" title="Kütüphanede Ara"><Search size={18} /></button>
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
              {filteredBooks.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onOpen={handleOpenBook} 
                  isLibraryView={true} 
                  folderPath={getFolderPath(book.folderId)} 
                  onNavigate={handleNavigate} 
                />
              ))}
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
            {rootBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onOpen={handleOpenBook} 
                isLibraryView={true} 
              />
            ))}
            {rootFolders.map(folder => (
              <FolderNode 
                key={folder.id} 
                folder={folder} 
                allFolders={visibleFolders} 
                allBooks={libraryBooks} 
                onOpenBook={handleOpenBook} 
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

// ===================== STATS VIEW =====================
const StatBox = memo(({ label, value }) => (
  <div className="bg-white border border-zinc-100 p-4 rounded-xl flex flex-col justify-center shadow-sm">
    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">{label}</span>
    <span className="text-lg font-bold text-zinc-900 truncate">{value}</span>
  </div>
));

const StatsView = () => {
  const { books, folders, importData, showToast } = useArchive();
  const fileInputRef = useRef(null);

  const handleExport = useCallback(() => {
    const data = { books, folders };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kitap-listem-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Veriler başarıyla yedeklendi.', 'success');
  }, [books, folders, showToast]);

  const handleImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Geçersiz veri formatı');
        }
        
        const hasBooks = Array.isArray(parsed.books);
        const hasFolders = Array.isArray(parsed.folders);
        
        if (!hasBooks && !hasFolders) {
          throw new Error('Geçersiz veri yapısı: books veya folders dizisi bulunamadı');
        }
        
        const jsonSize = new Blob([event.target?.result]).size;
        if (jsonSize > 50 * 1024 * 1024) {
          throw new Error('Dosya çok büyük (maksimum 50MB)');
        }
        
        importData(parsed);
        showToast('Veriler başarıyla içe aktarıldı.', 'success');
      } catch (err) {
        showToast(`Dosya okunamadı: ${err.message}`, 'error');
      }
    };
    
    reader.onerror = () => {
      showToast('Dosya okunamadı.', 'error');
    };
    
    reader.readAsText(file);
    e.target.value = '';
  }, [importData, showToast]);

  const stats = useMemo(() => {
    const libBooks = books.filter(b => b.inLibrary);
    
    const calc = (arr) => {
      if (arr.length === 0) return null;
      
      let totalPages = 0;
      let totalPrice = 0;
      let longest = arr[0];
      let shortest = arr[0];
      const authors = {};
      
      for (const b of arr) {
        const p = parseInt(b.pageCount) || 0;
        totalPages += p;
        totalPrice += parseFloat(b.price) || 0;
        
        const longestPages = parseInt(longest.pageCount) || 0;
        if (p > longestPages) longest = b;
        
        const shortestPages = parseInt(shortest.pageCount) || Infinity;
        if (p > 0 && p < shortestPages) shortest = b;
        
        if (b.author) {
          authors[b.author] = (authors[b.author] || 0) + 1;
        }
      }
      
      let favAuth = '-';
      let max = 0;
      for (const [author, count] of Object.entries(authors)) {
        if (count > max) {
          max = count;
          favAuth = author;
        }
      }
      
      const shortestPages = parseInt(shortest.pageCount) || 0;
      
      return {
        total: arr.length,
        pages: totalPages,
        avg: arr.length > 0 ? Math.round(totalPages / arr.length) : 0,
        long: longest?.title || '-',
        short: shortestPages > 0 ? shortest.title : '-',
        fav: favAuth,
        price: totalPrice
      };
    };
    
    const listS = calc(books) || { total: 0, pages: 0, avg: 0, long: '-', short: '-', fav: '-', price: 0 };
    const libS = calc(libBooks) || { total: 0, pages: 0, avg: 0, long: '-', short: '-', fav: '-', price: 0 };
    
    const read = libBooks.filter(b => b.isRead);
    const unread = libBooks.filter(b => !b.isRead);
    const rPages = read.reduce((s, b) => s + (parseInt(b.pageCount) || 0), 0);
    const uPages = unread.reduce((s, b) => s + (parseInt(b.pageCount) || 0), 0);
    
    return {
      list: listS,
      lib: libS,
      read: {
        rCount: read.length,
        rPages: rPages,
        uCount: unread.length,
        uPages: uPages
      }
    };
  }, [books]);

  return (
    <div className="h-full flex flex-col bg-zinc-50">
      <div className="p-4 pt-6 pb-3 sticky top-0 bg-zinc-50/90 backdrop-blur-md z-10 border-b border-zinc-200">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Verilerim</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        <section>
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5">
            <List size={16} className="text-zinc-400"/> Listelerim
          </h2>
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
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5">
            <Library size={16} className="text-zinc-400"/> Kütüphanem
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Toplam Kitap" value={stats.lib.total} />
            <StatBox label="Toplam Değer" value={`₺${stats.lib.price.toLocaleString()}`} />
            <StatBox label="Toplam Sayfa" value={stats.lib.pages.toLocaleString()} />
            <StatBox label="Favori Yazar" value={stats.lib.fav} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5">
            <BookOpen size={16} className="text-zinc-400"/> Okuma (Kütüphane)
          </h2>
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
          <h2 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-1.5">
            <Download size={16} className="text-zinc-400"/> Yedekleme & Geri Yükleme
          </h2>
          <div className="bg-white border border-zinc-100 p-4 rounded-xl shadow-sm flex flex-col gap-3">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Uygulama verilerinizi cihazınıza dosya olarak indirebilir veya daha önce indirdiğiniz bir dosyayı (başka bir cihazdan) içeri aktarabilirsiniz.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleExport} 
                className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} /> Yedekle
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} /> Geri Yükle
              </button>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleImport} 
                className="hidden" 
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export { ListsView, LibraryView, StatsView };
