import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Sparkles, UserPlus, LogIn, CheckCircle2, Flame, Truck, CreditCard, Ruler, Pizza, Info, Tag, Clock, ChevronDown, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STORE_CATEGORIES } from '../data/products';
import { ProductCard } from './ProductCard';

export const ProductCatalog: React.FC = () => {
  const {
    products,
    user,
    register,
    login,
    activateLegacyUserPassword,
    loginAsDemo,
    storeSettings,
    selectedCategory,
    setSelectedCategory,
    setIsLogoModalOpen,
    setDashboardInitialTab,
    setIsUserDashboardOpen,
    showToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [metroSubFilter, setMetroSubFilter] = useState<'all' | 'arma_tu' | 'medio_metro_sabores' | 'metro_entero_sabores' | 'muzzarella_pala'>('all');

  // Inline Quick Registration state for non-registered visitors (using Cédula!)
  const [regMode, setRegMode] = useState<'register' | 'login'>('register');
  const [nameInput, setNameInput] = useState('');
  const [cedulaInput, setCedulaInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [needsLegacySetup, setNeedsLegacySetup] = useState(false);
  const [legacyPhoneLast4, setLegacyPhoneLast4] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [cityInput, setCityInput] = useState('Melo');
  const [inlineAuthError, setInlineAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineAuthError(null);
    if (
      !nameInput.trim() ||
      !cedulaInput.trim() ||
      !phoneInput.trim() ||
      !addressInput.trim() ||
      !cityInput.trim() ||
      !passwordInput.trim()
    ) {
      const msg = 'Completá todos los campos obligatorios (*), incluyendo nombre, teléfono y dirección.';
      setInlineAuthError(msg);
      showToast(msg);
      return;
    }
    if (passwordInput.length < 4) {
      const msg = 'La contraseña debe tener al menos 4 caracteres.';
      setInlineAuthError(msg);
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const result = await register({
        name: nameInput.trim(),
        cedula: cedulaInput.trim(),
        phone: phoneInput.trim(),
        password: passwordInput,
        address: addressInput.trim(),
        city: cityInput.trim() || 'Melo',
      });
      if (!result.user) {
        setInlineAuthError(result.error || 'No se pudo completar el registro.');
        return;
      }
      setPasswordInput('');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineAuthError(null);
    if (!cedulaInput.trim()) {
      setInlineAuthError('Ingresá tu número de Cédula.');
      return;
    }
    if (!passwordInput) {
      setInlineAuthError('Ingresá tu contraseña.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      let result;
      if (needsLegacySetup) {
        if (passwordInput.length < 4) {
          setInlineAuthError('La contraseña debe tener al menos 4 caracteres.');
          return;
        }
        result = await activateLegacyUserPassword(cedulaInput.trim(), legacyPhoneLast4, passwordInput);
      } else {
        result = await login(cedulaInput.trim(), passwordInput);
      }

      if (!result.ok || !result.user) {
        if (result.needsPasswordSetup) {
          setNeedsLegacySetup(true);
        }
        setInlineAuthError(result.error || 'Cédula o contraseña incorrecta.');
        return;
      }
      setPasswordInput('');
      setNeedsLegacySetup(false);
      setLegacyPhoneLast4('');
      const existing = result.user;
      const needsProfile =
        !existing.name?.trim() ||
        existing.name.startsWith('Cliente CI ') ||
        existing.name === 'Cliente OZ' ||
        !existing.phone?.trim() ||
        existing.phone.includes('5555-0000') ||
        !existing.address?.trim() ||
        existing.address === 'Dirección por definir' ||
        existing.address === 'Retiro en local';
      if (needsProfile) {
        setDashboardInitialTab('perfil');
        setIsUserDashboardOpen(true);
        showToast('Completá tu nombre, teléfono y dirección para finalizar tu registro.');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const METRO_GROUP_ORDER: Record<string, number> = {
    arma_tu: 1,
    medio_metro_sabores: 2,
    metro_entero_sabores: 3,
    muzzarella_pala: 4,
  };

  // Helper to reliably classify metro pizzas even if subCategory was missing in older browser storage
  const getMetroSub = (p: { id: string; name?: string; subCategory?: string }): string => {
    if (p.subCategory) return p.subCategory;
    const id = p.id || '';
    const name = (p.name || '').toLowerCase();
    if (id.includes('arma-tu') || id.includes('arma_tu') || name.includes('arma tu')) return 'arma_tu';
    if (id === 'pzm-medio-muzza' || id === 'pzm-metro-muzza' || name.includes('muzzarella a la pala') || name.includes('muzzarella tradicional a la pala')) return 'muzzarella_pala';
    if (id.startsWith('pzm-medio-') || name.includes('medio metro')) return 'medio_metro_sabores';
    if (id.startsWith('pzm-metro-') || name.includes('metro entero')) return 'metro_entero_sabores';
    return 'medio_metro_sabores';
  };

  const isMetroItem = (p: { category: string; id: string }) => p.category === 'pizza_metro' || p.id.startsWith('pzm-');

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'todos' ||
          (selectedCategory === 'pizza_metro' ? isMetroItem(p) : p.category === selectedCategory);
        const matchesMetroSub =
          selectedCategory !== 'pizza_metro' ||
          metroSubFilter === 'all' ||
          getMetroSub(p) === metroSubFilter;
        const matchesQuery =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesMetroSub && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (isMetroItem(a) && isMetroItem(b)) {
          const orderA = METRO_GROUP_ORDER[getMetroSub(a)] || 99;
          const orderB = METRO_GROUP_ORDER[getMetroSub(b)] || 99;
          if (orderA !== orderB) return orderA - orderB;
        }
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, metroSubFilter, searchQuery, sortBy]);

  // IF USER IS NOT LOGGED IN: SHOW GATED PORTAL WITH CÉDULA REGISTRATION
  if (!user) {
    return (
      <section id="catalogo" className="py-16 bg-stone-100/60 border-t border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            
            {/* Header of the Gated Section */}
            <div className="bg-stone-900 text-white p-8 sm:p-10 text-center relative overflow-hidden">
              <div className="relative inline-block mb-4 group cursor-pointer" onClick={() => setIsLogoModalOpen?.(true)}>
                <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-pulse" />
                <img
                  src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
                  alt="Nuevo Logo Oficial Pizzería OZ - 8 Porciones"
                  className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full bg-black border-2 border-amber-400 p-1 object-contain shadow-2xl group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="text-sm">🧪</span>
                <span>Menú Oficial Pizzería OZ · El Laboratorio</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-white max-w-2xl mx-auto">
                Registrate con tu Cédula para ver nuestra carta y pedir
              </h2>

              <p className="mt-3 text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
                Ingresá tu número de cédula para acceder a nuestro catálogo completo: Pizzetas 32 cm, Pizza por Metro, Pizzetas Gourmet, Fainá, Celíacos, Calzones, Papas & Picadas, Chivitos, Baurus, Milanesas, Comida Mexicana, Burgers, Sándwiches calientes, Panchos, Postres y Bebidas.
              </p>

              {/* Free delivery badge */}
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold rounded-xl">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>¡Envíos <strong>GRATIS</strong> a partir de <strong>$250 pesos</strong>!</span>
              </div>
            </div>

            {/* Registration & Login Form Card */}
            <div className="p-6 sm:p-10 bg-white">
              
              <div className="max-w-md mx-auto">
                
                {/* Switch between Register and Login */}
                <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-lg text-xs font-semibold mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setRegMode('register');
                      setInlineAuthError(null);
                      setNeedsLegacySetup(false);
                    }}
                    className={`py-2 rounded-md transition-all ${
                      regMode === 'register'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    1. Registrarme con Cédula
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegMode('login');
                      setInlineAuthError(null);
                      setNeedsLegacySetup(false);
                    }}
                    className={`py-2 rounded-md transition-all ${
                      regMode === 'login'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    2. Ya estoy registrado
                  </button>
                </div>

                {/* Quick 1-click Demo Account option */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={loginAsDemo}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>Acceso rápido con Cédula de Prueba (4.812.394-5)</span>
                  </button>
                  <div className="text-[11px] text-stone-400 text-center mt-1.5">
                    Permite ver los precios oficiales del PDF y probar la compra al instante.
                  </div>
                </div>

                <div className="relative flex items-center justify-center mb-6">
                  <div className="border-t border-stone-200 w-full" />
                  <span className="bg-white px-3 text-xs text-stone-400 font-medium">o ingresá tus datos</span>
                  <div className="border-t border-stone-200 w-full" />
                </div>

                {/* Register Form using Cédula */}
                {regMode === 'register' ? (
                  <form onSubmit={handleInlineRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nombre y Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Ej: Marcelo García"
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Número de Cédula de Identidad (CI) *
                      </label>
                      <input
                        type="text"
                        required
                        value={cedulaInput}
                        onChange={(e) => setCedulaInput(e.target.value)}
                        placeholder="Ej: 4.567.890-1 o 12345678"
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                      />
                      <span className="text-[11px] text-stone-400 mt-1 block">
                        Usarás tu cédula para ingresar a tu panel de pedidos.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          WhatsApp / Teléfono *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="+54 9 11..."
                          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Contraseña * (4 o más caracteres)
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswordInput ? 'text' : 'password'}
                            required
                            minLength={4}
                            value={passwordInput}
                            onChange={(e) => {
                              setPasswordInput(e.target.value);
                              if (inlineAuthError) setInlineAuthError(null);
                            }}
                            placeholder="4+ caracteres (sin límite)"
                            className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordInput((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                            aria-label={showPasswordInput ? 'Ocultar contraseña' : 'Ver contraseña'}
                          >
                            {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Dirección para Delivery *
                        </label>
                        <input
                          type="text"
                          required
                          value={addressInput}
                          onChange={(e) => setAddressInput(e.target.value)}
                          placeholder="Calle, número y esquina/depto"
                          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Barrio / Zona *
                        </label>
                        <input
                          type="text"
                          required
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          placeholder="Melo"
                          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {inlineAuthError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{inlineAuthError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-[0.99]"
                    >
                      <UserPlus className="w-4 h-4 text-amber-400" />
                      <span>{isSubmittingAuth ? 'Registrando...' : 'Registrarme con Cédula y Ver Menú'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleInlineLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Número de Cédula de Identidad (CI)
                      </label>
                      <input
                        type="text"
                        required
                        value={cedulaInput}
                        onChange={(e) => {
                          setCedulaInput(e.target.value);
                          if (inlineAuthError) setInlineAuthError(null);
                        }}
                        placeholder="Ej: 4.812.394-5"
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswordInput ? 'text' : 'password'}
                          required
                          value={passwordInput}
                          onChange={(e) => {
                            setPasswordInput(e.target.value);
                            if (inlineAuthError) setInlineAuthError(null);
                          }}
                          placeholder="Ingresá tu contraseña"
                          className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordInput((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                          aria-label={showPasswordInput ? 'Ocultar contraseña' : 'Ver contraseña'}
                        >
                          {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {needsLegacySetup && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                        <div className="text-xs font-bold text-amber-950">
                          Activá la contraseña de tu cuenta existente
                        </div>
                        <p className="text-[11px] text-amber-900">
                          Ingresá los <strong>últimos 4 dígitos de tu celular</strong> registrado para activar esta clave y entrar:
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

                    {inlineAuthError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{inlineAuthError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-[0.99]"
                    >
                      <LogIn className="w-4 h-4 text-amber-400" />
                      <span>
                        {isSubmittingAuth
                          ? 'Verificando...'
                          : needsLegacySetup
                          ? 'Activar Contraseña y Entrar'
                          : 'Ingresar con Cédula'}
                      </span>
                    </button>
                  </form>
                )}

                {/* Features highlight */}
                <div className="mt-8 pt-6 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Panel de pedidos personalizado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Envíos gratis a partir de $250</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Efectivo o con tarjeta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Envío directo a WhatsApp OZ</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>
    );
  }

  // IF USER IS REGISTERED/LOGGED IN: DISPLAY THE FULL MENU AND PRODUCTS
  return (
    <section id="catalogo" className="py-16 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner welcoming logged in user */}
        <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-stone-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">¡Hola, {user.name}!</span>
            <span className="font-mono text-stone-600">(CI: {user.cedula})</span>
            <span className="text-stone-500">· Catálogo habilitado para pedidos.</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <Truck className="w-4 h-4 text-emerald-700" />
            <span>Envíos gratis a partir de $250 pesos</span>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200">
          <div>
            <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1.5">
              Carta Completa · Pizzería OZ
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              Menú Oficial de Productos
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-xl">
              No somos una pizzería tradicional, somos un laboratorio de sabores. Armá tu pizza con hasta 2 sabores gratis o pedí la legendaria Chivimuzza, chivitos, postres y bebidas. Envíos gratis a partir de $250.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar pizzeta, calzone, chivito..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar: Categories (Doble Fila) & Sorting */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <span>Categorías ({STORE_CATEGORIES.length - 1} secciones):</span>
            </span>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-xs text-stone-600 font-medium hidden sm:inline">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs cursor-pointer"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>

          {/* Mobile View: Menú Desplegable Compacto (ahorra más de media pantalla en celulares) */}
          <div className="block md:hidden space-y-2">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-amber-500/80 rounded-xl px-4 py-2.5 pr-10 text-xs sm:text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm cursor-pointer"
              >
                {STORE_CATEGORIES.map((cat) => {
                  const count = cat.id === 'todos' 
                    ? products.length 
                    : products.filter(p => p.category === cat.id).length;
                  return (
                    <option key={cat.id} value={cat.id} className="py-2 text-stone-900 font-medium">
                      {cat.label} ({count})
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-amber-700">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Accesos rápidos en 1 sola fila horizontal deslizable para las secciones más populares */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'promos_activas', label: '🔥 Promos' },
                { id: 'pizzetas', label: '🍕 Pizzetas' },
                { id: 'pizza_metro', label: '📏 Por Metro' },
                { id: 'burgers', label: '🍔 Burgers' },
                { id: 'faina', label: '🧀 Fainá' },
                { id: 'bebidas', label: '🥤 Bebidas' },
                { id: 'todos', label: '⭐ Todo' },
              ].map((quick) => (
                <button
                  key={quick.id}
                  onClick={() => setSelectedCategory(quick.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === quick.id
                      ? 'bg-amber-500 text-stone-950 shadow-xs ring-1 ring-amber-600'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop View: Botones completos en fila para pantallas medianas y grandes */}
          <div className="hidden md:flex flex-wrap items-center gap-1.5 sm:gap-2 w-full p-2.5 bg-stone-100/80 rounded-xl border border-stone-200">
            {STORE_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = cat.id === 'todos' 
                ? products.length 
                : products.filter(p => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs scale-[1.02]'
                      : 'bg-white text-stone-700 hover:bg-stone-200 hover:text-stone-950 border border-stone-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-stone-100 text-stone-500 border border-stone-200'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Category Pills for Pizza por Metro */}
        {selectedCategory === 'pizza_metro' && (
          <div className="mt-3.5 p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl space-y-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Ruler className="w-3.5 h-3.5 text-amber-700" />
                <span>Organización de Pizza por Metro:</span>
              </span>
              <span className="text-[11px] text-stone-500">
                Seleccioná una sección o navegá todo el menú organizado
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {[
                { id: 'all', label: '⭐ Todos los Metros Organizados', count: products.filter(isMetroItem).length },
                { id: 'arma_tu', label: '🎨 Arma tu Metro (2 Sabores Gratis)', count: products.filter(p => isMetroItem(p) && getMetroSub(p) === 'arma_tu').length },
                { id: 'medio_metro_sabores', label: '📏 Medio Metro con Sabores ($370)', count: products.filter(p => isMetroItem(p) && getMetroSub(p) === 'medio_metro_sabores').length },
                { id: 'metro_entero_sabores', label: '📐 Metro Entero con Sabores ($580)', count: products.filter(p => isMetroItem(p) && getMetroSub(p) === 'metro_entero_sabores').length },
                { id: 'muzzarella_pala', label: '🧀 Muzzarella Clásica ($280 / $480)', count: products.filter(p => isMetroItem(p) && getMetroSub(p) === 'muzzarella_pala').length },
              ].map((sub) => {
                const isSubActive = metroSubFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setMetroSubFilter(sub.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSubActive
                        ? 'bg-stone-900 text-white shadow-xs scale-[1.02]'
                        : 'bg-white text-stone-700 hover:bg-amber-100/70 hover:text-stone-950 border border-stone-200'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSubActive ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {sub.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

                {/* ============================================================== */}
        {/* SECCIÓN DESTACADA: PROMOS ACTIVAS & COMBOS DEL LABORATORIO */}
        {/* ============================================================== */}
        {selectedCategory === 'promos_activas' ? (
          <div className="mt-6 mb-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-red-950 text-white border-2 border-amber-500/60 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-white text-[11px] font-black tracking-wider uppercase mb-3 shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
                  <span>SECCIÓN DESTACADA · COMBOS ACTIVOS DEL LABORATORIO OZ</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-tight">
                  Promos Activas & Combos con Descuento
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Aprovechá nuestras mejores combinaciones con ahorro directo garantizado: metros enteros a la pala con fainá y refresco, hamburguesas OZ dobles con papas cheddar, la legendaria Chivimuzza y picadas con cerveza fría. ¡Envíos gratis a partir de 50!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-3">
                  <span className="text-2xl">🛵</span>
                  <div className="text-xs">
                    <span className="font-bold text-amber-300 block">Envío Gratis</span>
                    <span className="text-stone-300 text-[11px]">En compras desde 50</span>
                  </div>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-red-600/30 backdrop-blur-xs border border-red-500/40 flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div className="text-xs">
                    <span className="font-bold text-white block">Ahorro Directo</span>
                    <span className="text-red-200 text-[11px]">Precios promocionales vigentes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : selectedCategory === 'todos' && !searchQuery.trim() ? (
          <div className="mt-6 mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border-2 border-amber-500/70 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  <Flame className="w-3 h-3 fill-white animate-pulse" />
                  <span>Oportunidades Destacadas</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
                  <span>🔥 Promos Activas del Laboratorio</span>
                  <span className="text-xs font-sans font-semibold bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full">
                    Ahorro hasta 90
                  </span>
                </h3>
                <p className="text-xs text-stone-300 mt-1 max-w-xl">
                  Combos familiares de pizza por metro, noche de hamburguesas dobles con papas cheddar, Chivimuzza y packs de previa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory('promos_activas')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
              >
                <Flame className="w-3.5 h-3.5 fill-white" />
                <span>Ver las 6 Promos Activas →</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Product Count Indicator */}
        <div className="mt-4 text-xs text-stone-500 font-medium">
          Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          {selectedCategory !== 'todos' && ` en ${STORE_CATEGORIES.find(c => c.id === selectedCategory)?.label}`}
          {selectedCategory === 'pizza_metro' && metroSubFilter !== 'all' && ` · Filtrado: ${
            metroSubFilter === 'arma_tu' ? 'Arma tu Metro' :
            metroSubFilter === 'medio_metro_sabores' ? 'Medio Metro con Sabores ($370)' :
            metroSubFilter === 'metro_entero_sabores' ? 'Metro Entero con Sabores ($580)' : 'Muzzarella Clásica'
          }`}
          {searchQuery && ` para "${searchQuery}"`}
        </div>

        {/* Render Logic: Structured Sections for Pizza por Metro vs Flat Grid */}
        {filteredProducts.length > 0 ? (
          selectedCategory === 'pizza_metro' && metroSubFilter === 'all' && !searchQuery.trim() && sortBy === 'featured' ? (
            <div className="mt-8 space-y-12">
              
              {/* Bloque 1: Especiales Arma tu Metro */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Especiales Combinados</span>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-stone-900">
                      Arma tu Metro a tu Gusto (Masa a la pala · Hasta 2 Sabores Gratis)
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      La muzzarella tradicional viene incluida de base y no descuenta sabor. Elegí hasta 2 sabores gratis de las pizzetas de 32 cm. Cada adicional cuesta $50.
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-amber-200 text-amber-950 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-center">
                    2 Sabores Gratis
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-3xl">
                  {filteredProducts
                    .filter(p => getMetroSub(p) === 'arma_tu')
                    .map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                </div>
              </div>

              {/* Bloque 2: Medio Metro con Sabores ($370 c/u) */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-stone-100/80 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
                      <Ruler className="w-3.5 h-3.5 text-amber-700" />
                      <span>50 cm a la pala · $370 cada uno</span>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-stone-900">
                      Medio Metro con Sabores Individuales ($370)
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Cada sabor es un producto individual completo. No admite sabores adicionales (para combinar sabores usá Arma tu Medio Metro). Podés sumar observaciones para la cocina (mucho piso, bien cocida, etc.).
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-stone-200 text-stone-900 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-center">
                    13 Sabores Disponibles
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts
                    .filter(p => getMetroSub(p) === 'medio_metro_sabores')
                    .map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                </div>
              </div>

              {/* Bloque 3: Metro Entero con Sabores ($580 c/u) */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-stone-100/80 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
                      <Ruler className="w-3.5 h-3.5 text-amber-700" />
                      <span>100 cm a la pala · $580 cada uno · 4 a 6 personas</span>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-stone-900">
                      Metro Entero con Sabores Individuales ($580)
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Un metro completo a la pala con tu sabor preferido ($580). Sabor individual sin extras (para combinar sabores usá Arma tu Metro). Todos los pedidos admiten observaciones.
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-stone-200 text-stone-900 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-center">
                    13 Sabores Disponibles
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts
                    .filter(p => getMetroSub(p) === 'metro_entero_sabores')
                    .map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                </div>
              </div>

              {/* Bloque 4: Muzzarella Tradicional a la Pala */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
                      <Pizza className="w-3.5 h-3.5 text-amber-700" />
                      <span>Clásicos de Muzzarella</span>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-stone-900">
                      Muzzarella Tradicional a la Pala (Sin sabores adicionales)
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Tradicional masa a la pala con salsa y pura muzzarella derretida. Medio Metro ($280) y Metro Entero ($480). Producto cerrado, no admite agregar sabores.
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-center">
                    Pura Muzzarella
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-3xl">
                  {filteredProducts
                    .filter(p => getMetroSub(p) === 'muzzarella_pala')
                    .map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        ) : (
          <div className="mt-12 py-16 px-4 bg-white rounded-xl border border-dashed border-stone-300 text-center max-w-lg mx-auto">
            <Sparkles className="w-8 h-8 text-stone-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-800">
              No encontramos platos que coincidan
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Probá ajustando la búsqueda o seleccionando otra sección de pizza por metro.
            </p>
            <button
              onClick={() => {
                setMetroSubFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              Ver todos los metros
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
