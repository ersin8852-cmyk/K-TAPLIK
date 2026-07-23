const { useLayoutEffect } = React;

// _isDragActive logic moved to context.js

const BookCard = React.memo(({ book, onOpen, showIndicator = false, folderPath = null, onNavigate = null, containerFolderId = null, index }) => {
  const handleNavigateOrOpen = (item) => {
    if (onNavigate) {
      onNavigate(item);
    } else if (onOpen) {
      onOpen(item.id);
    }
  };

  const { cardRef, handlePointerDown, handleClick, isBeingDragged } = useDraggableItem(book, containerFolderId, handleNavigateOrOpen);

  return (
    <div
      id={`book-node-${book.id}`}
      ref={cardRef}
      data-item-target={book.id}
      data-item-type="book"
      data-item-folder={containerFolderId || 'root'}
      className={`group flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-xl shadow-sm hover:border-zinc-300 ml-2 sm:ml-4 cursor-pointer transition-colors select-none ${isBeingDragged ? 'opacity-0' : ''}`}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div className="flex-1 flex items-center gap-3 overflow-hidden">
        {index != null && (
          <span className="text-zinc-400 font-semibold text-sm w-5 text-right shrink-0">{index}.</span>
        )}
        <div className="bg-zinc-50 rounded-lg text-zinc-400 border border-zinc-100 shrink-0 overflow-hidden w-8 h-11 flex items-center justify-center relative">
          <BookOpen size={16} className="absolute z-0" />
          <img 
            src={book.cover || 'default-cover.png'} 
            alt="" 
            className="w-full h-full object-cover absolute inset-0 z-10" 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
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
});
