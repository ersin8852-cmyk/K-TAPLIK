const { ArrowLeft, User, Lock, Mail, Calendar, LogOut, Check, ChevronRight } = window.LucideReact;

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, profile, updateProfileData, showToast } = useArchive();
  
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [dob, setDob] = useState(profile?.dob || '');
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName(profile?.fullName || '');
      setUsername(profile?.username || '');
      setGender(profile?.gender || '');
      setDob(profile?.dob || '');
      setPassword('');
    }
  }, [isOpen, profile]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      if (fullName !== user.displayName) {
        await user.updateProfile({ displayName: fullName });
      }
      
      updateProfileData({ fullName, username, gender, dob });
      showToast('Profil bilgileriniz güncellendi.');
    } catch (err) {
      console.error(err);
      showToast('Profil güncellenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!password || password.length < 6) {
      showToast('Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }
    setLoading(true);
    try {
      await user.updatePassword(password);
      setPassword('');
      showToast('Şifreniz başarıyla değiştirildi.');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        showToast('Güvenlik nedeniyle şifre değiştirmeden önce tekrar giriş yapmalısınız.', 'error');
      } else {
        showToast('Şifre değiştirilemedi: ' + err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await window.firebaseAuth.signOut();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Çıkış yapılamadı!', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col sm:max-w-md sm:mx-auto sm:shadow-2xl">
      <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <span className="font-bold text-lg text-zinc-800">Profilim</span>
        </div>
        <button onClick={handleLogout} className="p-2 -mr-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Çıkış Yap">
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-zinc-50 pb-safe space-y-6">
        
        <div className="flex flex-col items-center pt-2 pb-4">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg shadow-blue-500/30 mb-3">
            {fullName ? fullName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <User size={40}/>)}
          </div>
          <h2 className="text-xl font-bold text-zinc-900">{fullName || 'İsimsiz Kullanıcı'}</h2>
          <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 space-y-4">
          <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2 mb-2">
            <User size={16} className="text-blue-500" /> Kişisel Bilgiler
          </h3>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Ad Soyad</label>
            <input type="text" placeholder="Bilgilerinizi girin" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Kullanıcı Adı</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-sm">@</span>
              <input type="text" placeholder="Bilgilerinizi girin" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Cinsiyet</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none text-zinc-700">
                <option value="" disabled>Bilgilerinizi girin</option>
                <option value="Kadin">Kadın</option>
                <option value="Erkek">Erkek</option>
                <option value="Belirtmek Istemiyorum">Belirtmek İstemiyorum</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 ml-1">Doğum Tarihi</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-zinc-400" size={16} />
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full pl-9 pr-2 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-700" />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="w-full py-3 mt-2 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={16} /> Bilgileri Kaydet</>}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 space-y-4">
          <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2 mb-2">
            <Mail size={16} className="text-zinc-400" /> E-posta Adresi
          </h3>
          <input type="email" value={user.email || ''} readOnly className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm text-zinc-500 cursor-not-allowed" />
          <p className="text-[10px] text-zinc-400 ml-1">E-posta adresi değiştirilemez.</p>
        </div>

        {user.providerData.some(p => p.providerId === 'password') && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 space-y-4 mb-8">
            <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2 mb-2">
              <Lock size={16} className="text-orange-500" /> Şifre Değiştir
            </h3>
            <div>
              <input type="password" placeholder="Yeni şifrenizi girin" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
            </div>
            <button onClick={handlePasswordChange} disabled={loading || !password} className="w-full py-3 bg-white text-orange-600 border border-orange-200 rounded-xl font-medium hover:bg-orange-50 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 text-sm">
              <Lock size={16} /> Şifreyi Güncelle
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

window.ProfileModal = ProfileModal;
