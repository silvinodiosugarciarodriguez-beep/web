import React from 'react';
import { X, ZoomIn, Download, Sparkles, Check, Pizza } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const LogoModal: React.FC = () => {
  const { isLogoModalOpen, setIsLogoModalOpen, storeSettings } = useStore();
  const [copied, setCopied] = React.useState(false);

  if (!isLogoModalOpen) return null;

  const currentLogo = storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png';

  const handleCopyPath = () => {
    navigator.clipboard.writeText(currentLogo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-stone-900 border border-stone-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-stone-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => setIsLogoModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 transition-colors z-10 cursor-pointer"
          aria-label="Cerrar vista previa del logo"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Identidad de Marca · Pizzería OZ</span>
        </div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2">
          Nuevo Logo Oficial
        </h2>
        
        {/* The 8 portions concept explanation */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 mb-6 flex items-start gap-3">
          <Pizza className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white text-sm">
              El círculo es una visión estilizada de las 8 clásicas porciones de una pizza
            </div>
            <p className="text-stone-300 leading-relaxed text-xs">
              Los 8 segmentos discontinuos que forman el círculo exterior representan simbólicamente las <strong>8 porciones clásicas</strong> de una pizza artesanal, rodeando y protegiendo el monograma dorado <strong>OZ</strong>.
            </p>
          </div>
        </div>

        {/* Big Logo Showcase */}
        <div className="flex flex-col items-center justify-center py-6 px-4 bg-stone-950/80 border border-stone-800 rounded-2xl relative mb-6">
          <div className="relative group">
            {/* Ambient halo ring */}
            <div className="absolute -inset-3 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 rounded-full opacity-60 blur-md group-hover:opacity-90 transition-opacity animate-pulse" />
            
            <img
              src={currentLogo}
              alt="Logo Oficial Pizzería OZ - 8 Porciones"
              className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full bg-black object-contain p-2 border-4 border-amber-400 shadow-2xl transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="mt-5 flex items-center gap-2 px-3 py-1 bg-stone-900 border border-stone-800 rounded-full text-[11px] text-amber-300 font-mono">
            <Pizza className="w-3.5 h-3.5 text-amber-400" />
            <span>8 Porciones · Monograma Dorado OZ · Receta 2020</span>
          </div>
        </div>

        {/* Actions & Details */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-800/50 rounded-xl border border-stone-700/50 text-xs">
            <div className="text-stone-300 truncate max-w-xs sm:max-w-sm">
              <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Archivo oficial:</span>
              <span className="font-mono text-amber-300 text-[11px]">{currentLogo}</span>
            </div>
            <button
              onClick={handleCopyPath}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg font-medium transition-colors text-xs shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ZoomIn className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar ruta'}</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <a
              href={currentLogo}
              download="logo_pizzeria_oz.png"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors border border-stone-700"
            >
              <Download className="w-4 h-4" />
              <span>Abrir imagen original</span>
            </a>
            <button
              onClick={() => setIsLogoModalOpen(false)}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
