const FolderNode = ({ folder, allFolders, allBooks, level = 0, onAddBook, onOpenBook, isLibraryView = false }) => {
  const { addFolder, reorderFolder, deleteFolder } = useArchive();
  const { overTarget, draggedId } = useDragDrop();
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

  const isDropTarget = draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === folder.id;

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
          data-folder-target={folder.id}
          className={`group flex items-center justify-between p-2 rounded-xl transition-colors border ${isDropTarget ? 'bg-zinc-900/5 border-zinc-900 border-dashed' : 'border-transparent hover:bg-zinc-50 hover:border-zinc-100'}`}
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
            <BookList ids={childBooks.map(b => b.id)} books={allBooks} folderKey={folder.id} onOpen={onOpenBook} showIndicator={!isLibraryView} isLibraryView={isLibraryView} />
          </div>
          <div>
            {childFolders.map(childFolder => (
              <FolderNode key={childFolder.id} folder={childFolder} allFolders={allFolders} allBooks={allBooks} level={level + 1} onAddBook={onAddBook} onOpenBook={onOpenBook} isLibraryView={isLibraryView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
