const FolderNode = React.memo(({ folder, allFolders, allBooks, onOpenFolder, isLibraryView = false }) => {
  const { deleteFolder, reorderFolder } = useArchive();
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();
  const [showDelConfirm, setShowDelConfirm] = useState(false);

  const childBooksCount = allBooks.filter(b => b.folderId === folder.id).length;
  const childFoldersCount = allFolders.filter(f => f.parentId === folder.id).length;

  const isDropTarget = draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === folder.id;

  return (
    <div className="mb-1.5">
      {showDelConfirm ? (
         <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between text-sm mx-2 sm:mx-4">
            <span className="text-red-800 font-medium truncate">Liste silinsin mi?</span>
            <div className="flex gap-2 shrink-0 ml-2">
              <button onClick={() => deleteFolder(folder.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-lg shadow-sm">Sil</button>
              <button onClick={() => setShowDelConfirm(false)} className="px-3 py-1.5 bg-white hover:bg-zinc-100 transition-colors text-zinc-600 border border-zinc-200 rounded-lg shadow-sm">İptal</button>
            </div>
         </div>
      ) : (
        <div
          data-folder-target={folder.id}
          className={`group flex items-center justify-between p-3.5 rounded-xl transition-all border shadow-sm cursor-pointer ml-2 sm:ml-4
            ${isDropTarget ? 'bg-zinc-900/5 border-zinc-900 border-dashed scale-[1.02]' : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md'}`}
          onClick={() => onOpenFolder(folder.id)}
        >
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
              <List size={20} className="text-zinc-500" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-zinc-800 text-[15px] truncate">{folder.name}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{childBooksCount} Kitap</span>
                {childFoldersCount > 0 && <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{childFoldersCount} Alt Liste</span>}
              </div>
            </div>
          </div>

          {!isLibraryView && (
            <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              <button onClick={(e) => { e.stopPropagation(); setShowDelConfirm(true); }} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Listeyi Sil"><Trash2 size={16} /></button>
              <div className="flex flex-col ml-1 border-l border-zinc-200 pl-1.5">
                <button onClick={(e) => { e.stopPropagation(); reorderFolder(folder.id, 'up'); }} className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded transition-colors"><ArrowUp size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); reorderFolder(folder.id, 'down'); }} className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded transition-colors"><ArrowDown size={12} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
