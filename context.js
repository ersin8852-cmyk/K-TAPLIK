const { useState, useEffect, useMemo, useRef, createContext, useContext } = React;
const { createRoot } = ReactDOM;

const FallbackIcon = ({ size = 24, ...props }) => (
  <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
  </svg>
);
function pickIcon(name) {
  const icon = window.LucideReact && window.LucideReact[name];
  if (!icon) console.warn(`Lucide ikonu bulunamadı, yedek gösteriliyor: ${name}`);
  return icon || FallbackIcon;
}
const Library = pickIcon('Library');
const List = pickIcon('List');
const BarChart3 = pickIcon('BarChart3');
const Plus = pickIcon('Plus');
const Search = pickIcon('Search');
const ChevronDown = pickIcon('ChevronDown');
const ChevronRight = pickIcon('ChevronRight');
const ArrowUp = pickIcon('ArrowUp');
const ArrowDown = pickIcon('ArrowDown');
const BookOpen = pickIcon('BookOpen');
const Edit2 = pickIcon('Edit2');
const Check = pickIcon('Check');
const X = pickIcon('X');
const FolderPlus = pickIcon('FolderPlus');
const FileText = pickIcon('FileText');
const MoveRight = pickIcon('MoveRight');
const Camera = pickIcon('Camera');
const Trash2 = pickIcon('Trash2');
const AlertCircle = pickIcon('AlertCircle');
const WifiOff = pickIcon('WifiOff');
const GripVertical = pickIcon('GripVertical');
const Folder = pickIcon('Folder');
const Download = pickIcon('Download');
const Upload = pickIcon('Upload');

const STORAGE_KEY = 'archive_app_data_v3';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalize = (str = '') =>
  str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '');

const initialState = {
  books: [],
  folders: [],
};

const ArchiveContext = createContext();
const useArchive = () => useContext(ArchiveContext);

const ArchiveProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      return localData ? JSON.parse(localData) : initialState;
    } catch (e) {
      return initialState;
    }
  });

  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ msg, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        showToast('Veri kaydedilemedi. Depolama alanı dolu olabilir.', 'error');
      }
    }, 400);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [data]);

  const addFolder = (name, parentId = null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const siblings = data.folders.filter(f => f.parentId === parentId);
    const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
    const newFolder = { id: generateId(), name: trimmed, parentId, order };
    setData(prev => ({ ...prev, folders: [...prev.folders, newFolder] }));
  };

  const deleteFolder = (id) => {
    setData(prev => {
      const updatedBooks = prev.books.map(b => b.folderId === id ? { ...b, folderId: null } : b);
      const updatedFolders = prev.folders
        .filter(f => f.id !== id)
        .map(f => f.parentId === id ? { ...f, parentId: null } : f);
      return { ...prev, books: updatedBooks, folders: updatedFolders };
    });
    showToast('Klasör silindi, içerikler ana dizine taşındı.');
  };

  const reorderFolder = (id, direction) => {
    setData(prev => {
      const folder = prev.folders.find(f => f.id === id);
      if (!folder) return prev;
      const siblings = prev.folders.filter(f => f.parentId === folder.parentId).sort((a, b) => a.order - b.order);
      const index = siblings.findIndex(f => f.id === id);
      if (direction === 'up' && index > 0) {
        const prevSibling = siblings[index - 1];
        const newFolders = prev.folders.map(f => {
          if (f.id === id) return { ...f, order: prevSibling.order };
          if (f.id === prevSibling.id) return { ...f, order: folder.order };
          return f;
        });
        return { ...prev, folders: newFolders };
      }
      if (direction === 'down' && index < siblings.length - 1) {
        const nextSibling = siblings[index + 1];
        const newFolders = prev.folders.map(f => {
          if (f.id === id) return { ...f, order: nextSibling.order };
          if (f.id === nextSibling.id) return { ...f, order: folder.order };
          return f;
        });
        return { ...prev, folders: newFolders };
      }
      return prev;
    });
  };

  const addBook = (bookData, folderId = null) => {
    if (!bookData.title || !bookData.title.trim()) {
      showToast('Kitap başlığı boş olamaz.', 'error');
      return false;
    }
    const isDuplicate = data.books.some(b => {
      if (bookData.isbn && b.isbn && b.isbn === bookData.isbn) return true;
      return normalize(b.title) === normalize(bookData.title) &&
             normalize(b.author) === normalize(bookData.author);
    });
    if (isDuplicate) {
      showToast('Bu kitap zaten arşivinizde mevcut!', 'error');
      return false;
    }
    const siblings = data.books.filter(b => b.folderId === folderId);
    const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
    const newBook = {
      ...bookData,
      id: generateId(),
      folderId,
      order,
      inLibrary: false,
      isRead: false,
    };
    setData(prev => ({ ...prev, books: [...prev.books, newBook] }));
    showToast('Kitap başarıyla eklendi.');
    return true;
  };

  const updateBook = (id, updates) => {
    setData(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  };

  const deleteBook = (id) => {
    setData(prev => ({ ...prev, books: prev.books.filter(b => b.id !== id) }));
    showToast('Kitap silindi.');
  };

  const moveBookToPosition = (bookId, targetFolderId, anchorId = null, placement = 'end') => {
    setData(prev => {
      const book = prev.books.find(b => b.id === bookId);
      if (!book) return prev;
      const siblings = prev.books
        .filter(b => b.folderId === targetFolderId && b.id !== bookId)
        .sort((a, b) => a.order - b.order);
      let insertIndex = siblings.length;
      if (anchorId) {
        const idx = siblings.findIndex(b => b.id === anchorId);
        if (idx !== -1) insertIndex = placement === 'after' ? idx + 1 : idx;
      }
      siblings.splice(insertIndex, 0, { ...book, folderId: targetFolderId });
      const reordered = siblings.map((b, i) => ({ ...b, order: i }));
      const reorderedMap = new Map(reordered.map(b => [b.id, b]));
      return {
        ...prev,
        books: prev.books.map(b => reorderedMap.has(b.id) ? reorderedMap.get(b.id) : b)
      };
    });
  };

  const importData = (importedData) => {
    if (!importedData || !Array.isArray(importedData.books) || !Array.isArray(importedData.folders)) {
      showToast('Geçersiz yedekleme dosyası formatı!', 'error');
      return false;
    }
    setData(importedData);
    showToast('Veriler başarıyla cihaza yüklendi!');
    return true;
  };

  return (
    <ArchiveContext.Provider value={{
      books: data.books, folders: data.folders,
      addFolder, deleteFolder, reorderFolder,
      addBook, updateBook, deleteBook, moveBookToPosition,
      importData,
      showToast
    }}>
      {children}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-50 text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'}`}>
          {toast.type === 'error' && <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}
    </ArchiveContext.Provider>
  );
};

const DragContext = createContext(null);
const useDragDrop = () => useContext(DragContext);

const DragDropProvider = ({ children, onDrop }) => {
  const { books } = useArchive();
  const [draggedId, setDraggedId] = useState(null);
  const [overTarget, setOverTarget] = useState(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });

  const startDrag = (bookId, e) => {
    setDraggedId(bookId);
    setGhostPos({ x: e.clientX, y: e.clientY });
    setOverTarget(null);
    document.body.classList.add('dnd-active');
  };

  const updateDrag = (e) => {
    setGhostPos({ x: e.clientX, y: e.clientY });
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const rowEl = el && el.closest('[data-folder-target], [data-book-target]');
    if (!rowEl) { setOverTarget(null); return; }
    if (rowEl.dataset.bookTarget) {
      if (rowEl.dataset.bookTarget === draggedId) { setOverTarget(null); return; }
      const rect = rowEl.getBoundingClientRect();
      const placement = (e.clientY - rect.top) < rect.height / 2 ? 'before' : 'after';
      setOverTarget({ type: 'book', id: rowEl.dataset.bookTarget, folderId: rowEl.dataset.bookTargetFolder, placement });
    } else if (rowEl.dataset.folderTarget) {
      setOverTarget({ type: 'folder', id: rowEl.dataset.folderTarget });
    }
  };

  const endDrag = () => {
    if (draggedId && overTarget) {
      if (overTarget.type === 'folder') {
        const targetFolderId = overTarget.id === 'root' ? null : overTarget.id;
        onDrop(draggedId, targetFolderId, null, 'end');
      } else {
        const targetFolderId = overTarget.folderId === 'root' ? null : overTarget.folderId;
        onDrop(draggedId, targetFolderId, overTarget.id, overTarget.placement);
      }
    }
    setDraggedId(null);
    setOverTarget(null);
    document.body.classList.remove('dnd-active');
  };

  const cancelDrag = () => {
    setDraggedId(null);
    setOverTarget(null);
    document.body.classList.remove('dnd-active');
  };

  const draggedBook = draggedId ? books.find(b => b.id === draggedId) : null;

  return (
    <DragContext.Provider value={{ draggedId, overTarget, startDrag, updateDrag, endDrag, cancelDrag }}>
      {children}
      {draggedId && draggedBook && (
        <div
          className="fixed z-[100] pointer-events-none bg-zinc-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-2xl flex items-center gap-2 max-w-[220px]"
          style={{ left: ghostPos.x, top: ghostPos.y, transform: 'translate(-50%, -120%)' }}
        >
          <BookOpen size={12} className="shrink-0" />
          <span className="truncate">{draggedBook.title}</span>
        </div>
      )}
    </DragContext.Provider>
  );
};
