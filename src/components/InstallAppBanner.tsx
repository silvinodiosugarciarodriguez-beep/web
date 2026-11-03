import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, Sparkles, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallAppBanner: React.FC = () => {
  const { storeSettings, user } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already installed / running in standalone mode
    const isStandaloneApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneApp);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for the beforeinstallprompt event on Android / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // If already running standalone, or dismissed, don't show floating banner
  if (isStandalone || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 3000);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback for browsers that support add to homescreen from menu
      alert('Para instalar el ícono: abrí el menú de tu navegador (los tres puntos arriba a la derecha) y tocá "Agregar a pantalla principal" o "Instalar aplicación".');
    }
  };

  return (
    <>
      {/* Floating Bottom Install Banner on Mobile */}
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-4 z-40 max-w-md animate-in slide-in-from-bottom duration-300">
        <div className="bg-stone-900/95 border-2 border-amber-500/70 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-md flex items-center gap-3">
          {/* Logo App Icon */}
          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-amber-500 rounded-xl blur-xs opacity-75" />
            <img
              src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
              alt="Logo Pizzería OZ"
              className="relative w-12 h-12 rounded-xl bg-black p-0.5 border border-amber-400 object-contain shadow-md"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Acceso Directo en tu Celular</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
              {installedSuccess ? '¡Ícono creado con éxito!' : 'Instalá la App de Pizzería OZ'}
            </h4>
            <p className="text-[11px] text-stone-300 truncate mt-0.5">
              Entrá directo con 1 toque sin escribir la web.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Cerrar aviso de instalación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Guía para iPhone / iPad (Safari) */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 text-stone-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  Instalar en iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300">
              <p>Seguí estos 2 pasos sencillos en Safari:</p>
              
              <div className="flex items-start gap-3 p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  Tocá el botón <strong>Compartir</strong> en la barra inferior de Safari:
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 rounded-lg text-amber-300 font-medium">
                    <Share className="w-3.5 h-3.5" />
                    <span>Botón Compartir (el cuadrado con la flecha hacia arriba)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  Deslizá y elegí la opción:
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 rounded-lg text-amber-300 font-medium">
                    <PlusSquare className="w-3.5 h-3.5" />
                    <span>"Agregar a Inicio" (Add to Home Screen)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
