import React from 'react';
import { Flame, Sparkles, ZoomIn, FlaskConical, ArrowRight, HeartHandshake, ShieldCheck, Pizza } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const StorySection: React.FC = () => {
  const { storeSettings, setIsLogoModalOpen, products, setSelectedProduct, setSelectedCategory, user, openAuthModal, showToast } = useStore();

  const handleOrderChivimuzza = () => {
    if (!user) {
      openAuthModal('register');
      showToast('⚠️ Nadie puede pedir sin estar registrado. Creá tu cuenta gratis con Cédula.');
      return;
    }
    const chivimuzza = products.find(p => p.id === 'pzg-chivimuzza') || products.find(p => p.name.toLowerCase().includes('chivimuzza'));
    if (chivimuzza) {
      setSelectedProduct(chivimuzza);
    } else {
      setSelectedCategory('pizzetas_gourmet');
      const el = document.getElementById('catalogo');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="nosotros" className="py-20 bg-stone-900 text-stone-100 border-t border-stone-800 scroll-mt-24 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Grid: Story & Lab Manifesto */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Origin Story & Logo */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Logo and Pill Tag */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="relative group p-0.5 rounded-full shrink-0 cursor-pointer"
                title="Click para ver el nuevo logo oficial ampliado"
              >
                <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xs opacity-75 group-hover:opacity-100 transition-opacity" />
                <img
                  src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
                  alt="Nuevo Logo Oficial Pizzería OZ - 8 Porciones"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black object-contain p-0.5 border-2 border-amber-400 shadow-xl group-hover:scale-105 transition-transform"
                />
              </button>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Nuestra Historia · 8 Porciones
                </div>
                <h3 className="text-xl font-serif font-bold text-white tracking-tight mt-1">
                  {storeSettings.storeName}
                </h3>
                <button
                  onClick={() => setIsLogoModalOpen(true)}
                  className="text-xs text-amber-400/80 hover:text-amber-300 flex items-center gap-1 mt-0.5 cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>Ver logo oficial (8 porciones estilizadas)</span>
                </button>
              </div>
            </div>

            {/* Title exact copy */}
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              De un momento difícil a nuestra mayor pasión
            </h2>

            {/* Paragraphs exact copy */}
            <div className="space-y-4 text-stone-300 leading-relaxed text-base">
              <p>
                Nacimos en medio de la pandemia, en ese 2020 que nos cambió la vida a todos. Mientras el mundo se detenía, nosotros encontrábamos una forma de seguir moviéndonos: <strong>amasando</strong>.
              </p>
              <p>
                No empezamos con un horno a leña centenario, empezamos con una <strong>receta de masa obsesiva</strong> y unas ganas inmensas de traer alegría a las mesas (aunque fueran a distancia). Hoy, esa receta es nuestro corazón y el secreto que nos mantiene vivos.
              </p>
            </div>

            {/* Badges / Commitments */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-stone-800/80 border border-stone-700/80">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
                  <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                  Masa Obsesiva 48hs
                </div>
                <p className="text-[11px] text-stone-400 leading-tight">
                  Fermentación en frío para una textura crocante, aireada y liviana.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-800/80 border border-stone-700/80">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
                  <HeartHandshake className="w-4 h-4 text-amber-400" />
                  Alegría a tu Mesa
                </div>
                <p className="text-[11px] text-stone-400 leading-tight">
                  La misma pasión del 2020 en cada caja caliente que enviamos.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: "Somos un Laboratorio" & "Chivimuzza" Star Product */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Laboratory Manifesto Box */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-stone-800/90 via-stone-800/60 to-stone-900 border-2 border-amber-500/40 shadow-2xl backdrop-blur-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-stone-950 uppercase tracking-wider mb-4 shadow-sm">
                <FlaskConical className="w-3.5 h-3.5" />
                Filosofía de Cocina
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mb-3">
                No somos una pizzería tradicional. Somos un Laboratorio.
              </h3>

              <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-3">
                Aquí no seguimos reglas, seguimos el instinto. Nuestra cocina es un laboratorio de experimentación donde la pasión por los nuevos sabores manda.
              </p>

              <p className="text-amber-400 font-semibold text-sm sm:text-base tracking-wide">
                ¿El resultado? Creaciones que no encuentras en otro lado.
              </p>
            </div>

            {/* Star of the Lab: La Legendaria Chivimuzza */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/40 relative overflow-hidden group">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                
                <div className="space-y-2 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <span>🧪</span> La estrella del laboratorio
                  </div>
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                    La legendaria Chivimuzza
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                    Un equilibrio perfecto que nació de un experimento y se convirtió en nuestro clásico indispensable. Si no la probaste, ¿estás seguro de que conocés nuestra pizza?
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                  <span className="text-lg font-bold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/30">
                    $530
                  </span>
                  <button
                    onClick={handleOrderChivimuzza}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer group-hover:scale-102"
                  >
                    <span>Probar la Chivimuzza</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* Quality Seals */}
            <div className="flex items-center justify-between gap-4 px-2 text-stone-400 text-xs">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Ingredientes Frescos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Pizza className="w-4 h-4 text-amber-400" />
                <span>8 Porciones Clásicas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Receta Exclusiva 2020</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
