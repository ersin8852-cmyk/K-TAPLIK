const FolderNode = React.memo(({ folder, allFolders, allBooks, onOpenFolder, onEdit, isLibraryView = false, index }) => {
  const { overTarget } = useOverTarget();
  const { draggedId } = useDraggedItem();

  const childBooksCount = allBooks.filter(b => b.folderId === folder.id).length;
  const childFoldersCount = allFolders.filter(f => f.parentId === folder.id).length;

  const isTarget = draggedId && overTarget && overTarget.type === 'folder' && overTarget.id === folder.id;
  const isDropInside = isTarget && overTarget.placement === 'inside';
  const isDropBefore = isTarget && overTarget.placement === 'before';
  const isDropAfter = isTarget && overTarget.placement === 'after';

  const { cardRef, handlePointerDown, handleClick, isBeingDragged } = useDraggableItem(folder, folder.parentId || 'root', () => onOpenFolder(folder.id), 'folder');

  return (
    <div className="relative">
      {isDropBefore && <div className="absolute -top-1 left-4 right-4 h-0.5 bg-zinc-900 rounded-full z-10" />}
      <div
        ref={cardRef}
        data-item-target={folder.id}
        data-item-type="folder"
        data-item-folder={folder.parentId || 'root'}
        className={`group flex items-center justify-between p-3.5 rounded-xl transition-all border shadow-sm cursor-pointer ml-2 sm:ml-4 relative select-none
          ${isDropInside ? 'bg-zinc-900/5 border-zinc-900 border-dashed scale-[1.02]' : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md'}
          ${isBeingDragged ? 'opacity-0' : ''}`}
        onPointerDown={isLibraryView ? undefined : handlePointerDown}
        onClick={handleClick}
      >

        <div className="flex items-center gap-3 flex-1 overflow-hidden pointer-events-none">
          {index != null && (
            <span className="text-zinc-400 font-semibold text-sm w-5 text-right shrink-0">{index}.</span>
          )}
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

        <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 relative z-30">
          {!isLibraryView && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(folder.id); }} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors pointer-events-auto" title="Ayarlar"><Settings size={16} /></button>
          )}
        </div>
      </div>
      {isDropAfter && <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-zinc-900 rounded-full z-10" />}
    </div>
  );
});
