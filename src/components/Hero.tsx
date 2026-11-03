import React from 'react';
import { ArrowRight, Flame, Truck, Store, MessageCircle, ShieldCheck, UserPlus, Pizza, Sparkles, ZoomIn } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Hero: React.FC = () => {
  const { user, setIsUserDashboardOpen, setIsAuthModalOpen, storeSettings, setIsLogoModalOpen, products, setSelectedProduct, setSelectedCategory } = useStore();

  const handleOrderChivimuzza = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const chivimuzza =
      products.find((p) => p.id === 'pzg-chivimuzza') ||
      products.find((p) => p.name.toLowerCase().includes('chivimuzza'));
    if (chivimuzza) {
      setSelectedProduct(chivimuzza);
    } else {
      setSelectedCategory('pizzetas_gourmet');
      const el = document.getElementById('catalogo');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleActionClick = () => {
    if (user) {
      setIsUserDashboardOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <section className="relative overflow-hidden bg-stone-900 text-stone-100 border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        
        {/* Prominent New Logo Announcement Banner */}
        <div className="mb-6 sm:mb-8 p-3.5 sm:p-5 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/50 border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5 shadow-2xl">
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="relative group p-0.5 rounded-full shrink-0 cursor-pointer"
              title="Click para ver el logo oficial en pantalla completa"
            >
              <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 rounded-full blur-sm opacity-80 group-hover:opacity-100 transition-opacity animate-pulse" />
              <img
                src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
                alt="Logo Nuevo Oficial Pizzería OZ - 8 Porciones"
                className="relative w-14 h-14 sm:w-22 sm:h-22 md:w-26 md:h-26 rounded-full bg-black border-2 border-amber-400 p-1 object-contain shadow-2xl group-hover:scale-105 transition-transform shrink-0"
              />
            </button>
            <div className="text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>¡Nuevo Logo Oficial · Identidad de Marca!</span>
              </div>
              <div className="text-base sm:text-lg font-serif font-bold text-white mt-0.5">
                El círculo es una visión estilizada de las 8 clásicas porciones de una pizza
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-xl hidden sm:block leading-relaxed">
                Cada trazo del anillo exterior representa las <strong>8 porciones clásicas</strong> de una pizza artesanal, abrazando nuestro monograma dorado <strong>OZ</strong>. Hacé clic para verlo en tamaño completo.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLogoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all shrink-0 hover:scale-[1.02] cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Ver Logo en Grande</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Headline & CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 mb-3 tracking-wider uppercase">
              <span className="text-base">🧪</span>
              <span>El Laboratorio de Pizzería OZ</span>
              <span aria-hidden="true">·</span>
              <span>Receta de Masa 2020</span>
              <span aria-hidden="true">·</span>
              <span>Seguimos el Instinto</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-[1.12] text-balance">
              {storeSettings.heroHeadline}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-stone-300 leading-relaxed max-w-xl">
              {storeSettings.heroSubtitle}
            </p>

            {/* Featured Star of the Lab callout (Pedir directo sin registrarte) */}
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-400/50 rounded-xl text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2 max-w-xl shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧪</span>
                <span><strong>La estrella del laboratorio:</strong> La legendaria Chivimuzza ($530)</span>
              </div>
              <button
                type="button"
                onClick={handleOrderChivimuzza}
                className="inline-flex items-center gap-1 text-stone-950 font-bold text-[11px] bg-amber-400 hover:bg-amber-300 px-3 py-1 rounded-lg shadow-xs whitespace-nowrap cursor-pointer transition-all active:scale-95"
              >
                <Pizza className="w-3 h-3" />
                <span>Pedir Chivimuzza ahora</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#catalogo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] rounded-xl transition-all shadow-md"
              >
                {user ? (
                  <>
                    <Pizza className="w-4 h-4" />
                    <span>Ver Menú de Pizzas</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Registrate con Cédula para Pedir</span>
                  </>
                )}
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={handleActionClick}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-medium text-stone-200 bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded-xl transition-colors cursor-pointer"
              >
                {user ? 'Panel de Mis Pedidos' : 'Iniciar Sesión'}
              </button>
            </div>

            {/* Value proposition tags */}
            <div className="mt-8 pt-6 border-t border-stone-800 flex flex-wrap gap-y-2.5 gap-x-6 text-xs text-stone-300">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span><strong>Envíos gratis</strong> a partir de <strong>${storeSettings.freeShippingThreshold}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-400" />
                <span>O levanta en local sin demora</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Envío directo a WhatsApp OZ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-stone-400" />
                <span>Pago efectivo o tarjeta</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-700 bg-stone-800 aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3]">
              <img
                src={storeSettings.heroImageUrl || "/assets/aistudio/468615878_10162129815109555_8430383621970597375_n_6aa62de3.jpg"}
                alt="Pizzas artesanales de Pizzería OZ con masa dorada, abundante queso y cortes en 8 porciones"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/assets/aistudio/468615878_10162129815109555_8430383621970597375_n_6aa62de3.jpg')) {
                    target.src = '/assets/aistudio/468615878_10162129815109555_8430383621970597375_n_6aa62de3.jpg';
                  } else {
                    target.src = '/assets/images/hero_pizzeria_oz_1792935618107.jpg';
                  }
                }}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              
              {/* Grand Floating Logo Medallion */}
              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="absolute top-4 right-4 z-10 p-2.5 bg-stone-950/95 backdrop-blur-md rounded-2xl border border-amber-500/70 shadow-2xl flex items-center gap-3.5 pr-4 group cursor-pointer hover:border-amber-400 transition-all hover:scale-[1.02]"
                title="Click para ampliar el logo oficial"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full opacity-70 blur-xs group-hover:opacity-100 transition-opacity" />
                  <img
                    src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
                    alt="Pizzería OZ Logo Oficial"
                    className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-black object-contain p-0.5 border border-amber-400/80 shadow-md group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-amber-300 tracking-wider font-serif">PIZZERÍA OZ</div>
                  <div className="text-[10px] text-stone-300">8 Porciones · Receta 2020</div>
                  <div className="text-[9px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                    <ZoomIn className="w-2.5 h-2.5" />
                    <span>Ver ampliado</span>
                  </div>
                </div>
              </button>
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Pizza className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pizzas artesanales · Masa dorada y 8 porciones</span>
                </div>
                <div className="text-base sm:text-lg font-serif font-bold text-white mt-0.5">
                  Pizzería OZ · {storeSettings.storeAddress}
                </div>
                <div className="text-xs text-stone-300">
                  {storeSettings.storeHours} · Delivery & Take Away
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
