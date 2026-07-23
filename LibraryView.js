const LibraryView = ({ activeFolderId, setActiveFolderId, onOpenProfile }) => {
  const { folders, books } = useArchive();
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();
  const [detailModalOpen, openDetailModal, closeDetailModal] = window.useHistoryModal('detail-library');
  const [listEditModalOpen, openListEditModal, closeListEditModal] = window.useHistoryModal('list-edit-library');
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
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-sm flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200">
          <button onClick={onOpenProfile} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
            <User size={22} />
          </button>
          <div className="flex-1 flex justify-center items-center">
            {/* İleride buraya Logo gelecek */}
          </div>
          {libraryBooks.length > 0 && (
            <button onClick={() => { setIsSearching(!isSearching); if(isSearching) setSearchTerm(''); }} className={`p-2 -mr-2 rounded-full transition-colors ${isSearching ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'}`}>
              {isSearching ? <X size={22} /> : <Search size={22} />}
            </button>
          )}
        </div>

        <div className="p-4 py-3 min-h-[60px] flex items-center border-b border-zinc-100">
          {isSearching ? (
            <div className="flex w-full items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
                <input autoFocus type="text" placeholder="Kütüphanede ara..." className="w-full pl-9 pr-3 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              <div className="flex w-full justify-between items-start">
                <button onClick={() => setActiveFolderId(null)} className={`text-left flex items-center gap-1.5 transition-all w-full px-2 py-1 rounded-lg border ${(!activeFolderId) ? 'text-zinc-900 font-bold bg-zinc-50 border-transparent' : 'text-zinc-600 font-medium hover:bg-zinc-50 hover:text-zinc-900 border-transparent'} ${(draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === 'root' && overTarget.source === 'breadcrumb') ? 'ring-2 ring-zinc-900 border-dashed bg-zinc-100' : ''}`} data-breadcrumb-target="root">
                  {!activeFolderId && <Library size={18} className="mr-1" />}
                  Kütüphanem
                </button>
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
