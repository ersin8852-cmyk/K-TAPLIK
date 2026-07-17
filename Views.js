const BookCard = ({ book, onOpen, showIndicator = false, draggable = false, folderPath = null, onNavigate = null }) => {
  const dnd = useDragDrop();
  const isDragged = draggable && dnd && dnd.draggedId === book.id;
  const over = draggable && dnd && dnd.overTarget && dnd.overTarget.type === 'book' && dnd.overTarget.id === book.id ? dnd.overTarget.placement : null;

  return (
    <div
      id={`book-node-${book.id}`}
      data-book-target={draggable ? book.id : undefined}
      data-book-target-folder={draggable ? (book.folderId === null ? 'root' : book.folderId) : undefined}
      className={`group flex items-center justify-between p-3 mb-1.5 bg-white border rounded-xl shadow-sm hover:border-zinc-300 transition-all ml-2 sm:ml-4 ${isDragged ? 'opacity-30' : 'border-zinc-100'} ${over === 'before' ? 'border-t-2 border-t-zinc-900' : ''} ${over === 'after' ? 'border-b-2 border-b-zinc-900' : ''}`}
    >
      <div className="flex-1 cursor-pointer flex items-center gap-3 overflow-hidden" onClick={() => onOpen(book.id)}>
        <div className="bg-zinc-50 rounded-lg text-zinc-400 border border-zinc-100 shrink-0 overflow-hidden w-8 h-11 flex items-center justify-center">
          {book.cover ? <img src={book.cover} alt="" className="w-full h-full object-cover" /> : <BookOpen size={16} />}
        </div>
        <div className="truncate flex-1">
          <h4 className="font-semibold text-zinc-800 text-sm truncate">{book.title}</h4>
          {folderPath ? (
             <p className="text-[10px] font-medium text-zinc-500 truncate flex items-center gap-1 mt-1 cursor-pointer hover:text-zinc-900 transition-colors bg-zinc-100 hover:bg-zinc-200 w-fit px-2 py-0.5 rounded-full" onClick={(e) => { if (onNavigate) { e.stopPropagation(); onNavigate(book); } }} title="Klasördeki yerine git">
               <Folder size={10} /> {folderPath} <MoveRight size={10} className="ml-0.5 opacity-60" />
             </p>
          ) : (
             <p className="text-[11px] text-zinc-500 truncate">{book.publisher || 'Yayınevi Yok'}</p>
          )}
        </div>
        {showIndicator && book.inLibrary && <span className="ml-auto w-2 h-2 rounded-full bg-zinc-900 shrink-0" title="Kütüphanemde"></span>}
      </div>
      {draggable && (
        <span className="p-2 -mr-1 text-zinc-300 hover:text-zinc-600 cursor-grab active:cursor-grabbing touch-none shrink-0" title="Sürükle" onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); dnd.startDrag(book.id, e); }} onPointerMove={(e) => { if (dnd.draggedId === book.id) { e.stopPropagation(); dnd.updateDrag(e); } }} onPointerUp={(e) => { if (dnd.draggedId === book.id) { e.stopPropagation(); dnd.endDrag(); } }} onPointerCancel={() => dnd.cancelDrag()} onClick={(e) => e.stopPropagation()}><GripVertical size={16} /></span>
      )}
    </div>
  );
};

const FolderNode = ({ folder, allFolders, allBooks, level = 0, onAddBook, onOpenBook, isLibraryView = false, draggable = false, activeFolder, setActiveFolder }) => {
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
          onClick={(e) => { e.stopPropagation(); setActiveFolder(folder.id); }}
          data-folder-target={draggable ? folder.id : undefined}
          className={`group flex items-center justify-between p-2 rounded-xl transition-all border cursor-pointer ${activeFolder === folder.id ? 'bg-zinc-900 text-white shadow-md' : 'border-transparent hover:bg-zinc-50 hover:border-zinc-100'}`}
        >
          <div className="flex items-center gap-2 cursor-pointer flex-1 overflow-hidden" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
            {isOpen ? <ChevronDown size={18} className={activeFolder === folder.id ? "text-zinc-300" : "text-zinc-400"} /> : <ChevronRight size={18} className={activeFolder === folder.id ? "text-zinc-300" : "text-zinc-400"} />}
            <span className={`font-semibold text-sm truncate ${activeFolder === folder.id ? 'text-white' : 'text-zinc-700'}`}>{folder.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${activeFolder === folder.id ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'}`}>{childBooks.length}</span>
          </div>

          {!isLibraryView && (
            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${activeFolder === folder.id ? 'text-zinc-300' : 'text-zinc-400'}`}>
              <button onClick={(e) => { e.stopPropagation(); setShowDelConfirm(true); }} className="p-1.5 hover:text-red-500" title="Klasörü Sil"><Trash2 size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); setIsAddingFolder(true); }} className="p-1.5 hover:text-zinc-900" title="Alt Klasör Ekle"><FolderPlus size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); onAddBook(folder.id); }} className="p-1.5 hover:text-zinc-900" title="Kitap Ekle"><Plus size={14} /></button>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="mt-1 border-l-2 border-zinc-100 ml-3">
          {isAddingFolder && (
            <form onSubmit={(e) => { e.preventDefault(); addFolder(newFolderName, folder.id); setIsAddingFolder(false); }} className="ml-2 mb-2 flex items-center gap-2">
              <input autoFocus type="text" placeholder="Ad..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="text-sm px-2 py-1 border rounded-lg w-full" />
            </form>
          )}
          {childBooks.map(book => <BookCard key={book.id} book={book} onOpen={onOpenBook} showIndicator={!isLibraryView} draggable={draggable} />)}
          {childFolders.map(childFolder => <FolderNode key={childFolder.id} folder={childFolder} allFolders={allFolders} allBooks={allBooks} level={level + 1} onAddBook={onAddBook} onOpenBook={onOpenBook} isLibraryView={isLibraryView} draggable={draggable} activeFolder={activeFolder} setActiveFolder={setActiveFolder} />)}
        </div>
      )}
    </div>
  );
};

const RootDropZone = ({ children }) => {
  const dnd = useDragDrop();
  const isOver = dnd && dnd.overTarget && dnd.overTarget.type === 'folder' && dnd.overTarget.id === 'root';
  return <div data-folder-target="root" className={`space-y-1 min-h-[60px] rounded-xl transition-colors ${isOver ? 'bg-zinc-900/5' : ''}`}>{children}</div>;
};

const ListsView = () => {
  const { folders, books, addFolder, moveBookToPosition } = useArchive();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeBookId, setActiveBookId] = useState(null);

  const rootFolders = folders.filter(f => f.parentId === null).sort((a, b) => a.order - b.order);
  const rootBooks = books.filter(b => b.folderId === null).sort((a, b) => a.order - b.order);

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="p-4 pt-6 pb-3 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-zinc-100 flex items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Listelerim</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32" onClick={() => setActiveFolder(null)}>
        <DragDropProvider onDrop={(bId, fId) => moveBookToPosition(bId, fId)}>
          <RootDropZone>
            {rootBooks.map(b => <BookCard key={b.id} book={b} onOpen={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} draggable={true} />)}
            {rootFolders.map(f => (
              <FolderNode 
                key={f.id} folder={f} allFolders={folders} allBooks={books} 
                onOpenBook={(id) => { setActiveBookId(id); setDetailModalOpen(true); }} 
                draggable={true} activeFolder={activeFolder} setActiveFolder={setActiveFolder} 
                onAddBook={(fid) => { setActiveFolder(fid); setSearchModalOpen(true); }} 
              />
            ))}
          </RootDropZone>
        </DragDropProvider>
      </div>

      <button 
        onClick={() => setSearchModalOpen(true)} 
        className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-[9999]"
      >
        <Plus size={28} />
      </button>

      <SearchAddModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} folderId={activeFolder} />
      <BookDetailModal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} bookId={activeBookId} />
    </div>
  );
};
