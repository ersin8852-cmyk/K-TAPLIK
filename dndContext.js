const DragApiContext = createContext(null);
const DraggedItemContext = createContext(null);
const OverTargetContext = createContext(null);

const useDragApi = () => useContext(DragApiContext);
const useDraggedItem = () => useContext(DraggedItemContext);
const useOverTarget = () => useContext(OverTargetContext);

const AUTOSCROLL_EDGE = 70;
const AUTOSCROLL_MAX_SPEED = 14;
const HIT_TEST_INTERVAL = 80;
const STABLE_THRESHOLD = 2;

let _isDragActive = false;
document.addEventListener('touchmove', (e) => {
  if (_isDragActive) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, { passive: false, capture: true });

document.addEventListener('touchstart', (e) => {}, { passive: true, capture: true });

const useDraggableItem = (item, containerFolderId, onClick, itemType) => {
  const { startDrag, updateDrag, endDrag, cancelDrag } = useDragApi();
  const { draggedId } = useDraggedItem();
  const cardRef = useRef(null);
  const pressTimer = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const autoScrollRAF = useRef(null);
  const velocityHistory = useRef([]);
  const momentumRAF = useRef(null);

  const clearPressTimer = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };

  const stopMomentum = () => {
    if (momentumRAF.current) { cancelAnimationFrame(momentumRAF.current); momentumRAF.current = null; }
  };

  const getScrollContainer = () => {
    if (scrollContainerRef.current) return scrollContainerRef.current;
    let el = cardRef.current;
    while (el) {
      const style = window.getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
        scrollContainerRef.current = el;
        return el;
      }
      el = el.parentElement;
    }
    return document.documentElement;
  };

  const EDGE_ZONE = 60;
  const MAX_SCROLL_SPEED = 8;

  const doAutoScroll = (clientY) => {
    const sc = getScrollContainer();
    const rect = sc.getBoundingClientRect();
    const topDist = clientY - rect.top;
    const bottomDist = rect.bottom - clientY;
    let speed = 0;
    if (topDist < EDGE_ZONE && sc.scrollTop > 0) {
      speed = -MAX_SCROLL_SPEED * (1 - topDist / EDGE_ZONE);
    } else if (bottomDist < EDGE_ZONE && sc.scrollTop < sc.scrollHeight - sc.clientHeight) {
      speed = MAX_SCROLL_SPEED * (1 - bottomDist / EDGE_ZONE);
    }
    if (Math.abs(speed) > 0.5) {
      sc.scrollTop += speed;
      return speed;
    }
    return 0;
  };

  const autoScrollTarget = useRef({ x: 0, y: 0 });

  const runAutoScroll = () => {
    const { x: clientX, y: clientY } = autoScrollTarget.current;
    if (draggingRef.current) {
      const speed = doAutoScroll(clientY);
      if (speed !== 0) {
        updateDrag(clientX, clientY);
      }
    }
    autoScrollRAF.current = requestAnimationFrame(runAutoScroll);
  };

  const startAutoScroll = () => {
    if (!autoScrollRAF.current) {
      autoScrollRAF.current = requestAnimationFrame(runAutoScroll);
    }
  };

  const stopAutoScroll = () => {
    if (autoScrollRAF.current) {
      cancelAnimationFrame(autoScrollRAF.current);
      autoScrollRAF.current = null;
    }
  };

  const handlePointerMove = (e) => {
    if (draggingRef.current) {
      e.preventDefault();
      updateDrag(e.clientX, e.clientY);
      autoScrollTarget.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const dist = Math.hypot(dx, dy);
    const elapsed = Date.now() - startTime.current;
    const velocity = elapsed > 0 ? dist / elapsed : 0;

    if (!movedRef.current && (dist > 30 || (dist > 15 && velocity > 0.15))) {
      movedRef.current = true;
      clearPressTimer();
    }

    if (movedRef.current) {
      const deltaY = e.clientY - lastPos.current.y;
      const sc = getScrollContainer();
      sc.scrollTop -= deltaY;

      const now = Date.now();
      velocityHistory.current.push({ y: e.clientY, t: now });
      while (velocityHistory.current.length > 0 && now - velocityHistory.current[0].t > 80) {
        velocityHistory.current.shift();
      }
    }

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const stopTracking = () => {
    _isDragActive = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerCancel);
    stopAutoScroll();
    if (cardRef.current && pointerIdRef.current !== null) {
      try { cardRef.current.releasePointerCapture(pointerIdRef.current); } catch(e) {}
    }
    pointerIdRef.current = null;
  };

  const handlePointerUp = () => {
    clearPressTimer();
    const wasDragging = draggingRef.current;
    const wasScrolling = movedRef.current;
    draggingRef.current = false;
    stopTracking();
    if (wasDragging) { endDrag(); return; }

    if (wasScrolling) {
      const history = velocityHistory.current;
      if (history.length >= 2) {
        const first = history[0];
        const last = history[history.length - 1];
        const dt = last.t - first.t;
        if (dt > 0) {
          let vel = -(last.y - first.y) / dt;
          vel *= 16;
          const sc = getScrollContainer();
          const FRICTION = 0.94;
          const MIN_VEL = 0.3;

          const momentumTick = () => {
            vel *= FRICTION;
            if (Math.abs(vel) < MIN_VEL) { momentumRAF.current = null; return; }
            sc.scrollTop += vel;
            if (sc.scrollTop <= 0 || sc.scrollTop >= sc.scrollHeight - sc.clientHeight) {
              momentumRAF.current = null; return;
            }
            momentumRAF.current = requestAnimationFrame(momentumTick);
          };

          stopMomentum();
          momentumRAF.current = requestAnimationFrame(momentumTick);
        }
      }
      velocityHistory.current = [];
    }
  };

  const handlePointerCancel = () => {
    clearPressTimer();
    const wasDragging = draggingRef.current;
    draggingRef.current = false;
    stopTracking();
    if (wasDragging) cancelDrag();
    velocityHistory.current = [];
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    scrollContainerRef.current = null;
    stopMomentum();
    velocityHistory.current = [];
    startPos.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };
    startTime.current = Date.now();
    movedRef.current = false;
    draggingRef.current = false;
    pointerIdRef.current = e.pointerId;

    autoScrollTarget.current = { x: e.clientX, y: e.clientY };
    startAutoScroll();

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    if (!containerFolderId) return;
    const pointerId = e.pointerId;
    pressTimer.current = setTimeout(() => {
      if (!movedRef.current && cardRef.current) {
        draggingRef.current = true;
        _isDragActive = true;
        try { cardRef.current.setPointerCapture(pointerId); } catch(err) {}
        const rect = cardRef.current.getBoundingClientRect();
        startDrag(item, rect, e.clientX, e.clientY, itemType);
      }
    }, 300);
  };

  const handleClick = () => {
    if (movedRef.current || draggingRef.current) return;
    if (onClick) onClick(item);
  };

  const isBeingDragged = draggedId === item.id;

  return { cardRef, handlePointerDown, handleClick, isBeingDragged };
};

const DragDropProvider = ({ children, onDrop }) => {
  const { books, folders } = useArchive();
  const [draggedId, setDraggedId] = useState(null);
  const [overTarget, setOverTarget] = useState(null);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });

  const ghostRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const draggedIdRef = useRef(null);
  const draggedTypeRef = useRef(null);
  const overTargetRef = useRef(null);
  const lastHitTestTime = useRef(0);
  const pendingTarget = useRef(null);
  const pendingCount = useRef(0);

  const targetsEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.type === b.type && a.id === b.id && a.placement === b.placement;
  };

  const runHitTest = (x, y) => {
    const now = performance.now();
    if (now - lastHitTestTime.current < HIT_TEST_INTERVAL) return;
    lastHitTestTime.current = now;

    if (ghostRef.current) ghostRef.current.style.visibility = 'hidden';
    const elements = document.elementsFromPoint(x, y);
    if (ghostRef.current) ghostRef.current.style.visibility = 'visible';
    
    if (elements.some(el => el.hasAttribute('data-drop-gap'))) return;

    const dropInsideEl = elements.find(el => el.hasAttribute('data-drop-inside') && el.dataset.dropInside !== draggedIdRef.current);
    const itemEl = elements.find(el => el.hasAttribute('data-item-target'));
    const breadcrumbEl = elements.find(el => el.hasAttribute('data-breadcrumb-target'));
    const rootEl = elements.find(el => el.hasAttribute('data-folder-target'));

    let next = null;

    if (dropInsideEl) {
      next = { type: 'folder', id: dropInsideEl.dataset.dropInside, placement: 'inside' };
    } else if (itemEl) {
      if (itemEl.dataset.itemTarget === draggedIdRef.current) {
        next = null;
      } else {
        const rect = itemEl.getBoundingClientRect();
        const ratio = (y - rect.top) / rect.height;
        const isFolder = itemEl.dataset.itemType === 'folder';
        const currentPlacement = overTargetRef.current && overTargetRef.current.id === itemEl.dataset.itemTarget
          ? overTargetRef.current.placement : null;
        let placement;

        if (isFolder) {
          if (currentPlacement === 'before') {
            if (ratio > 0.75) placement = 'after';
            else if (ratio >= 0.35) placement = 'inside';
            else placement = 'before';
          } else if (currentPlacement === 'after') {
            if (ratio < 0.25) placement = 'before';
            else if (ratio <= 0.65) placement = 'inside';
            else placement = 'after';
          } else if (currentPlacement === 'inside') {
            if (ratio < 0.2) placement = 'before';
            else if (ratio > 0.8) placement = 'after';
            else placement = 'inside';
          } else {
            if (ratio < 0.25) placement = 'before';
            else if (ratio > 0.75) placement = 'after';
            else placement = 'inside';
          }
        } else {
          if (currentPlacement === 'before') {
            placement = ratio > 0.65 ? 'after' : 'before';
          } else if (currentPlacement === 'after') {
            placement = ratio < 0.35 ? 'before' : 'after';
          } else {
            placement = ratio < 0.5 ? 'before' : 'after';
          }
        }
        
        next = { 
          type: itemEl.dataset.itemType, 
          id: itemEl.dataset.itemTarget, 
          folderId: itemEl.dataset.itemFolder, 
          placement 
        };
      }
    } else if (breadcrumbEl) {
      next = { type: 'folder', id: breadcrumbEl.dataset.breadcrumbTarget, placement: 'inside', source: 'breadcrumb' };
    } else if (rootEl) {
      next = { type: 'folder', id: rootEl.dataset.folderTarget, placement: 'inside' };
    }

    if (!next) {
      if (overTargetRef.current !== null) {
        if (targetsEqual(pendingTarget.current, null)) {
          pendingCount.current++;
        } else {
          pendingTarget.current = null;
          pendingCount.current = 1;
        }
        if (pendingCount.current >= STABLE_THRESHOLD) {
          overTargetRef.current = null;
          setOverTarget(null);
          pendingTarget.current = null;
          pendingCount.current = 0;
        }
      }
      return;
    }

    if (targetsEqual(overTargetRef.current, next)) {
      pendingTarget.current = null;
      pendingCount.current = 0;
      return;
    }

    if (targetsEqual(pendingTarget.current, next)) {
      pendingCount.current++;
    } else {
      pendingTarget.current = next;
      pendingCount.current = 1;
    }

    if (pendingCount.current >= STABLE_THRESHOLD) {
      overTargetRef.current = next;
      setOverTarget(next);
      pendingTarget.current = null;
      pendingCount.current = 0;
    }
  };

  const tick = () => {
    const { x, y } = pointerRef.current;
    if (ghostRef.current) {
      ghostRef.current.style.transform = `translate3d(${x - offsetRef.current.x}px, ${y - offsetRef.current.y}px, 0)`;
    }
    const scrollEl = document.querySelector('[data-dnd-scroll]');
    if (scrollEl) {
      const rect = scrollEl.getBoundingClientRect();
      let dy = 0;
      if (y < rect.top + AUTOSCROLL_EDGE) {
        const ratio = 1 - Math.max(0, y - rect.top) / AUTOSCROLL_EDGE;
        dy = -ratio * AUTOSCROLL_MAX_SPEED;
      } else if (y > rect.bottom - AUTOSCROLL_EDGE) {
        const ratio = 1 - Math.max(0, rect.bottom - y) / AUTOSCROLL_EDGE;
        dy = ratio * AUTOSCROLL_MAX_SPEED;
      }
      if (dy !== 0) scrollEl.scrollTop += dy;
    }
    runHitTest(x, y);
    rafRef.current = requestAnimationFrame(tick);
  };

  const startDrag = (item, rect, x, y, itemType) => {
    draggedIdRef.current = item.id;
    draggedTypeRef.current = itemType;
    setDraggedId(item.id);
    setCardSize({ width: rect.width, height: rect.height });
    offsetRef.current = { x: x - rect.left, y: y - rect.top };
    pointerRef.current = { x, y };
    overTargetRef.current = null;
    setOverTarget(null);
    lastHitTestTime.current = 0;
    pendingTarget.current = null;
    pendingCount.current = 0;
    document.body.classList.add('dnd-active');
    rafRef.current = requestAnimationFrame(tick);
  };

  const updateDrag = (x, y) => {
    pointerRef.current = { x, y };
  };

  const finishDrag = (commit) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (commit && draggedIdRef.current && overTargetRef.current) {
      const t = overTargetRef.current;
      const itemType = draggedTypeRef.current;

      if (t.placement === 'inside') {
        const targetFolderId = t.id === 'root' ? null : t.id;
        onDrop(draggedIdRef.current, itemType, targetFolderId, null, 'end');
      } else {
        const targetFolderId = t.folderId === 'root' ? null : t.folderId;
        onDrop(draggedIdRef.current, itemType, targetFolderId, t.id, t.placement);
      }
    }
    draggedIdRef.current = null;
    overTargetRef.current = null;
    pendingTarget.current = null;
    pendingCount.current = 0;
    setDraggedId(null);
    setOverTarget(null);
    document.body.classList.remove('dnd-active');
  };

  const endDrag = () => finishDrag(true);
  const cancelDrag = () => finishDrag(false);

  const draggedBook = draggedId ? books.find(b => b.id === draggedId) : null;
  const draggedFolder = !draggedBook && draggedId ? folders.find(f => f.id === draggedId) : null;
  const draggedTitle = draggedBook ? draggedBook.title : (draggedFolder ? draggedFolder.name : '');
  const draggedSubtitle = draggedBook ? (draggedBook.publisher || 'Yayınevi Yok') : (draggedFolder ? 'Liste' : '');

  const apiValue = useMemo(() => ({ startDrag, updateDrag, endDrag, cancelDrag }), []);
  const itemValue = useMemo(() => ({ draggedId, cardSize }), [draggedId, cardSize]);
  const targetValue = useMemo(() => ({ overTarget }), [overTarget]);

  return (
    <DragApiContext.Provider value={apiValue}>
      <DraggedItemContext.Provider value={itemValue}>
        <OverTargetContext.Provider value={targetValue}>
          {children}
          {(draggedBook || draggedFolder) && (
            <div
              ref={ghostRef}
              className="fixed z-[100] top-0 left-0 pointer-events-none"
              style={{ width: cardSize.width, willChange: 'transform' }}
            >
              <div 
                className="bg-white border border-zinc-200 rounded-xl shadow-2xl flex items-center gap-3 p-3 transform transition-transform duration-200 scale-50"
                style={{ transformOrigin: `${offsetRef.current.x}px ${offsetRef.current.y}px` }}
              >
                <div className="bg-zinc-50 rounded-lg text-zinc-400 border border-zinc-100 shrink-0 overflow-hidden w-8 h-11 flex items-center justify-center">
                  {draggedBook && draggedBook.cover ? (
                    <img src={draggedBook.cover} alt="" className="w-full h-full object-cover" />
                  ) : draggedFolder ? (
                    <List size={16} />
                  ) : (
                    <BookOpen size={16} />
                  )}
                </div>
                <div className="truncate flex-1">
                  <h4 className="font-semibold text-zinc-800 text-sm truncate">{draggedTitle}</h4>
                  <p className="text-[11px] text-zinc-500 truncate">{draggedSubtitle}</p>
                </div>
              </div>
            </div>
          )}
        </OverTargetContext.Provider>
      </DraggedItemContext.Provider>
    </DragApiContext.Provider>
  );
};
