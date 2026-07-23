const { useState, useEffect } = window.React;
const { Mail, Lock, LogIn, UserPlus } = window.LucideReact;

const AuthModal = ({ isVisible }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isVisible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await window.firebaseAuth.signInWithEmailAndPassword(email, password);
      } else {
        await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-posta veya şifre hatalı.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanımda.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre çok zayıf (en az 6 karakter olmalı).');
      } else {
        setError('Bir hata oluştu: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      await window.firebaseAuth.signInWithPopup(provider);
    } catch (err) {
      console.error(err);
      setError('Google ile giriş başarısız oldu.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="text-center mb-8 mt-2">
          <h2 className="text-2xl font-bold text-zinc-900">{isLogin ? 'Hoş Geldiniz' : 'Hesap Oluşturun'}</h2>
          <p className="text-zinc-500 text-sm mt-1">
            {isLogin ? 'Kitaplığınıza erişmek için giriş yapın' : 'Bulut kütüphanenizi hemen oluşturun'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-zinc-400" size={18} />
            <input 
              type="email" 
              placeholder="E-posta adresi" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50"
              required
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-zinc-400" size={18} />
            <input 
              type="password" 
              placeholder="Şifre (en az 6 karakter)" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors font-medium flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isLogin ? (
              <><LogIn size={18} /> Giriş Yap</>
            ) : (
              <><UserPlus size={18} /> Kayıt Ol</>
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute border-t border-zinc-200 w-full"></div>
          <span className="bg-white px-3 text-xs text-zinc-400 relative z-10 font-medium">VEYA</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors font-medium flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            <path fill="none" d="M1 1h22v22H1z"/>
          </svg>
          Google ile Devam Et
        </button>

        <p className="text-center text-sm text-zinc-500 mt-6">
          {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="ml-1 text-blue-600 font-medium hover:underline focus:outline-none"
          >
            {isLogin ? 'Kayıt Olun' : 'Giriş Yapın'}
          </button>
        </p>
      </div>
    </div>
  );
};
window.AuthModal = AuthModal;
