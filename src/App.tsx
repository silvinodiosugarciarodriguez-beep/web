/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
import { CheckCircle2 } from 'lucide-react';

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
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}
