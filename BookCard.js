const { useLayoutEffect } = React;

// ── GLOBAL: Tek bir touchmove blocker, tüm kartlar için ──
// Bu listener bileşenlerden ÖNCE ekleniyor, capture + stopImmediatePropagation
// ile tarayıcının scroll kararını tamamen engelliyor.
let _isDragActive = false;
document.addEventListener('touchmove', (e) => {
  if (_isDragActive) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, { passive: false, capture: true });

document.addEventListener('touchstart', (e) => {
  // touchstart sırasında da bilgi verelim (bazı tarayıcılar buna bakar)
}, { passive: true, capture: true });

const BookCard = React.memo(({ book, onOpen, showIndicator = false, folderPath = null, onNavigate = null, containerFolderId = null }) => {
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
  const velocityHistory = useRef([]);   // son 80ms parmak hareketleri
  const momentumRAF = useRef(null);     // momentum animasyonu

  const clearPressTimer = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };

  const stopMomentum = () => {
    if (momentumRAF.current) { cancelAnimationFrame(momentumRAF.current); momentumRAF.current = null; }
  };

  // ── Scroll container bulma ──
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

  // ── Auto-scroll: drag sırasında kenar yakınında otomatik kaydırma ──
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
    }
  };

  const runAutoScroll = (clientY) => {
    doAutoScroll(clientY);
    autoScrollRAF.current = requestAnimationFrame(() => runAutoScroll(clientY));
  };

  const stopAutoScroll = () => {
    if (autoScrollRAF.current) {
      cancelAnimationFrame(autoScrollRAF.current);
      autoScrollRAF.current = null;
    }
  };

  // ── Pointer hareketleri ──
  const handlePointerMove = (e) => {
    // ── DRAG AKTİF: kartı hareket ettir ──
    if (draggingRef.current) {
      e.preventDefault();
      updateDrag(e.clientX, e.clientY);
      stopAutoScroll();
      runAutoScroll(e.clientY);
      return;
    }

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const dist = Math.hypot(dx, dy);
    const elapsed = Date.now() - startTime.current;
    const velocity = elapsed > 0 ? dist / elapsed : 0;

    // ── SCROLL ALGILA: hızlı veya büyük hareket → kullanıcı kaydırmak istiyor ──
    if (!movedRef.current && (dist > 30 || (dist > 15 && velocity > 0.15))) {
      movedRef.current = true;
      clearPressTimer();
    }

    // ── MANUEL SCROLL: native scroll CSS ile kapalı, biz yapıyoruz ──
    if (movedRef.current) {
      const deltaY = e.clientY - lastPos.current.y;
      const sc = getScrollContainer();
      sc.scrollTop -= deltaY;

      // Momentum için hız geçmişi kaydet (son 80ms)
      const now = Date.now();
      velocityHistory.current.push({ y: e.clientY, t: now });
      while (velocityHistory.current.length > 0 && now - velocityHistory.current[0].t > 80) {
        velocityHistory.current.shift();
      }
    }

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  // ── Temizlik ──
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

    // ── MOMENTUM SCROLL: parmak bırakıldığında hıza göre kaymaya devam et ──
    if (wasScrolling) {
      const history = velocityHistory.current;
      if (history.length >= 2) {
        const first = history[0];
        const last = history[history.length - 1];
        const dt = last.t - first.t;
        if (dt > 0) {
          let vel = -(last.y - first.y) / dt; // px/ms (ters yön: parmak aşağı = scrollTop artar)
          vel *= 16; // px/frame (≈16ms)
          const sc = getScrollContainer();
          const FRICTION = 0.94;
          const MIN_VEL = 0.3;

          const momentumTick = () => {
            vel *= FRICTION;
            if (Math.abs(vel) < MIN_VEL) { momentumRAF.current = null; return; }
            sc.scrollTop += vel;
            // Sınır kontrolü
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

  // ── Dokunma başlangıcı ──
  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Scroll container cache'ini temizle — DOM değişmişse eski referansı kullanma
    scrollContainerRef.current = null;
    // Devam eden momentum'u durdur
    stopMomentum();
    velocityHistory.current = [];
    startPos.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };
    startTime.current = Date.now();
    movedRef.current = false;
    draggingRef.current = false;
    pointerIdRef.current = e.pointerId;

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    // Drag sadece containerFolderId varsa başlar, ama manuel scroll her zaman çalışır
    if (!containerFolderId) return;
    const pointerId = e.pointerId;
    pressTimer.current = setTimeout(() => {
      if (!movedRef.current && cardRef.current) {
        draggingRef.current = true;
        _isDragActive = true;
        try { cardRef.current.setPointerCapture(pointerId); } catch(err) {}
        const rect = cardRef.current.getBoundingClientRect();
        startDrag(book, rect, e.clientX, e.clientY);
      }
    }, 300);
  };

  const handleClick = () => {
    if (movedRef.current || draggingRef.current) return;
    if (onOpen) onOpen(book.id);
  };

  const isBeingDragged = draggedId === book.id;

  return (
    <div
      id={`book-node-${book.id}`}
      ref={cardRef}
      data-book-target={book.id}
      data-book-target-folder={containerFolderId || 'root'}
      className={`group flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-xl shadow-sm hover:border-zinc-300 ml-2 sm:ml-4 cursor-pointer transition-colors my-1.5 select-none ${isBeingDragged ? 'opacity-0' : ''}`}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div className="flex-1 flex items-center gap-3 overflow-hidden">
        <div className="bg-zinc-50 rounded-lg text-zinc-400 border border-zinc-100 shrink-0 overflow-hidden w-8 h-11 flex items-center justify-center">
          {book.cover ? (
            <img src={book.cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={16} />
          )}
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
