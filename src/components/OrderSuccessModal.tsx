import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  MessageCircle,
  Copy,
  Check,
  Truck,
  Store,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const OrderSuccessModal: React.FC = () => {
  const {
    lastPlacedOrder,
    isOrderSuccessOpen,
    setIsOrderSuccessOpen,
    getWhatsAppUrl,
    setIsUserDashboardOpen,
    setDashboardInitialTab,
  } = useStore();

  const [copied, setCopied] = useState(false);

  if (!isOrderSuccessOpen || !lastPlacedOrder) return null;

  const handleCopyMessage = () => {
    if (!lastPlacedOrder) return;
    navigator.clipboard.writeText(lastPlacedOrder.whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUserDashboard = () => {
    setIsOrderSuccessOpen(false);
    setDashboardInitialTab('pedidos');
    setIsUserDashboardOpen(true);
  };

  const isDelivery = lastPlacedOrder.deliveryMethod === 'delivery';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div
        className="relative bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOrderSuccessOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 text-center border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src="/assets/aistudio/logo_d58d58db.jpg"
              alt="Pizzería OZ"
              className="w-12 h-12 rounded-xl bg-black border border-amber-500/50 p-1 object-contain shadow-xs"
            />
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>

          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            ¡Pedido Registrado con Éxito!
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">
            Pedido #{lastPlacedOrder.id}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            Hemos guardado tu pedido en tu panel personalizado. Ahora solo resta enviarlo a la tienda por WhatsApp para comenzar la preparación.
          </p>
        </div>

        {/* Order Details Mini-Card */}
        <div className="p-5 sm:p-6 space-y-4">
          
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs text-stone-700 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-stone-600" />
                Resumen de la orden
              </span>
              <span className="font-mono font-bold text-stone-900 text-sm">
                ${lastPlacedOrder.total.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-500">Cliente:</span>
              <span className="font-semibold text-stone-900">
                {lastPlacedOrder.customerName} <span className="font-mono text-stone-500 font-normal">(CI: {lastPlacedOrder.customerCedula})</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-500">Modalidad:</span>
              <span className="font-medium text-stone-900 flex items-center gap-1">
                {isDelivery ? (
                  <>
                    <Truck className="w-3 h-3 text-amber-700" />
                    Delivery a Domicilio
                  </>
                ) : (
                  <>
                    <Store className="w-3 h-3 text-stone-700" />
                    Levanta en Local
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-500">Forma de Pago:</span>
              <span className="font-medium text-stone-900">
                {lastPlacedOrder.paymentMethod === 'cash' ? '💵 Efectivo' : '💳 Tarjeta'}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-200 text-stone-600 space-y-1">
              <span className="text-stone-500 font-semibold block">Detalle de items:</span>
              {lastPlacedOrder.items.map((i, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span>{i.quantity}x {i.productName}</span>
                    {i.selectedFlavors && i.selectedFlavors.length > 0 && (
                      <span className="text-[10px] text-amber-800 block">
                        Sabores: {i.selectedFlavors.join(', ')}
                        {i.extraFlavorsCost ? ` (+$${i.extraFlavorsCost})` : ''}
                      </span>
                    )}
                    {i.observations && (
                      <span className="text-[10px] text-stone-600 block italic">
                        📝 Obs: {i.observations}
                      </span>
                    )}
                  </div>
                  <span className="font-mono tabular-nums text-stone-800">${i.subtotal.toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Big WhatsApp Dispatch Action */}
          <div className="space-y-2.5 pt-1">
            <a
              href={getWhatsAppUrl(lastPlacedOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-[0.99]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Abrir WhatsApp con mi Pedido</span>
              <ExternalLink className="w-4 h-4 text-emerald-200" />
            </a>

            <div className="flex gap-2">
              <button
                onClick={handleCopyMessage}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-semibold rounded-lg transition-colors border border-stone-200"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-600" />
                    <span>Copiar texto del pedido</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenUserDashboard}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <span>Ver en Mis Pedidos</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
