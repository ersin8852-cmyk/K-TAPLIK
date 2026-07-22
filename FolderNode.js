const FolderNode = React.memo(({ folder, allFolders, allBooks, onOpenFolder, isLibraryView = false }) => {
  const { deleteFolder } = useArchive();
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();
  const [showDelConfirm, setShowDelConfirm] = useState(false);

  const childBooksCount = allBooks.filter(b => b.folderId === folder.id).length;
  const childFoldersCount = allFolders.filter(f => f.parentId === folder.id).length;

  const isTarget = draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === folder.id;
  const isDropInside = isTarget && overTarget.placement === 'inside';
  const isDropBefore = isTarget && overTarget.placement === 'before';
  const isDropAfter = isTarget && overTarget.placement === 'after';

  const { cardRef, handlePointerDown, handleClick, isBeingDragged } = useDraggableItem(folder, folder.parentId || 'root', () => onOpenFolder(folder.id));

  return (
    <div className="mb-1.5 relative">
      {showDelConfirm ? (
         <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between text-sm mx-2 sm:mx-4">
            <span className="text-red-800 font-medium truncate">Liste silinsin mi?</span>
            <div className="flex gap-2 shrink-0 ml-2">
              <button onClick={() => deleteFolder(folder.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-lg shadow-sm">Sil</button>
              <button onClick={() => setShowDelConfirm(false)} className="px-3 py-1.5 bg-white hover:bg-zinc-100 transition-colors text-zinc-600 border border-zinc-200 rounded-lg shadow-sm">İptal</button>
            </div>
         </div>
      ) : (
        <>
          {isDropBefore && <div className="absolute -top-1 left-4 right-4 h-0.5 bg-zinc-900 rounded-full z-10" />}
          <div
            ref={cardRef}
            data-item-target={folder.id}
            data-item-type="folder"
            data-item-folder={folder.parentId || 'root'}
            className={`group flex items-center justify-between p-3.5 rounded-xl transition-all border shadow-sm cursor-pointer ml-2 sm:ml-4 relative select-none
              ${isDropInside ? 'bg-zinc-900/5 border-zinc-900 border-dashed scale-[1.02]' : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md'}
              ${isBeingDragged ? 'opacity-0' : ''}`}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
          >
            {draggedId && (
              <div 
                data-drop-inside={folder.id}
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 z-20 flex items-center justify-center pointer-events-auto"
              >
                <div className="bg-zinc-900/10 text-zinc-600 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm pointer-events-none transition-transform hover:scale-110">
                  <List size={16} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 flex-1 overflow-hidden pointer-events-none">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white" style={{ backgroundColor: folder.color || '#71717a' }}>
                <List size={20} />
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
              <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 relative z-30">
                <button onClick={(e) => { e.stopPropagation(); setShowDelConfirm(true); }} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors pointer-events-auto" title="Listeyi Sil"><Trash2 size={16} /></button>
              </div>
            )}
          </div>
          {isDropAfter && <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-zinc-900 rounded-full z-10" />}
        </>
      )}
    </div>
  );
});
