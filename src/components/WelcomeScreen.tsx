import React from 'react';
import {
  LogIn,
  UserPlus,
  ArrowRight,
  Pizza,
  Sparkles,
  Truck,
  MessageCircle,
  FlaskConical,
  ShieldCheck,
  ZoomIn,
  Clock,
  MapPin,
  Flame,
  Lock,
  LogOut,
  Smartphone,
  QrCode,
  Download,
  Check,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const WelcomeScreen: React.FC = () => {
  const {
    storeSettings,
    user,
    setShowWelcomeScreen,
    openAuthModal,
    setIsLogoModalOpen,
    setIsUserDashboardOpen,
    logout,
    logoutAdmin,
    isAdminAuthenticated,
    setIsAdminOpen,
    products,
    setSelectedProduct,
    setSelectedCategory,
    showToast,
  } = useStore();

  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [installedSuccess, setInstalledSuccess] = React.useState(false);

  React.useEffect(() => {
    const handleBeforePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccess(true);
        showToast('¡Ícono de Pizzería OZ creado en tu celular!');
      }
      setDeferredPrompt(null);
    } else {
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIos) {
        showToast('📱 En Safari: Tocá el botón Compartir (cuadrado con flecha) y luego "Agregar a Inicio".');
      } else {
        showToast('📱 En Chrome: Tocá los 3 puntos arriba a la derecha y elegí "Instalar aplicación" o "Agregar a pantalla de inicio".');
      }
    }
  };

  const handleGoToLogin = () => {
    openAuthModal('login');
  };

  const handleGoToRegister = () => {
    openAuthModal('register');
  };

  const handleEnterStore = () => {
    setShowWelcomeScreen(false);
  };

  const handleOrderChivimuzza = () => {
    if (!user) {
      openAuthModal('register');
      return;
    }
    setShowWelcomeScreen(false);
    const chivimuzza =
      products.find((p) => p.id === 'pzg-chivimuzza') ||
      products.find((p) => p.name.toLowerCase().includes('chivimuzza'));
    if (chivimuzza) {
      setSelectedProduct(chivimuzza);
    } else {
      setSelectedCategory('pizzetas_gourmet');
      setTimeout(() => {
        const el = document.getElementById('catalogo');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-black">
      {/* ============================================================== */}
      {/* BACKGROUND: PIZZAS MUY DIFUMINADAS + FONDO DORADO DEL LOGO */}
      {/* ============================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Real pizza photo from user reference with heavy blur and amber tint */}
        <img
          src={
            storeSettings.heroImageUrl ||
            '/assets/aistudio/468615878_10162129815109555_8430383621970597375_n_6aa62de3.jpg'
          }
          alt="Pizzas artesanales de Pizzería OZ de fondo"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('/assets/aistudio/468615878_10162129815109555_8430383621970597375_n_6aa62de3.jpg')) {
              target.src = '/assets/aistudio/468615878_10162129815109555_8430383621970597375_n_6aa62de3.jpg';
            } else {
              target.src = '/assets/images/hero_pizzeria_oz_1792935618107.jpg';
            }
          }}
          className="w-full h-full object-cover scale-110 filter blur-2xl opacity-35 brightness-75 contrast-125"
        />

        {/* Golden ambiance radial overlays inspired by the logo */}
        <div className="absolute inset-0 bg-radial from-amber-500/25 via-amber-900/40 to-stone-950/95 mix-blend-multiply" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] bg-gradient-to-b from-amber-500/30 via-orange-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent" />
        <div className="absolute inset-0 bg-radial from-transparent via-stone-950/40 to-stone-950/90" />
      </div>

      {/* ============================================================== */}
      {/* TOP BAR: HORARIOS & UBICACIÓN RÁPIDA */}
      {/* ============================================================== */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-5 pb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400/90 tracking-widest uppercase">
          <FlaskConical className="w-4 h-4 text-amber-400" />
          <span>El Laboratorio de la Pizza</span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-stone-300">
          <div className="hidden sm:flex items-center gap-1.5 text-stone-400 mr-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{storeSettings.storeHours}</span>
          </div>
          {/* Acceso protegido a Panel Dueño en Portada */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/90 hover:bg-stone-800 text-amber-300 hover:text-white rounded-xl border border-amber-500/40 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            title="Panel de Administración para el Dueño (con contraseña)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Panel Dueño</span>
          </button>
          {user && (
            <button
              onClick={handleEnterStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <span>Ver menú</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN HERO CARD: LOGO GIGANTE, DORADO Y ACCIONES */}
      {/* ============================================================== */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center text-center my-auto">
        {/* Glow halo behind logo */}
        <div className="relative group mb-6">
          <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500 via-amber-300 to-orange-500 rounded-full opacity-60 blur-2xl group-hover:opacity-85 transition-opacity duration-700 animate-pulse" />

          {/* Grand Logo Medallion (Clickable to enlarge) */}
          <button
            onClick={() => setIsLogoModalOpen(true)}
            className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-stone-950 p-2 sm:p-2.5 border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-transform duration-500 group-hover:scale-105 cursor-pointer"
            title="Click para ver el logo completo ampliado"
          >
            <img
              src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
              alt="Logo Oficial Pizzería OZ - 8 Porciones"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('/assets/aistudio/logo2_a9100ce6.png')) {
                  target.src = '/assets/aistudio/logo2_a9100ce6.png';
                } else {
                  target.src = '/assets/aistudio/logo_d58d58db.jpg';
                }
              }}
              className="w-full h-full object-contain rounded-full bg-black p-1"
            />
            {/* Zoom hint overlay */}
            <span className="absolute bottom-2 right-2 bg-stone-900/90 border border-amber-500/60 text-amber-300 p-1.5 rounded-full shadow-lg opacity-85 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-4 h-4" />
            </span>
          </button>
        </div>

        {/* 8 Slices Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-500/15 border border-amber-500/40 rounded-full text-amber-300 text-xs font-medium mb-3 backdrop-blur-xs">
          <Pizza className="w-3.5 h-3.5 text-amber-400" />
          <span>8 Clásicas Porciones · Receta de Masa 2020</span>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-white leading-tight">
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent drop-shadow-sm">
            PIZZERÍA OZ
          </span>
        </h1>
        {/* ============================================================== */}
        {/* BOTONES PRINCIPALES DE ACCIÓN: LOGIN / REGISTRO */}
        {/* ============================================================== */}
        <div className="mt-8 w-full max-w-md flex flex-col gap-3.5">
          {user ? (
            /* Logged in state */
            <div className="bg-stone-900/90 border border-amber-500/50 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-left">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/40">
                    {(user.name || user.cedula || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs text-stone-400">Sesión iniciada como</div>
                    <div className="text-sm font-bold text-white">{user.name || `Cliente CI ${user.cedula}`}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 rounded-xl transition-all shadow-xs cursor-pointer"
                  title="Cerrar sesión de cliente"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleEnterStore}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] cursor-pointer"
                >
                  <Pizza className="w-4 h-4" />
                  <span>Continuar al Menú</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowWelcomeScreen(false);
                    setIsUserDashboardOpen(true);
                  }}
                  className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700 transition-colors cursor-pointer"
                >
                  Mi Panel
                </button>
              </div>
            </div>
          ) : (
            /* Guest / New visitor state: The 2 requested buttons formatted for perfect mobile fitting */
            <>
              {/* Button 1: Ya soy usuario */}
              <button
                onClick={handleGoToLogin}
                className="w-full flex items-center justify-between gap-3 p-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-extrabold rounded-2xl transition-all shadow-xl shadow-amber-500/25 active:scale-[0.98] cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-stone-950/15 flex items-center justify-center shrink-0 border border-stone-950/10">
                    <LogIn className="w-5 h-5 text-stone-950 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-extrabold text-stone-950 leading-tight">
                      Ya soy usuario
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-900/80 font-semibold truncate mt-0.5">
                      Entrar / Iniciar Sesión con Cédula
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-stone-950/10 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 text-stone-950" />
                </div>
              </button>

              {/* Button 2: Crear Cuenta */}
              <button
                onClick={handleGoToRegister}
                className="w-full flex items-center justify-between gap-3 p-3.5 sm:px-6 sm:py-4 bg-stone-900/95 hover:bg-stone-850 text-white border-2 border-amber-500/60 hover:border-amber-400 font-extrabold rounded-2xl transition-all shadow-lg backdrop-blur-md active:scale-[0.98] cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <UserPlus className="w-5 h-5 text-amber-400 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-extrabold text-amber-300 leading-tight">
                      Crear Cuenta
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-400 font-medium truncate mt-0.5">
                      Registrate con Cédula gratis
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              </button>
            </>
          )}
        </div>

        {/* ============================================================== */}
        {/* APARTADO EN PORTADA: INSTALAR EN CELULAR */}
        {/* ============================================================== */}

        {/* 1. VERSIÓN CELULAR: Sin QR (innecesario en teléfono). Barra compacta y limpia */}
        <div className="mt-5 w-full max-w-md mx-auto md:hidden">
          <button
            type="button"
            onClick={handleDirectInstall}
            className="w-full flex items-center justify-between gap-3 p-3 bg-stone-900/80 hover:bg-stone-850 active:scale-[0.99] border border-stone-800 rounded-2xl text-left text-xs transition-all shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-stone-200 text-xs truncate">
                  {installedSuccess ? '✓ ¡Ícono creado con éxito!' : 'Instalar acceso directo en mi celular'}
                </div>
                <div className="text-[10px] text-stone-400 truncate">
                  Entrá directo en 1 toque sin escribir la web
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0">
              Instalar
            </span>
          </button>
        </div>

        {/* 2. VERSIÓN PC: Más ancha, baja altura y presencia secundaria discreta */}
        <div className="mt-6 w-full max-w-2xl mx-auto hidden md:flex items-center justify-between gap-4 py-2.5 px-4 sm:px-5 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/30 text-left text-white backdrop-blur-xs transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-stone-200 flex items-center gap-2">
                <span>Instalá Pizzería OZ en tu celular</span>
                <span className="text-[10px] font-normal text-amber-400/90 font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                  Escaneo QR
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate mt-0.5">
                Escaneá con la cámara de tu teléfono para abrir el menú y agregar el ícono a tu pantalla.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1 bg-stone-950 rounded-lg border border-amber-500/40 shadow-xs" title="Escaneá con tu celular para abrir la app">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://pizzeriaoz.com')}&bgcolor=0c0a09&color=f59e0b&margin=2`}
                alt="Código QR Pizzería OZ"
                className="w-11 h-11 rounded object-contain"
              />
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* BOTTOM PILLARS / VALUE HIGHLIGHTS */}
      {/* ============================================================== */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-6 pt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-stone-300">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/80 backdrop-blur-xs">
            <Pizza className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">8 Porciones</div>
              <div className="text-[10px] text-stone-400">Corte clásico artesanal</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/80 backdrop-blur-xs">
            <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Envíos Gratis</div>
              <div className="text-[10px] text-stone-400">A partir de ${storeSettings.freeShippingThreshold}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/80 backdrop-blur-xs">
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Pedidos WhatsApp</div>
              <div className="text-[10px] text-stone-400">Directo al mostrador</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/80 backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Pago Seguro</div>
              <div className="text-[10px] text-stone-400">Efectivo o tarjeta</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-stone-400 flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-400" />
            {storeSettings.storeAddress}
          </span>
          <span className="hidden sm:inline">·</span>
          <span>{storeSettings.storeHours}</span>
          <span className="hidden sm:inline">·</span>
          <span className="text-stone-300 font-mono">Pizzería OZ © 2026</span>
          <span className="hidden sm:inline">·</span>
          <button
            onClick={() => setIsAdminOpen(true)}
            className="text-stone-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-3 h-3 text-amber-400/80" />
            <span>Acceso Dueño</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
