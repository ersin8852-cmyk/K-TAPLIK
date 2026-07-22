const BookList = ({ ids, books, folderKey, onOpen, showIndicator = false, isLibraryView = false }) => {
  const { draggedId, overTarget, cardSize } = useDragDrop();
  const nodeRefs = useRef(new Map());
  const prevRects = useRef(new Map());
  const prevDraggedId = useRef(null);

  // Sürüklenen kart listeden çıkarılmaz — opacity:0 ile görünmez ama yeri korunur, diğer kartlar kaymaz
  const visibleIds = ids;

  let previewIndex = null;
  if (draggedId && overTarget && overTarget.type === 'book' && overTarget.folderId === folderKey) {
    const idx = visibleIds.indexOf(overTarget.id);
    if (idx !== -1) previewIndex = overTarget.placement === 'after' ? idx + 1 : idx;
  }

  useLayoutEffect(() => {
    const newRects = new Map();
    nodeRefs.current.forEach((el, id) => { if (el) newRects.set(id, el.getBoundingClientRect()); });

    // Drag yeni başladıysa (scroll sonrası stale pozisyonlar var) → animasyon yapma, sadece güncelle
    const dragJustStarted = draggedId && !prevDraggedId.current;
    prevDraggedId.current = draggedId;

    if (!dragJustStarted) {
      nodeRefs.current.forEach((el, id) => {
        if (!el) return;
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
          data-drop-gap="true"
          style={{ height: cardSize.height || 64, transition: 'height 220ms cubic-bezier(0.2,0,0,1)' }}
        />
      );
    }
    const book = books.find(b => b.id === id);
    if (!book) return null;
    return (
      <div key={id} ref={el => { if (el) nodeRefs.current.set(id, el); else nodeRefs.current.delete(id); }}>
        <BookCard book={book} onOpen={onOpen} showIndicator={showIndicator} isLibraryView={isLibraryView} containerFolderId={folderKey} />
      </div>
    );
  });
};
