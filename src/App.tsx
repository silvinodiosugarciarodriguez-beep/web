/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCatalog } from './components/ProductCatalog';
import { StorySection } from './components/StorySection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { UserAuthModal } from './components/UserAuthModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminPanel } from './components/AdminPanel';
import { LogoModal } from './components/LogoModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { InstallAppBanner } from './components/InstallAppBanner';
import { CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error inesperado al cargar la pantalla.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetCacheAndReload = () => {
    try {
      localStorage.removeItem('pizzeria_oz_products_v8');
      localStorage.removeItem('pizzeria_oz_cart');
      localStorage.removeItem('pizzeria_oz_orders');
      localStorage.removeItem('pizzeria_oz_settings');
      localStorage.removeItem('pizzeria_oz_user');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-5">
          <div className="max-w-md w-full bg-stone-900 border border-amber-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-serif font-bold text-white">
              Actualizando el menú de Pizzería OZ
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Ocurrió un inconveniente al abrir esta vista en tu dispositivo. Tocá el botón de abajo para recargar la carta actualizada.
            </p>
            {this.state.errorMessage && (
              <div className="text-[11px] font-mono text-amber-300/80 bg-stone-950 border border-stone-800 rounded-xl p-2.5 break-words">
                {this.state.errorMessage}
              </div>
            )}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Menú</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetCacheAndReload}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl border border-stone-700 cursor-pointer"
              >
                Limpiar datos locales y volver a entrar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainAppContent: React.FC = () => {
  const { toastMessage, showWelcomeScreen } = useStore();

  if (showWelcomeScreen) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-black">
        <WelcomeScreen />
        <UserAuthModal />
        <AdminPanel />
        <LogoModal />
        <InstallAppBanner />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-stone-900 text-stone-100 rounded-xl shadow-xl text-xs font-medium border border-stone-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header */}
      <Header />

      {/* Main Page Layout */}
      <main className="flex-1">
        <Hero />
        <ProductCatalog />
        <StorySection />
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Overlays */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderSuccessModal />
      <UserAuthModal />
      <UserDashboard />
      <AdminPanel />
      <LogoModal />
      <InstallAppBanner />

      {/* Subtle Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-stone-900 text-stone-100 rounded-xl shadow-xl text-xs font-medium border border-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <StoreProvider>
        <AppErrorBoundary>
          <MainAppContent />
        </AppErrorBoundary>
      </StoreProvider>
    </AppErrorBoundary>
  );
}
