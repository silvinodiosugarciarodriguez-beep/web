import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, MessageSquare, Gift, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getProductCustomization } from '../utils/productCustomization';

export const CartDrawer: React.FC = () => {
  const {
    user,
    openAuthModal,
    showToast,
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    updateItemObservations,
    clearCart,
    cartSubtotal,
    storeSettings,
    isStoreCurrentlyOpen,
    setIsCheckoutModalOpen,
    isRewardRedeemActive,
    setIsRewardRedeemActive,
  } = useStore();

  const [editingObsIndex, setEditingObsIndex] = useState<number | null>(null);
  const [draftObs, setDraftObs] = useState<string>('');

  if (!isCartOpen) return null;

  const freeDeliveryRemaining = Math.max(0, storeSettings.freeShippingThreshold - cartSubtotal);
  const progressPercent = Math.min(100, Math.round((cartSubtotal / storeSettings.freeShippingThreshold) * 100));
  const isStoreClosed = !isStoreCurrentlyOpen;
  const hasUnclaimedReward = Boolean(
    user && ((user.loyalty?.unclaimedRewards ?? 0) > 0 || (user.loyalty?.stampsCount ?? 0) >= 8)
  );
  const rewardDiscount = isRewardRedeemActive && hasUnclaimedReward ? 270 : 0;
  const estimatedShipping = cartSubtotal >= storeSettings.freeShippingThreshold ? 0 : storeSettings.shippingFee;
  const estimatedTotal = Math.max(0, cartSubtotal + estimatedShipping - rewardDiscount);

  const handleProceedToCheckout = () => {
    if (isStoreClosed) {
      showToast(storeSettings.closedMessage || 'El local está cerrado momentáneamente.');
      return;
    }
    if (!user) {
      setIsCartOpen(false);
      openAuthModal('register');
      showToast('⚠️ Nadie puede pedir sin estar registrado. Creá tu cuenta gratis con Cédula.');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleStartEditObs = (index: number, currentObs?: string) => {
    setEditingObsIndex(index);
    setDraftObs(currentObs || '');
  };

  const handleSaveObs = (index: number) => {
    updateItemObservations(index, draftObs);
    setEditingObsIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end">
      
      {/* Drawer Container */}
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250 border-l border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-stone-900" />
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Tu Pedido ({cart.reduce((sum, i) => sum + i.quantity, 0)})
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-200/50 transition-colors"
            aria-label="Cerrar pedido"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator (Threshold $250) */}
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-900 mb-1.5">
            <span className="flex items-center gap-1.5 text-amber-900">
              <Truck className="w-4 h-4 text-amber-700" />
              {freeDeliveryRemaining > 0 ? (
                <span>Te faltan <strong>${freeDeliveryRemaining.toLocaleString('es-AR')}</strong> para <strong>Envío Gratis</strong></span>
              ) : (
                <span className="text-emerald-800 font-bold">¡Genial! Tenés Envío Gratis garantizado 🛵</span>
              )}
            </span>
            <span className="text-stone-600 font-mono text-[11px]">{progressPercent}%</span>
          </div>

          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                freeDeliveryRemaining === 0 ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-stone-100 space-y-4">
          {cart.length > 0 ? (
            cart.map((cartItem, index) => {
              const { product, quantity, selectedFlavors, extraFlavorsCost, observations } = cartItem;
              const basePrice = cartItem.unitPrice ?? product.price;
              const unitPrice = basePrice + (extraFlavorsCost || 0);
              const lineTotal = unitPrice * quantity;
              const isEditingThis = editingObsIndex === index;
              const itemConfig = getProductCustomization(product);

              return (
                <div key={index} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                  {/* Product Thumbnail */}
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-stone-900 truncate">
                      {product.name}
                    </h4>
                    {cartItem.selectedBurgerTier && (
                      <div className="mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100/90 border border-amber-200/80 px-2 py-0.5 rounded-md">
                          <span>🍔</span>
                          <span>
                            {cartItem.selectedBurgerTier === 'sencilla' && 'Sencilla (1 carne)'}
                            {cartItem.selectedBurgerTier === 'doble' && 'Doble (2 carnes)'}
                            {cartItem.selectedBurgerTier === 'triple' && 'Triple (3 carnes)'}
                            {cartItem.selectedBurgerTier === 'cuadruple' && 'Cuádruple (4 carnes)'}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Flavors details (Arma tu only) */}
                    {selectedFlavors && selectedFlavors.length > 0 ? (
                      <div className="mt-0.5 text-xs text-amber-900 bg-amber-50 p-1.5 rounded font-medium">
                        <span>Sabores: {selectedFlavors.join(' + ')}</span>
                        {extraFlavorsCost && extraFlavorsCost > 0 ? (
                          <span className="text-[10px] text-amber-700 block">
                            (+${extraFlavorsCost} extra por {selectedFlavors.length - 2} adicional(es))
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 block">
                            (Hasta 2 sabores gratis incluidos)
                          </span>
                        )}
                      </div>
                    ) : product.id.includes('arma-tu') ? (
                      <div className="mt-0.5 text-[11px] text-stone-600 bg-stone-100 p-1 rounded font-medium">
                        <span>Base de muzzarella artesanal tradicional</span>
                      </div>
                    ) : null}

                    {/* Observaciones personalizadas por producto */}
                    {(() => {
                      const itemConfig = getProductCustomization(product);
                      return null;
                    })()}
                    {!isEditingThis && (
                      <div>
                        {observations ? (
                          <div className="mt-1 flex items-start justify-between gap-1 text-xs text-stone-800 bg-amber-50/80 border border-amber-200/80 p-1.5 rounded-md">
                            <div className="flex items-start gap-1 min-w-0">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                              <span className="text-[11px] font-medium leading-tight break-words">
                                Obs: {observations}
                              </span>
                            </div>
                            <button
                              onClick={() => handleStartEditObs(index, observations)}
                              className="text-[10px] text-amber-800 hover:text-amber-950 underline shrink-0 ml-1.5 font-semibold"
                            >
                              Editar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditObs(index)}
                            className="mt-1 text-[11px] text-stone-500 hover:text-amber-800 flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3 text-stone-400" />
                            <span>{itemConfig.cartAddButtonLabel}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Inline Observation Editor */}
                    {isEditingThis && (
                      <div className="mt-1.5 p-2 bg-stone-50 border border-amber-300 rounded-lg space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                          <span>Aclaración para la cocina:</span>
                          <button
                            onClick={() => setEditingObsIndex(null)}
                            className="text-stone-400 hover:text-stone-700 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          autoFocus
                          value={draftObs}
                          onChange={(e) => setDraftObs(e.target.value)}
                          placeholder={itemConfig.placeholder}
                          className="w-full px-2 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex flex-wrap gap-1">
                          {itemConfig.quickChips.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => setDraftObs((prev) => (prev ? `${prev}, ${chip}` : chip))}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 hover:bg-amber-100"
                            >
                              +{chip}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            onClick={() => setEditingObsIndex(null)}
                            className="px-2 py-0.5 text-[11px] text-stone-600 hover:text-stone-900"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveObs(index)}
                            className="px-2.5 py-0.5 text-[11px] bg-stone-900 text-white rounded font-medium hover:bg-stone-800"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-stone-500 mt-1">
                      ${unitPrice.toLocaleString('es-AR')} c/u · {product.unit}
                    </div>

                    {/* Quantity and Line Total */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center border border-stone-200 rounded bg-stone-50">
                        <button
                          onClick={() => updateQuantity(index, quantity - 1)}
                          className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-200/50"
                          aria-label="Restar 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold font-mono tabular-nums text-stone-800">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(index, quantity + 1)}
                          className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-200/50"
                          aria-label="Sumar 1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold font-mono text-stone-900 tabular-nums">
                          ${lineTotal.toLocaleString('es-AR')}
                        </span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-stone-400 hover:text-rose-600 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <ShoppingBag className="w-12 h-12 mb-3 stroke-[1.5] text-stone-300" />
              <p className="font-medium text-stone-600 text-sm">Tu pedido está vacío</p>
              <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
                Elegí tus pizzas o platos favoritos de nuestra carta artesanal.
              </p>
            </div>
          )}
        </div>

        {/* Footer Subtotal & Action CTA */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
            {isStoreClosed && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-800">Local cerrado / pedidos pausados</strong>
                  <span className="text-[11px]">{storeSettings.closedMessage}</span>
                </div>
              </div>
            )}

            {hasUnclaimedReward && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="text-[11px] text-emerald-950 leading-tight">
                    <strong className="block text-emerald-800">¡Premio 8 Porciones listo!</strong>
                    <span>Pizzeta Muzzarella o Fainá Gratis</span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-emerald-300 shadow-xs cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={isRewardRedeemActive}
                    onChange={(e) => setIsRewardRedeemActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] font-bold text-emerald-800">Canjear (-$270)</span>
                </label>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} productos):</span>
                <span className="font-mono font-medium">${cartSubtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Envío a domicilio:</span>
                <span className="font-mono font-medium">
                  {estimatedShipping === 0 ? (
                    <span className="text-emerald-700 font-bold">¡GRATIS!</span>
                  ) : (
                    `$${storeSettings.shippingFee}`
                  )}
                </span>
              </div>
              {rewardDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Premio Club 8 Porciones</span>
                  </span>
                  <span className="font-mono font-bold">-$270</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-stone-900 text-base">
                <span>Total Estimado:</span>
                <span className="text-xl font-mono text-stone-950">
                  ${estimatedTotal.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="px-3 py-3 text-xs text-stone-500 hover:text-stone-800 border border-stone-300 rounded-xl hover:bg-stone-200/50 transition-colors"
                title="Vaciar todo el pedido"
              >
                Vaciar
              </button>

              <button
                onClick={handleProceedToCheckout}
                disabled={isStoreClosed}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <span>
                  {isStoreClosed
                    ? 'Cocina Cerrada Ahora'
                    : user
                    ? 'Continuar al Pago'
                    : 'Registrate para Pedir'}
                </span>
                {!isStoreClosed && <ArrowRight className="w-4 h-4 text-amber-400" />}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
