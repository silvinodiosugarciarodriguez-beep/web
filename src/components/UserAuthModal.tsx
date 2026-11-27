import React, { useState } from 'react';
import { X, UserPlus, LogIn, Sparkles, MapPin, Phone, Lock, User as UserIcon, CreditCard, ShieldCheck, Smartphone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const UserAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    login,
    activateLegacyUserPassword,
    register,
    loginAsDemo,
    setIsUserDashboardOpen,
    setDashboardInitialTab,
    authModalMode,
    setAuthModalMode,
    storeSettings,
    setShowWelcomeScreen,
    showToast,
  } = useStore();

  const mode = authModalMode;
  const setMode = (nextMode: 'login' | 'register') => {
    setAuthError(null);
    setNeedsLegacySetup(false);
    setLegacyPhoneLast4('');
    setAuthModalMode(nextMode);
  };

  // Login fields using Cédula
  const [loginCedula, setLoginCedula] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [needsLegacySetup, setNeedsLegacySetup] = useState(false);
  const [legacyPhoneLast4, setLegacyPhoneLast4] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register fields using Cédula
  const [regName, setRegName] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('Melo');

  if (!isAuthModalOpen) return null;

  const completeUserLogin = (existing: any) => {
    const needsProfile =
      !existing.name?.trim() ||
      existing.name.startsWith('Cliente CI ') ||
      existing.name === 'Cliente OZ' ||
      !existing.phone?.trim() ||
      existing.phone.includes('5555-0000') ||
      !existing.address?.trim() ||
      existing.address === 'Dirección por definir' ||
      existing.address === 'Retiro en local';

    setLoginPassword('');
    setNeedsLegacySetup(false);
    setLegacyPhoneLast4('');
    setShowWelcomeScreen(false);
    setIsAuthModalOpen(false);
    setDashboardInitialTab(needsProfile ? 'perfil' : 'pedidos');
    setIsUserDashboardOpen(true);
    if (needsProfile) {
      showToast('Completá tu nombre, teléfono y dirección para finalizar tu registro.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginCedula.trim()) {
      setAuthError('Ingresá tu número de Cédula.');
      return;
    }
    if (!loginPassword) {
      setAuthError('Ingresá tu contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (needsLegacySetup) {
        if (loginPassword.length < 4) {
          setAuthError('La contraseña debe tener al menos 4 caracteres.');
          return;
        }
        const res = await activateLegacyUserPassword(loginCedula, legacyPhoneLast4, loginPassword);
        if (!res.ok || !res.user) {
          setAuthError(res.error || 'No se pudo activar la contraseña.');
          return;
        }
        completeUserLogin(res.user);
        return;
      }

      const result = await login(loginCedula, loginPassword);
      if (!result.ok || !result.user) {
        if (result.needsPasswordSetup) {
          setNeedsLegacySetup(true);
        }
        setAuthError(result.error || 'Cédula o contraseña incorrecta.');
        return;
      }

      completeUserLogin(result.user);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (
      !regName.trim() ||
      !regCedula.trim() ||
      !regPhone.trim() ||
      !regAddress.trim() ||
      !regCity.trim() ||
      !regPassword.trim()
    ) {
      const msg = 'Por favor completá todos los campos obligatorios (*), incluyendo tu dirección y contraseña.';
      setAuthError(msg);
      showToast(msg);
      return;
    }
    if (regPassword.length < 4) {
      const msg = 'La contraseña debe tener al menos 4 caracteres.';
      setAuthError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        name: regName.trim(),
        cedula: regCedula.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        address: regAddress.trim(),
        city: regCity.trim() || 'Melo',
      });

      if (!result.user) {
        setAuthError(result.error || 'No se pudo crear la cuenta.');
        return;
      }

      setRegPassword('');
      setShowWelcomeScreen(false);
      setIsAuthModalOpen(false);
      setDashboardInitialTab('pedidos');
      setIsUserDashboardOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = () => {
    setAuthError(null);
    loginAsDemo();
    setShowWelcomeScreen(false);
    setIsAuthModalOpen(false);
    setDashboardInitialTab('pedidos');
    setIsUserDashboardOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200 text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with official logo and mode-specific badge */}
        <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between gap-2 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-white">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-amber-500 rounded-full blur-xs opacity-75" />
              <img
                src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
                alt="Pizzería OZ Logo Oficial"
                className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black border border-amber-400 p-0.5 object-contain shrink-0 shadow-md"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-serif font-bold text-white leading-tight truncate">
                  {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </h2>
                <span
                  className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                    mode === 'login'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {mode === 'login' ? 'Ya soy cliente' : 'Nuevo Registro'}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-stone-300 mt-0.5 truncate sm:whitespace-normal">
                {mode === 'login'
                  ? 'Ingresá tu Cédula para acceder a tus pedidos'
                  : 'Registrate para hacer pedidos a domicilio o retiro'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-stone-100 m-3 sm:m-5 mb-3 rounded-xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 sm:py-2.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-stone-950 shadow-sm border border-stone-200/80 font-extrabold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 sm:py-2.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-stone-950 shadow-sm border border-stone-200/80 font-extrabold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Crear Cuenta</span>
          </button>
        </div>

        {/* FORM 1: LOGIN (SOLO CÉDULA Y CONTRASEÑA) */}
        {mode === 'login' && (
          <div className="p-4 sm:p-6 pt-1 space-y-4">
            {/* Quick Demo Access Button (Only for login) */}
            <button
              type="button"
              onClick={handleDemoAccess}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Acceso rápido con Cédula Demo</span>
            </button>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>Número de Cédula de Identidad (CI) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={loginCedula}
                  onChange={(e) => setLoginCedula(e.target.value)}
                  placeholder="Ej: 4.812.394-5"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Contraseña *</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Ingresá tu contraseña"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                    aria-label={showLoginPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {needsLegacySetup && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="text-xs font-bold text-amber-950">
                    Activá la contraseña de tu cuenta existente
                  </div>
                  <p className="text-[11px] text-amber-900">
                    Ingresá los <strong>últimos 4 dígitos de tu celular</strong> registrado para guardar la contraseña que escribiste arriba y entrar:
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={legacyPhoneLast4}
                    onChange={(e) => setLegacyPhoneLast4(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Ej: 3456"
                    className="w-full px-3 py-2 text-sm bg-white border border-amber-400 rounded-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-stone-950 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Verificando...'
                    : needsLegacySetup
                    ? 'Activar Contraseña y Entrar'
                    : 'Ingresar a mi Cuenta'}
                </span>
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-stone-500">
              ¿No tenés cuenta todavía?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
              >
                Crear cuenta nueva gratis
              </button>
            </div>
          </div>
        )}

        {/* FORM 2: REGISTRO COMPLETO (NOMBRE, CÉDULA, TELÉFONO, DIRECCIÓN, CONTRASEÑA) */}
        {mode === 'register' && (
          <div className="p-4 sm:p-6 pt-1 space-y-3.5">
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Completá tus datos una sola vez para guardar tu dirección y hacer tus pedidos en 1 clic.
              </span>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nombre y Apellido completo *</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ej: Marcelo Silva"
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cédula de Identidad (CI) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regCedula}
                    onChange={(e) => setRegCedula(e.target.value)}
                    placeholder="Ej: 4.812.394-5"
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp / Celular *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Ej: 099 123 456"
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dirección completa (Calle, número y depto) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Ej: Aparicio Saravia 740, Apto 2"
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Barrio / Zona *
                  </label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Melo"
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Crear Contraseña * (4 o más caracteres, puede ser larga)</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Elegí una clave (mínimo 4 caracteres, sin límite máximo)"
                    className="w-full pl-3.5 pr-10 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                    aria-label={showRegPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* App shortcut badge */}
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-900 flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Al registrarte, podés <strong>crear el ícono de la app</strong> en la pantalla de tu celular para entrar directo sin escribir la dirección.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Registrando...' : 'Registrarme y Comenzar a Pedir'}</span>
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-stone-500">
              ¿Ya tenés cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                Iniciar sesión aquí
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
