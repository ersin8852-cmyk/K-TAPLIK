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
const GripVertical = pickIcon('GripVertical');
const Trash2 = pickIcon('Trash2');
const AlertCircle = pickIcon('AlertCircle');
const WifiOff = pickIcon('WifiOff');
const Folder = pickIcon('Folder');
const Download = pickIcon('Download');
const Upload = pickIcon('Upload');
const CornerDownRight = pickIcon('CornerDownRight');
const Settings = pickIcon('Settings');
const LogOut = pickIcon('LogOut');
const User = pickIcon('User');
const Mail = pickIcon('Mail');
const Lock = pickIcon('Lock');
const LogIn = pickIcon('LogIn');
const UserPlus = pickIcon('UserPlus');
const Calendar = pickIcon('Calendar');
const CheckSquare = pickIcon('CheckSquare');
const Square = pickIcon('Square');
const ArrowLeft = pickIcon('ArrowLeft');

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
  profile: {
    fullName: '',
    username: '',
    gender: '',
    dob: ''
  }
};

const processImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Lütfen geçerli bir resim dosyası seçin.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG with 0.8 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Resim yüklenemedi.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
};

const ArchiveContext = createContext();
const useArchive = () => useContext(ArchiveContext);

const ArchiveProvider = ({ children }) => {
  const [data, setData] = useState(initialState);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  
  const showToast = (msg, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ msg, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const unsubscribe = window.firebaseAuth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = window.firebaseDb.collection('users').doc(currentUser.uid);
        const unsubscribeDb = docRef.onSnapshot(doc => {
          if (doc.exists) {
            setData({ ...initialState, ...doc.data() });
          } else {
            setData(initialState);
            docRef.set(initialState);
          }
          setLoadingAuth(false);
        });
        return () => unsubscribeDb();
      } else {
        setData(initialState);
        setLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateData = (updater) => {
    setData(prev => {
      const newData = typeof updater === 'function' ? updater(prev) : updater;
      if (user) {
        window.firebaseDb.collection('users').doc(user.uid).set(newData).catch(err => {
          console.error(err);
          showToast('Veri buluta kaydedilemedi!', 'error');
        });
      }
      return newData;
    });
  };

  const addFolder = (name, parentId = null, color = '#71717a') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const siblings = data.folders.filter(f => f.parentId === parentId);
    const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
    const newFolder = { id: generateId(), name: trimmed, parentId, order, color };
    updateData(prev => ({ ...prev, folders: [...prev.folders, newFolder] }));
  };

  const updateFolder = (id, name, color) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateData(prev => ({
      ...prev,
      folders: prev.folders.map(f => f.id === id ? { ...f, name: trimmed, color } : f)
    }));
  };

  const deleteFolder = (id) => {
    updateData(prev => {
      const updatedBooks = prev.books.map(b => b.folderId === id ? { ...b, folderId: null } : b);
      const updatedFolders = prev.folders
        .filter(f => f.id !== id)
        .map(f => f.parentId === id ? { ...f, parentId: null } : f);
      return { ...prev, books: updatedBooks, folders: updatedFolders };
    });
    showToast('Klasör silindi, içerikler ana dizine taşındı.');
  };

  const reorderFolder = (id, direction) => {
    updateData(prev => {
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
    updateData(prev => ({ ...prev, books: [...prev.books, newBook] }));
    showToast('Kitap başarıyla eklendi.');
    return true;
  };

  const updateBook = (id, updates) => {
    updateData(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  };

  const deleteBook = (id) => {
    updateData(prev => ({ ...prev, books: prev.books.filter(b => b.id !== id) }));
    showToast('Kitap silindi.');
  };

  const moveItemToPosition = (itemId, itemType, targetFolderId, anchorId = null, placement = 'end') => {
    updateData(prev => {
      const item = itemType === 'folder' 
        ? prev.folders.find(f => f.id === itemId)
        : prev.books.find(b => b.id === itemId);
        
      if (!item) return prev;

      const siblings = [
        ...prev.folders
          .filter(f => f.parentId === targetFolderId && !(itemType === 'folder' && f.id === itemId))
          .map(f => ({ ...f, _type: 'folder' })),
        ...prev.books
          .filter(b => b.folderId === targetFolderId && !(itemType === 'book' && b.id === itemId))
          .map(b => ({ ...b, _type: 'book' }))
      ].sort((a, b) => a.order - b.order);

      let insertIndex = siblings.length;
      if (anchorId) {
        const idx = siblings.findIndex(s => s.id === anchorId);
        if (idx !== -1) insertIndex = placement === 'after' ? idx + 1 : idx;
      }

      const updatedItem = itemType === 'folder' 
        ? { ...item, parentId: targetFolderId, _type: 'folder' }
        : { ...item, folderId: targetFolderId, _type: 'book' };

      siblings.splice(insertIndex, 0, updatedItem);

      const reorderedFolders = new Map();
      const reorderedBooks = new Map();
      
      siblings.forEach((s, i) => {
        if (s._type === 'folder') reorderedFolders.set(s.id, { ...s, order: i });
        if (s._type === 'book') reorderedBooks.set(s.id, { ...s, order: i });
      });

      return {
        ...prev,
        folders: prev.folders.map(f => {
          if (reorderedFolders.has(f.id)) {
            const newF = { ...reorderedFolders.get(f.id) };
            delete newF._type;
            return newF;
          }
          return f;
        }),
        books: prev.books.map(b => {
          if (reorderedBooks.has(b.id)) {
            const newB = { ...reorderedBooks.get(b.id) };
            delete newB._type;
            return newB;
          }
          return b;
        })
      };
    });
  };

  const importData = (importedData) => {
    if (!importedData || !Array.isArray(importedData.books) || !Array.isArray(importedData.folders)) {
      showToast('Geçersiz yedekleme dosyası formatı!', 'error');
      return false;
    }
    updateData(importedData);
    showToast('Veriler başarıyla cihaza yüklendi!');
    return true;
  };

  const updateProfileData = (profileUpdates) => {
    updateData(prev => ({
      ...prev,
      profile: { ...(prev.profile || initialState.profile), ...profileUpdates }
    }));
  };

  return (
    <ArchiveContext.Provider value={{
      user, loadingAuth,
      books: data.books, folders: data.folders, profile: data.profile || initialState.profile,
      addFolder, updateFolder, deleteFolder, reorderFolder,
      addBook, updateBook, deleteBook, moveItemToPosition,
      importData, updateProfileData,
      showToast, processImageFile
    }}>
      {children}
      {toast && window.ReactDOM.createPortal(
        <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-[9999] text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'}`}>
          {toast.type === 'error' && <AlertCircle size={14} />}
          {toast.msg}
        </div>,
        document.body
      )}
    </ArchiveContext.Provider>
  );
};


