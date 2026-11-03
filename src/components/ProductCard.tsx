import React, { useState } from 'react';
import { Plus, Eye, Check, Sparkles, Flame, UserPlus } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setSelectedProduct, user, openAuthModal, showToast } = useStore();
  const [imageLoaded, setImageLoaded] = useState(true);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('register');
      showToast('⚠️ Nadie puede pedir sin estar registrado. Creá tu cuenta gratis con Cédula.');
      return;
    }
    if (product.supportsCustomFlavors) {
      setSelectedProduct(product);
      return;
    }
    addToCart(product, 1);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1200);
  };

  const categoryLabels: Record<string, string> = {
    promos_activas: '🔥 Promociones Activas',
    pizzetas: 'Pizzeta 32 cm',
    pizza_metro: 'Pizza por Metro',
    pizzetas_gourmet: 'Pizzeta Gourmet',
    faina: 'Fainá (32 cm)',
    celiacos: 'Para Celíacos',
    calzones: 'Calzone Artesanal',
    papas_picadas: 'Papas & Picadas',
    chivitos: 'Chivito Uruguayo',
    baurus: 'Bauru Especial',
    milanesas: 'Milanesa c/Guarnición',
    mexicana: 'Comida Mexicana',
    burgers: 'Hamburguesa Artesanal',
    sandwiches: 'Sándwich Caliente',
    panchos: 'Pancho Gourmet',
    postres: 'Postre Artesanal',
    bebidas: 'Bebida Helada',
  };

  return (
    <article
      onClick={() => setSelectedProduct(product)}
      className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        product.category === 'promos_activas'
          ? 'bg-gradient-to-b from-amber-50/50 via-white to-white border-2 border-amber-400/90 shadow-xs ring-1 ring-amber-400/40 hover:border-amber-500'
          : 'bg-white border border-stone-200 hover:border-amber-300 hover:shadow-md'
      }`}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        <img
          src={product.image || '/assets/images/pizza_muzzarella_oz_1792935617970.jpg'}
          alt={product.name}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.includes('/assets/images/pizza_muzzarella_oz_1792935617970.jpg')) {
              setImageLoaded(false);
            } else {
              target.src = '/assets/images/pizza_muzzarella_oz_1792935617970.jpg';
            }
          }}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Status / Flavor Badge */}
        {product.category === 'promos_activas' ? (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
            <span>{product.discountBadge || 'PROMO ACTIVA'}</span>
          </div>
        ) : null}
        {product.id.includes('arma-tu') ? (
          <div className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-stone-950" />
            <span>2 Sabores Gratis (Muzza base)</span>
          </div>
        ) : product.supportsCustomFlavors ? (
          <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-amber-300 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-2xs">
            Hasta 2 sabores gratis
          </div>
        ) : product.notes ? (
          <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-stone-100 text-[11px] font-medium px-2.5 py-1 rounded-md">
            {product.notes}
          </div>
        ) : null}

        {/* Quick view hint on hover */}
        <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 text-stone-900 text-xs font-semibold rounded-lg shadow-sm">
            <Eye className="w-3.5 h-3.5" />
            {product.supportsCustomFlavors ? 'Elegir Sabores' : 'Ver Detalle'}
          </span>
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        
        {/* Unboxed Metadata with typographic separators */}
        <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1.5">
          <span className="font-semibold text-amber-800">
            {product.subCategory === 'arma_tu'
              ? '⭐ Arma tu Metro'
              : product.subCategory === 'medio_metro_sabores'
              ? '📏 Medio Metro (50 cm)'
              : product.subCategory === 'metro_entero_sabores'
              ? '📐 Metro Entero (100 cm)'
              : product.subCategory === 'muzzarella_pala'
              ? '🧀 Muzzarella a la Pala'
              : categoryLabels[product.category] || product.category}
          </span>
          <span aria-hidden="true">·</span>
          <span>{product.unit}</span>
        </div>

        {/* Product Title */}
        <h3 className="text-base font-semibold text-stone-900 leading-snug line-clamp-1 group-hover:text-amber-700 transition-colors">
          {product.name}
        </h3>

        {/* Tagline / short description */}
        <p className="mt-1 text-xs text-stone-600 line-clamp-2 leading-relaxed flex-1">
          {product.tagline}
        </p>

        {/* Footer: Price & Quick Action */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-stone-500 font-medium">Precio</span>
            <span className="text-lg font-bold font-mono text-stone-900 tabular-nums">
              ${product.price.toLocaleString('es-AR')}
            </span>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isAddedRecently}
            aria-label={`Agregar ${product.name} al pedido`}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all active:scale-95 ${
              isAddedRecently
                ? 'bg-emerald-600 text-white'
                : product.supportsCustomFlavors
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            {isAddedRecently ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Agregado</span>
              </>
            ) : product.id.includes('arma-tu') ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Armar Pizza</span>
              </>
            ) : product.supportsCustomFlavors ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sabores</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </article>
  );
};
