import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Check, ShieldCheck, Sparkles, MessageSquare, Flame, UserPlus } from 'lucide-react';
import { BurgerTier } from '../types';
import { useStore } from '../context/StoreContext';
import { ALL_PIZZA_FLAVORS, calculateExtraFlavorsCost } from '../data/pizzaFlavors';
import { getProductCustomization } from '../utils/productCustomization';

export const ProductDetailModal: React.FC = () => {
  const { selectedProduct, setSelectedProduct, addToCart, setIsCartOpen, user, openAuthModal } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Selected Flavors (ONLY for "Arma tu..." products)
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [flavorSearch, setFlavorSearch] = useState('');

  // Observations / Kitchen notes (available for ALL products!)
  const [observations, setObservations] = useState('');
  const [burgerTier, setBurgerTier] = useState<BurgerTier>('sencilla');

  // Reset state when product opens
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      setFlavorSearch('');
      setSelectedFlavors([]);
      setObservations('');
      setBurgerTier('sencilla');
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const customConfig = getProductCustomization(selectedProduct);

  // ONLY "Arma tu..." products allow customizing/selecting base flavors
  const isArmaTu = Boolean(
    selectedProduct.supportsCustomFlavors || selectedProduct.id.includes('arma-tu')
  );

  // Burgers allow selecting Sencilla, Doble, Triple, Cuadruple
  const isBurger = Boolean(selectedProduct.category === 'burgers' || selectedProduct.burgerTiers);
  const burgerPrice = isBurger && selectedProduct.burgerTiers
    ? selectedProduct.burgerTiers[burgerTier]
    : selectedProduct.price;

  const extraFlavorsCost = isArmaTu
    ? calculateExtraFlavorsCost(selectedFlavors.length, true)
    : 0;
  const unitPriceWithFlavors = burgerPrice + extraFlavorsCost;
  const totalPrice = unitPriceWithFlavors * quantity;

  const toggleFlavor = (flavorName: string) => {
    if (selectedFlavors.includes(flavorName)) {
      setSelectedFlavors((prev) => prev.filter((f) => f !== flavorName));
    } else {
      setSelectedFlavors((prev) => [...prev, flavorName]);
    }
  };

  const isSoldOut = selectedProduct.available === false;

  const handleAddToCart = () => {
    if (isSoldOut) return;
    if (!user) {
      openAuthModal('register');
      return;
    }
    addToCart(
      selectedProduct,
      quantity,
      selectedFlavors.length > 0 ? selectedFlavors : undefined,
      observations.trim() || undefined,
      isBurger ? burgerTier : undefined,
      isBurger ? burgerPrice : undefined
    );
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setSelectedProduct(null);
      setIsCartOpen(true);
    }, 600);
  };

  const filteredFlavors = ALL_PIZZA_FLAVORS.filter(
    (f) =>
      f.name.toLowerCase().includes(flavorSearch.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(flavorSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="absolute top-4 right-4 z-20 p-2 text-stone-500 hover:text-stone-900 bg-white/90 hover:bg-white rounded-full transition-colors shadow-xs"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-12">
            
            {/* Left: Product Image */}
            <div className="md:col-span-5 relative bg-stone-100 aspect-[16/10] sm:aspect-[4/3] md:aspect-auto max-h-[240px] md:max-h-none h-full min-h-[180px]">
              <img
                src={selectedProduct.image || '/assets/images/pizza_muzzarella_oz_1792935617970.jpg'}
                alt={selectedProduct.name}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/assets/images/pizza_muzzarella_oz_1792935617970.jpg')) {
                    target.src = '/assets/images/pizza_muzzarella_oz_1792935617970.jpg';
                  }
                }}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
              {selectedProduct.category === 'promos_activas' && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-black px-3 py-1 rounded-md shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
                  <span>{selectedProduct.discountBadge || 'PROMO ACTIVA'}</span>
                </div>
              )}
              {selectedProduct.notes && selectedProduct.category !== 'promos_activas' && (
                <div className="absolute bottom-3 left-3 bg-stone-900/90 backdrop-blur-xs text-amber-300 text-[11px] px-2.5 py-1 rounded-md font-medium">
                  {selectedProduct.notes}
                </div>
              )}
            </div>

            {/* Right: Contiguous Purchase Module */}
            <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between">
              <div>
                {/* Category & Unit */}
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-1">
                  <span className="uppercase tracking-wider text-amber-700">
                    Pizzería OZ
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedProduct.unit}</span>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-tight">
                  {selectedProduct.name}
                </h2>

                {/* Price Display */}
                <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
                  {selectedProduct.originalPrice && (
                    <span className="text-base sm:text-lg text-stone-400 line-through font-mono">
                      ${selectedProduct.originalPrice.toLocaleString('es-AR')}
                    </span>
                  )}
                  <span className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                    selectedProduct.category === 'promos_activas' ? 'text-red-600' : 'text-stone-900'
                  }`}>
                    ${unitPriceWithFlavors.toLocaleString('es-AR')}
                  </span>
                  {selectedProduct.discountBadge && (
                    <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-md uppercase">
                      {selectedProduct.discountBadge}
                    </span>
                  )}
                  {extraFlavorsCost > 0 && (
                    <span className="text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-medium">
                      Incluye +${extraFlavorsCost} por {selectedFlavors.length - 2} sabor(es) extra
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {selectedProduct.description}
                </p>

                {/* ============================================================== */}
                {/* FLAVOR SELECTION (Only for dedicated "Arma tu..." specials) */}
                {/* ============================================================== */}
                {isArmaTu && (
                  <div className="mt-5 pt-4 border-t border-stone-200">
                    {/* Information notification banner */}
                    <div className="mb-3 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-stone-800 space-y-1">
                      <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                        <span>🧀 Base tradicional con salsa y muzzarella incluida</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-normal">
                        La muzzarella tradicional viene de base y <strong>no consume cupo de sabor</strong>. Podés elegir <strong>hasta 2 sabores gratis</strong> de las pizzetas de 32 cm. A partir del 3er sabor, cada adicional cuesta <strong>$50 pesos</strong>. (O podés elegir <em>Extra de Muzzarella</em>).
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Sabores para tu Pizza:</span>
                      </label>
                      
                      {/* Dynamic Free Flavor Tracker */}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        selectedFlavors.length === 0
                          ? 'bg-stone-100 text-stone-700'
                          : selectedFlavors.length <= 2
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {selectedFlavors.length === 0
                          ? '0 de 2 sabores gratis elegidos (muzzarella sola)'
                          : selectedFlavors.length === 1
                          ? '1 de 2 sabores gratis elegidos (te queda 1 gratis)'
                          : selectedFlavors.length === 2
                          ? '2 de 2 sabores gratis elegidos'
                          : `${selectedFlavors.length} sabores (${selectedFlavors.length - 2} extra: +$${(selectedFlavors.length - 2) * 50})`}
                      </span>
                    </div>

                    {/* Flavor search */}
                    <input
                      type="text"
                      value={flavorSearch}
                      onChange={(e) => setFlavorSearch(e.target.value)}
                      placeholder="Buscar sabor (ej: jamón, panceta, extra de muzzarella, choclo)..."
                      className="w-full mb-2.5 px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />

                    {/* Flavors Grid Tags */}
                    <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 border border-stone-200 rounded-xl p-2.5 bg-stone-50/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {filteredFlavors.map((flavor) => {
                          const isSelected = selectedFlavors.includes(flavor.name);
                          const isCurrentlyFree = !isSelected && selectedFlavors.length < 2;

                          return (
                            <button
                              key={flavor.id}
                              type="button"
                              onClick={() => toggleFlavor(flavor.name)}
                              className={`flex items-center justify-between p-2.5 rounded-lg text-left text-xs font-medium transition-all ${
                                isSelected
                                  ? 'bg-stone-900 text-white shadow-xs'
                                  : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 hover:border-amber-300'
                              }`}
                            >
                              <div className="truncate mr-2">
                                <span className="font-semibold block truncate">{flavor.name}</span>
                                {flavor.description && (
                                  <span className={`text-[10px] block truncate ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                                    {flavor.description}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isSelected ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-stone-800 px-1.5 py-0.5 rounded">
                                    <Check className="w-3 h-3 text-amber-400" />
                                    <span>Elegido</span>
                                  </span>
                                ) : (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                                    isCurrentlyFree
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}>
                                    {isCurrentlyFree ? 'Gratis' : '+$50'}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Summary of Chosen Flavors */}
                    <div className="mt-3 p-2.5 bg-stone-100 rounded-xl border border-stone-200 text-xs">
                      <div className="font-semibold text-stone-900 mb-1 flex items-center justify-between">
                        <span>Sabores seleccionados ({selectedFlavors.length}):</span>
                        {extraFlavorsCost > 0 && (
                          <span className="text-amber-800 font-bold font-mono">
                            +${extraFlavorsCost} extra
                          </span>
                        )}
                      </div>
                      {selectedFlavors.length === 0 ? (
                        <div className="text-[11px] text-stone-500 italic">
                          Base clásica de salsa y muzzarella fundida (sin sabores adicionales seleccionados).
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedFlavors.map((fl, index) => {
                            const isExtra = index >= 2;
                            return (
                              <span
                                key={index}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                                  isExtra
                                    ? 'bg-amber-200 text-amber-950 font-bold border border-amber-300'
                                    : 'bg-white text-stone-800 border border-stone-300'
                                }`}
                              >
                                <span>{fl}</span>
                                <span className={`text-[10px] ${isExtra ? 'text-amber-900 font-bold' : 'text-emerald-700'}`}>
                                  {isExtra ? '(+$50)' : '(Gratis)'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFlavor(fl);
                                  }}
                                  className="ml-1 text-stone-400 hover:text-stone-700 p-0.5"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* SELECTOR DE TAMAÑO / MEDALLONES DE CARNE (BURGERS) */}
                {/* ============================================================== */}
                {isBurger && selectedProduct.burgerTiers && (
                  <div className="mt-5 pt-4 border-t border-stone-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        <span>Elegí el tamaño / medallones:</span>
                      </label>
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {burgerTier === 'sencilla' && 'Sencilla (1 carne)'}
                        {burgerTier === 'doble' && 'Doble (2 carnes)'}
                        {burgerTier === 'triple' && 'Triple (3 carnes)'}
                        {burgerTier === 'cuadruple' && 'Cuádruple (4 carnes)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          { id: 'sencilla', label: 'Sencilla', desc: '1 medallón', price: selectedProduct.burgerTiers.sencilla },
                          { id: 'doble', label: 'Doble', desc: '2 medallones', price: selectedProduct.burgerTiers.doble },
                          { id: 'triple', label: 'Triple', desc: '3 medallones', price: selectedProduct.burgerTiers.triple },
                          { id: 'cuadruple', label: 'Cuádruple', desc: '4 medallones', price: selectedProduct.burgerTiers.cuadruple },
                        ] as const
                      ).map((tier) => {
                        const isSelected = burgerTier === tier.id;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => setBurgerTier(tier.id)}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-600 text-amber-950 ring-2 ring-amber-500/30 shadow-xs font-semibold'
                                : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <span className="text-xs font-bold">{tier.label}</span>
                            <span className="text-[10px] text-stone-500">{tier.desc}</span>
                            <span className="text-xs font-mono font-bold mt-1 text-stone-900">${tier.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* OBSERVACIONES / INSTRUCCIONES PARA LA COCINA (TODOS LOS PRODUCTOS) */}
                {/* ============================================================== */}
                <div className="mt-5 pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="product-observations" className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>{customConfig.label}</span>
                    </label>
                    <span className="text-[11px] font-normal text-stone-500">Opcional</span>
                  </div>

                  <input
                    id="product-observations"
                    type="text"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder={customConfig.placeholder}
                    maxLength={120}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />

                  {/* Quick-chips for observations */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customConfig.quickChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setObservations((prev) => {
                            if (!prev.trim()) return chip;
                            if (prev.toLowerCase().includes(chip.toLowerCase())) return prev;
                            return `${prev}, ${chip}`;
                          });
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 border border-stone-200 transition-colors"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock info */}
                <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{customConfig.badgeText}</span>
                </div>
              </div>

              {/* Purchase Footer: Stepper & CTA */}
              <div className="mt-6 pt-4 border-t border-stone-200 space-y-3">
                {isSoldOut && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold text-center">
                    Este producto está agotado por hoy. Volverá a estar disponible próximamente.
                  </div>
                )}

                <div className="flex items-center gap-3">
                  
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50 p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isSoldOut}
                      className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200/60"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold font-mono tabular-nums text-stone-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      disabled={isSoldOut}
                      className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200/60"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart button / Register required */}
                  {isSoldOut ? (
                    <button
                      type="button"
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-rose-100 text-rose-700 border border-rose-200 cursor-not-allowed"
                    >
                      <span>Agotado por hoy</span>
                    </button>
                  ) : user ? (
                    <button
                      onClick={handleAddToCart}
                      disabled={added}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-[0.98] ${
                        added
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer'
                      }`}
                    >
                      {added ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>¡Agregado al pedido!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 text-amber-400" />
                          <span>
                            Agregar al Pedido · ${totalPrice.toLocaleString('es-AR')}
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Registrate con Cédula para Pedir · ${totalPrice.toLocaleString('es-AR')}</span><span className="sm:hidden">Pedir con Cédula · ${totalPrice.toLocaleString('es-AR')}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
