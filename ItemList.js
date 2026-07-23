const ItemList = React.memo(({ ids, items, folders, books, folderKey, onOpenBook, onOpenFolder, onEditFolder, showIndicator = false, isLibraryView = false }) => {
  const { draggedId, cardSize } = useDraggedItem();
  const { overTarget } = useOverTarget();
  const nodeRefs = React.useRef(new Map());
  const prevRects = React.useRef(new Map());
  const prevDraggedId = React.useRef(null);

  // Sürüklenen kart listeden çıkarılmaz — opacity:0 ile görünmez ama yeri korunur, diğer kartlar kaymaz
  const visibleIds = ids;

  let previewIndex = null;
  if (draggedId && overTarget) {
    if (overTarget.folderId === folderKey || (overTarget.type === 'folder' && overTarget.id === folderKey && overTarget.placement !== 'inside')) {
      const idx = visibleIds.indexOf(overTarget.id);
      if (idx !== -1) previewIndex = overTarget.placement === 'after' ? idx + 1 : idx;
    } else if (overTarget.type === 'folder' && overTarget.id === folderKey && overTarget.placement === 'inside') {
      // Klasörün geneline (veya sayfanın altındaki boşluğa) sürükleniyorsa boşluğu en sona ekle
      previewIndex = visibleIds.length;
    }
  }

  React.useLayoutEffect(() => {
    const newRects = new Map();
    nodeRefs.current.forEach((el, id) => { 
      if (el) {
        newRects.set(id, { top: el.offsetTop });
      }
    });

    const dragJustStarted = draggedId && !prevDraggedId.current;
    const droppedId = (!draggedId && prevDraggedId.current) ? prevDraggedId.current : null;
    
    prevDraggedId.current = draggedId;

    if (!dragJustStarted) {
      nodeRefs.current.forEach((el, id) => {
        if (!el) return;
        if (id === droppedId) return;

        const prev = prevRects.current.get(id);
        const next = newRects.get(id);
        if (prev && next) {
          const dy = prev.top - next.top;
          if (Math.abs(dy) > 0.5) {
            el.style.transition = 'none';
            el.style.transform = `translateY(${dy}px)`;
            requestAnimationFrame(() => {
              el.style.transition = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)';
              el.style.transform = '';
            });
          }
        }
      });
    }

    prevRects.current = newRects;
  });

  const renderList = [...visibleIds];
  if (previewIndex !== null) renderList.splice(previewIndex, 0, '__gap__');

  return renderList.map((id) => {
    if (id === '__gap__') {
      return (
        <div
          key="__gap__"
          ref={el => { if (el) nodeRefs.current.set('__gap__', el); else nodeRefs.current.delete('__gap__'); }}
          data-drop-gap="true"
          style={{ 
            height: cardSize.height || 64, 
            transition: 'height 220ms cubic-bezier(0.2,0,0,1)',
            position: 'relative',
            zIndex: 50
          }}
        />
      );
    }
    const item = items.find(i => i.id === id);
    if (!item) return null;
    return (
      <div 
        key={id} 
        ref={el => { if (el) nodeRefs.current.set(id, el); else nodeRefs.current.delete(id); }}
        style={draggedId === id ? { height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none', margin: 0, padding: 0 } : undefined}
      >
        {item._type === 'folder' ? (
          <FolderNode folder={item} allFolders={folders} allBooks={books} onOpenFolder={onOpenFolder} onEdit={onEditFolder} isLibraryView={isLibraryView} index={visibleIds.indexOf(id) + 1} />
        ) : (
          <BookCard book={item} onOpen={onOpenBook} showIndicator={showIndicator} isLibraryView={isLibraryView} containerFolderId={folderKey} index={visibleIds.indexOf(id) + 1} />
        )}
      </div>
    );
  });
});
