import React from 'react';
import { ShoppingBag, User as UserIcon, Flame, Pizza, Truck, Sparkles, ChevronDown, LogOut, Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STORE_CATEGORIES } from '../data/products';

export const Header: React.FC = () => {
  const {
    user,
    totalCartItems,
    cartSubtotal,
    setIsCartOpen,
    setIsAuthModalOpen,
    setIsUserDashboardOpen,
    setDashboardInitialTab,
    storeSettings,
    selectedCategory,
    setSelectedCategory,
    setIsAdminOpen,
    setIsLogoModalOpen,
    setShowWelcomeScreen,
    logout,
    logoutAdmin,
    isAdminAuthenticated,
  } = useStore();

  const handleUserClick = () => {
    if (user) {
      setDashboardInitialTab('pedidos');
      setIsUserDashboardOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    const el = document.getElementById('catalogo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 transition-all shadow-md">
      {/* Top micro banner for free delivery & announcements */}
      <div className="bg-amber-600 text-stone-950 text-[11px] sm:text-xs font-bold py-1 px-4 text-center tracking-wide">
        {storeSettings.topBannerAnnouncement}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-6 h-16 sm:h-20">
          
          {/* Zone 1: Official Logo & Brand with Large Logo Presentation */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink min-w-0 py-1">
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="relative group p-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 text-left cursor-pointer shrink-0"
              title="Click para ver el Nuevo Logo Oficial en tamaño gigante"
            >
              {/* Subtle halo glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xs opacity-70 group-hover:opacity-100 transition-opacity" />
              <img
                src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
                alt="Pizzería OZ Nuevo Logo - 8 Porciones"
                className="relative w-9 h-9 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-black border-2 border-amber-400 object-contain p-0.5 shadow-xl group-hover:scale-105 transition-all duration-200"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 font-extrabold text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full border border-stone-900 shadow-xs uppercase tracking-tighter">
                Nuevo
              </span>
            </button>

            <div className="flex flex-col min-w-0">
              <a href="#" className="flex items-baseline gap-1.5 group">
                <span className="text-sm sm:text-xl md:text-2xl font-serif font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
                  {storeSettings.storeName}
                </span>
              </a>
              <span className="text-[10px] sm:text-[11px] text-amber-400/90 font-medium tracking-wide hidden sm:block truncate">
                El Laboratorio · Receta 2020 · 8 Porciones
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-stone-300">
            <button
              onClick={() => setShowWelcomeScreen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:text-white bg-stone-800/80 hover:bg-stone-700/80 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
              title="Volver a la portada de bienvenida"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Portada</span>
            </button>
            <button
              onClick={() => handleCategoryClick('promos_activas')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white font-extrabold text-xs tracking-wide shadow-xs hover:brightness-110 transition-all cursor-pointer ring-1 ring-amber-300/40"
            >
              <Flame className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
              <span>PROMOS ACTIVAS</span>
            </button>
            <a
              href="#catalogo"
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Menú Completo
            </a>
            <a
              href="#nosotros"
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Nosotros
            </a>
            <a
              href="#contacto"
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Contacto
            </a>
            <a
              href="#local"
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Sucursal & Horarios
            </a>
          </nav>

          {/* Zone 3: User, Admin, Logout & Cart buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Admin CMS Button */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-amber-300 bg-stone-800/90 hover:bg-stone-750 border border-amber-500/30 rounded-lg transition-all shadow-xs cursor-pointer"
              title="Panel de Administración para el Dueño"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Panel Dueño</span>
            </button>

            {/* Botón directo Cerrar Sesión Dueño */}
            {isAdminAuthenticated && (
              <button
                onClick={logoutAdmin}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-2 text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/40 rounded-lg transition-colors cursor-pointer"
                title="Cerrar sesión de Superusuario Dueño"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline text-[11px]">Salir Dueño</span>
              </button>
            )}

            {/* Club OZ Loyalty Badge Button */}
            {user && (
              <button
                onClick={() => {
                  setDashboardInitialTab('fidelizacion');
                  setIsUserDashboardOpen(true);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                title="Ver mi Tarjeta de Fidelización Club OZ (8 Porciones)"
              >
                <Pizza className="w-3.5 h-3.5 text-amber-400" />
                <span>Club: {user.loyalty?.stampsCount ?? 3}/8</span>
              </button>
            )}

            {/* User Account / Orders Button */}
            <button
              onClick={handleUserClick}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
                user
                  ? 'text-amber-300 bg-stone-800 hover:bg-stone-700 border border-amber-500/30'
                  : 'text-stone-200 bg-stone-800 hover:bg-stone-700'
              }`}
              title={user ? `Hola ${user.name} (CI: ${user.cedula}) - Ver mis pedidos` : 'Ingresar con Cédula / Registrarse'}
            >
              <UserIcon className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">
                {user ? (user.name ? user.name.split(' ')[0] : 'Mi Perfil') : 'Ingresar'}
              </span>
              {user && (
                <span className="text-[10px] text-stone-400 hidden xl:inline font-mono">
                  · CI: {user.cedula}
                </span>
              )}
            </button>

            {/* Botón directo Cerrar Sesión Cliente */}
            {user && (
              <button
                onClick={logout}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-2 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 rounded-lg transition-colors cursor-pointer"
                title={`Cerrar sesión de ${user.name}`}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline text-[11px]">Cerrar Sesión</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-stone-950 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] rounded-xl transition-all shadow-sm whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer"
              aria-label={`Ver carrito de compras con ${totalCartItems} productos`}
            >
              <ShoppingBag className="w-4 h-4 text-stone-950 shrink-0" />
              <span className="font-bold hidden sm:inline">Mi Pedido</span>
              {totalCartItems > 0 && (
                <span className="flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-[11px] font-black bg-stone-950 text-amber-400 rounded-full tabular-nums">
                  {totalCartItems}
                </span>
              )}
              {cartSubtotal > 0 && (
                <span className="hidden md:inline text-stone-900 font-mono text-xs tabular-nums border-l border-amber-600 pl-2">
                  ${cartSubtotal.toLocaleString('es-AR')}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Zone 4: Category Navigation Bar (Slim single row on mobile with Dropdown) */}
      <div className="bg-stone-950/95 border-t border-stone-800/80 px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2">
        {/* Mobile View: Dropdown compacto de 1 sola fila */}
        <div className="md:hidden flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryClick(e.target.value)}
              className="w-full appearance-none bg-stone-900 border border-amber-500/40 rounded-lg px-3 py-1.5 pr-8 text-xs font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs cursor-pointer truncate"
            >
              {STORE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-stone-900 text-stone-100 font-medium">
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => handleCategoryClick('promos_activas')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-500 text-white font-extrabold text-[11px] tracking-wide shrink-0 shadow-xs ring-1 ring-amber-300/40 cursor-pointer"
          >
            <Flame className="w-3 h-3 fill-white text-white animate-pulse" />
            <span>PROMOS</span>
          </button>
        </div>

        {/* Desktop View: Barra completa de categorías */}
        <div className="hidden md:flex max-w-7xl mx-auto flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold tracking-wider text-amber-400 shrink-0 uppercase flex items-center gap-1 mr-1 py-0.5">
            <Pizza className="w-3.5 h-3.5" />
            <span>Menú:</span>
          </span>
          {STORE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const isPromo = cat.id === 'promos_activas';
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isPromo
                    ? isActive
                      ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white font-extrabold shadow-md ring-2 ring-amber-400 scale-[1.05]'
                      : 'bg-gradient-to-r from-red-900/90 via-red-800 to-amber-900/90 hover:from-red-600 hover:to-amber-500 text-amber-200 hover:text-white font-bold border border-red-500/50 shadow-xs'
                    : isActive
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs scale-[1.02]'
                    : 'text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-800/90 font-medium'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
