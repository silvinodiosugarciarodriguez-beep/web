import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Store,
  CreditCard,
  Banknote,
  MessageCircle,
  AlertCircle,
  MapPin,
  Clock,
  User as UserIcon,
  Phone,
  ShieldCheck,
  FileText,
  UserPlus,
  Gift,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DeliveryMethod, PaymentMethod } from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    storeSettings,
    isStoreCurrentlyOpen,
    user,
    createOrder,
    updateProfile,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    getWhatsAppUrl,
    openAuthModal,
    isRewardRedeemActive,
    setIsRewardRedeemActive,
  } = useStore();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Customer Details Form (uses Cédula)
  const [customerName, setCustomerName] = useState('');
  const [customerCedula, setCustomerCedula] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Delivery fields
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Melo');
  const [customerNotes, setCustomerNotes] = useState('');

  // Cash payment fields
  const [cashBillAmount, setCashBillAmount] = useState<string>('');
  const [needsChange, setNeedsChange] = useState<boolean>(false);

  // Card payment simulated fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Error state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill with user profile if available
  useEffect(() => {
    if (user) {
      setCustomerName(
        user.name && !user.name.startsWith('Cliente CI ') && user.name !== 'Cliente OZ' ? user.name : ''
      );
      setCustomerCedula(user.cedula || '');
      setCustomerPhone(user.phone && !user.phone.includes('5555-0000') ? user.phone : '');
      setCustomerEmail(user.email || '');
      setDeliveryAddress(
        user.address && user.address !== 'Dirección por definir' && user.address !== 'Retiro en local'
          ? user.address
          : ''
      );
      setApartment(user.apartment || '');
      if (user.city && user.city.trim() && user.city.trim().toLowerCase() !== 'buenos aires') {
        setDeliveryCity(user.city);
      } else {
        setDeliveryCity('Melo');
      }
    }
  }, [user, isCheckoutModalOpen]);

  if (!isCheckoutModalOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-stone-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center mx-auto border border-amber-500/30">
            <UserPlus className="w-7 h-7 text-amber-800" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 font-serif">
            Registro Obligatorio para Pedidos
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Nadie puede pedir sin estar registrado. Creá tu cuenta gratis con tu Cédula de Identidad para confirmar la entrega y coordinar por WhatsApp.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                setIsCheckoutModalOpen(false);
                openAuthModal('register');
              }}
              className="py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Crear Cuenta con Cédula
            </button>
            <button
              onClick={() => {
                setIsCheckoutModalOpen(false);
                openAuthModal('login');
              }}
              className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Ya soy usuario · Iniciar Sesión
            </button>
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="text-stone-400 hover:text-stone-700 text-xs mt-1"
            >
              Volver al Menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDelivery = deliveryMethod === 'delivery';
  const shippingFee = isDelivery
    ? cartSubtotal >= storeSettings.freeShippingThreshold
      ? 0
      : storeSettings.shippingFee
    : 0;

  const hasUnclaimedReward = Boolean(
    user && ((user.loyalty?.unclaimedRewards ?? 0) > 0 || (user.loyalty?.stampsCount ?? 0) >= 8)
  );
  const rewardDiscount = isRewardRedeemActive && hasUnclaimedReward ? 270 : 0;
  const finalTotal = Math.max(0, cartSubtotal + shippingFee - rewardDiscount);

  // Change calculation
  const parsedCash = parseFloat(cashBillAmount) || 0;
  const cashChange = parsedCash > finalTotal ? parsedCash - finalTotal : 0;

  const isStoreClosed = !isStoreCurrentlyOpen;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isStoreClosed) {
      setFormError(storeSettings.closedMessage || 'El local está cerrado momentáneamente.');
      return;
    }

    // Basic Validations
    if (!customerName.trim()) {
      setFormError('Por favor ingresá tu nombre completo.');
      return;
    }
    if (!customerCedula.trim()) {
      setFormError('Por favor ingresá tu número de cédula de identidad (CI).');
      return;
    }
    if (!customerPhone.trim()) {
      setFormError('Por favor ingresá tu número de teléfono / WhatsApp para coordinar.');
      return;
    }
    if (isDelivery && !deliveryAddress.trim()) {
      setFormError('Por favor ingresá la dirección de entrega para el delivery.');
      return;
    }
    if (isDelivery && !deliveryCity.trim()) {
      setFormError('Por favor ingresá el barrio o zona de entrega.');
      return;
    }
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 13) {
        setFormError('Por favor ingresá un número de tarjeta válido (16 dígitos).');
        return;
      }
      if (!cardHolder.trim()) {
        setFormError('Por favor ingresá el nombre impreso en la tarjeta.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Save any newly completed contact/address fields back to the user profile
      const profileUpdates: Record<string, string> = {};
      if (!user.name?.trim() || user.name.startsWith('Cliente CI ') || user.name === 'Cliente OZ') {
        profileUpdates.name = customerName.trim();
      }
      if (!user.phone?.trim() || user.phone.includes('5555-0000')) {
        profileUpdates.phone = customerPhone.trim();
      }
      if (
        isDelivery &&
        (!user.address?.trim() || user.address === 'Dirección por definir' || user.address === 'Retiro en local')
      ) {
        profileUpdates.address = deliveryAddress.trim();
      }
      if (isDelivery && (!user.city?.trim() || user.city.toLowerCase() === 'buenos aires')) {
        profileUpdates.city = deliveryCity.trim() || 'Melo';
      }
      if (Object.keys(profileUpdates).length > 0) {
        updateProfile(profileUpdates);
      }

      const order = createOrder({
        customerName: customerName.trim(),
        customerCedula: customerCedula.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deliveryMethod,
        deliveryAddress: isDelivery ? deliveryAddress.trim() : undefined,
        apartment: isDelivery ? apartment.trim() : undefined,
        deliveryCity: isDelivery ? deliveryCity.trim() || 'Melo' : undefined,
        paymentMethod,
        cashAmountToPayWith: paymentMethod === 'cash' && needsChange ? parsedCash : undefined,
        cardLast4: paymentMethod === 'card' ? cardNumber.slice(-4) || '8842' : undefined,
        cardHolder: paymentMethod === 'card' ? cardHolder : undefined,
        customerNotes: customerNotes.trim(),
      });

      // Automatically dispatch to WhatsApp
      const waUrl = getWhatsAppUrl(order);
      const win = window.open(waUrl, '_blank');
      if (!win) {
        console.log('Popup blocked; backup direct link provided on success modal.');
      }
    } catch (err: any) {
      setFormError('Ocurrió un error al procesar el pedido. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div
        className="relative bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/logo_d58d58db.jpg"
              alt="Pizzería OZ Logo"
              className="w-10 h-10 rounded-full border border-amber-500/50 object-cover shrink-0 shadow-xs"
            />
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 leading-tight">
                Confirmar y Finalizar Pedido · Pizzería OZ
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Revisá tus datos, método de pago y confirmá el envío por WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-200/50"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isStoreClosed && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="block text-rose-800">Local Cerrado / Pedidos Pausados</strong>
                <span>{storeSettings.closedMessage}</span>
              </div>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Customer Contact Data (with Cédula!) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-stone-600" />
                1. Datos del Cliente
              </h3>
              {user && (
                <span className="text-[11px] text-stone-500 font-mono">
                  CI: {user.cedula} ({user.name.split(' ')[0]})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Marcelo Silva"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Número de Cédula de Identidad (CI) *
                </label>
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerCedula}
                    onChange={(e) => setCustomerCedula(e.target.value)}
                    placeholder="Ej: 4.812.394-5"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Teléfono / WhatsApp de Contacto *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+54 9 11 2345-6789"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Observaciones de Entrega / Notas
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Ej: Bien cocida, sin orégano, timbre 4B"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Method (Delivery vs Pickup) */}
          <div className="pt-4 border-t border-stone-200">
            <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-stone-600" />
              2. Modalidad de Entrega
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option A: Delivery a Domicilio */}
              <label
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  deliveryMethod === 'delivery'
                    ? 'border-stone-900 bg-stone-50/80 shadow-2xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${deliveryMethod === 'delivery' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">Envío a Domicilio</div>
                      <div className="text-xs text-stone-500">Reparto caliente en moto</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={deliveryMethod === 'delivery'}
                    onChange={() => setDeliveryMethod('delivery')}
                    className="mt-1 text-stone-900 focus:ring-stone-900"
                  />
                </div>
                
                <div className="mt-3 text-xs font-semibold">
                  {cartSubtotal >= storeSettings.freeShippingThreshold ? (
                    <span className="text-emerald-700 font-bold">¡Envío Gratis! (Superó los $250)</span>
                  ) : (
                    <span className="text-stone-700 font-mono">
                      Costo: ${storeSettings.shippingFee.toLocaleString('es-AR')} (Gratis superando $250)
                    </span>
                  )}
                </div>
              </label>

              {/* Option B: Levanta en Local */}
              <label
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  deliveryMethod === 'pickup'
                    ? 'border-stone-900 bg-stone-50/80 shadow-2xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${deliveryMethod === 'pickup' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">Levanta en Local</div>
                      <div className="text-xs text-stone-500">Retiro en mostrador Pizzería OZ</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                    className="mt-1 text-stone-900 focus:ring-stone-900"
                  />
                </div>
                
                <div className="mt-3 text-xs font-semibold text-emerald-700">
                  Sin costo de envío ($0)
                </div>
              </label>

            </div>

            {/* Delivery address sub-form if Delivery is selected */}
            {isDelivery ? (
              <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Dirección de Entrega (Calle y número) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ej: Calle San Martín 840"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Piso / Depto / Timbre (Opcional)
                    </label>
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="Ej: Piso 2, Depto 4"
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Barrio / Zona *
                    </label>
                    <input
                      type="text"
                      required={isDelivery}
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      placeholder="Ej: Melo"
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-stone-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                  <MapPin className="w-3.5 h-3.5 text-amber-800" />
                  <span>Dirección del Local para retirar:</span>
                </div>
                <p className="font-medium pl-5">{storeSettings.storeAddress}</p>
                <div className="flex items-center gap-1.5 text-stone-500 pl-5 pt-0.5">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>Horarios: {storeSettings.storeHours}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Payment Method (Cash vs Card) */}
          <div className="pt-4 border-t border-stone-200">
            <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-stone-600" />
              3. Forma de Pago
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Payment A: Efectivo */}
              <label
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-stone-900 bg-stone-50/80 shadow-2xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'cash' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">Efectivo</div>
                      <div className="text-xs text-stone-500">
                        {isDelivery ? 'Al recibir el delivery' : 'En el mostrador'}
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="mt-1 text-stone-900 focus:ring-stone-900"
                  />
                </div>
                <div className="mt-2 text-[11px] text-stone-500">
                  Podés especificar si necesitás vuelto
                </div>
              </label>

              {/* Payment B: Tarjeta */}
              <label
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'card'
                    ? 'border-stone-900 bg-stone-50/80 shadow-2xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'card' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">Tarjeta Débito / Crédito</div>
                      <div className="text-xs text-stone-500">Cobro con posnet o pasarela</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mt-1 text-stone-900 focus:ring-stone-900"
                  />
                </div>
                <div className="mt-2 text-[11px] text-stone-500">
                  Visa, Master, Oca, Cabal o Posnet
                </div>
              </label>

            </div>

            {/* Cash details (change calculation) */}
            {paymentMethod === 'cash' && (
              <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsChange}
                    onChange={(e) => setNeedsChange(e.target.checked)}
                    className="rounded text-stone-900 focus:ring-stone-900"
                  />
                  <span>¿Necesitás vuelto? Indicá con cuánto vas a pagar:</span>
                </label>

                {needsChange && (
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="text-xs font-semibold text-stone-400 absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <input
                        type="number"
                        min={finalTotal}
                        step="50"
                        value={cashBillAmount}
                        onChange={(e) => setCashBillAmount(e.target.value)}
                        placeholder={`Ej: ${Math.ceil(finalTotal / 500) * 500 + 500}`}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tabular-nums"
                      />
                    </div>
                    {cashChange > 0 && (
                      <div className="text-xs text-stone-700 bg-white px-3 py-2 border border-stone-200 rounded-lg font-mono">
                        Vuelto: <strong className="text-emerald-700">${cashChange.toLocaleString('es-AR')}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Card details (simulated secure checkout) */}
            {paymentMethod === 'card' && (
              <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
                  <span className="font-semibold text-stone-800">Detalles de la Tarjeta</span>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Transacción Segura 256-bit</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Número de Tarjeta
                  </label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4509 2384 1029 4821"
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tabular-nums"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Nombre del Titular
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="MARCELO SILVA"
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Vencimiento
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/AA"
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Breakdown */}
          <div className="p-4 bg-stone-100 rounded-xl space-y-2 text-xs text-stone-700">
            <div className="font-semibold text-stone-900 pb-1 border-b border-stone-200">
              Resumen del Pedido ({cart.reduce((s, i) => s + i.quantity, 0)} productos)
            </div>

            <div className="space-y-1.5 py-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-stone-800">
                  <div>
                    <span className="font-medium">{item.quantity}x {item.product.name}</span>
                    {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                      <span className="text-[11px] text-amber-800 block">
                        Sabores: {item.selectedFlavors.join(', ')}
                        {item.extraFlavorsCost ? ` (+$${item.extraFlavorsCost} extra)` : ''}
                      </span>
                    )}
                  </div>
                  <span className="font-mono tabular-nums text-stone-900 font-semibold">
                    ${(((item.unitPrice ?? item.product.price) + (item.extraFlavorsCost || 0)) * item.quantity).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Loyalty Reward Banner */}
            {hasUnclaimedReward && (
              <div className="my-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="text-[11px] text-emerald-900 leading-tight">
                    <strong className="block text-emerald-800">¡Premio 8 Porciones disponible!</strong>
                    Canjeá 1 Pizzeta Muzzarella o Fainá gratis
                  </div>
                </div>
                <label className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-md border border-emerald-300 shadow-xs cursor-pointer select-none shrink-0">
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

            <div className="pt-2 border-t border-stone-200 flex justify-between">
              <span>Subtotal Productos</span>
              <span className="font-mono font-medium tabular-nums">
                ${cartSubtotal.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                {isDelivery ? 'Costo de Envío' : 'Retiro en Local'}
              </span>
              <span className="font-mono font-medium tabular-nums">
                {shippingFee === 0 ? '¡Gratis! ($0)' : `$${shippingFee.toLocaleString('es-AR')}`}
              </span>
            </div>

            {rewardDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Descuento Premio 8 Porciones</span>
                </span>
                <span className="font-mono tabular-nums font-bold">-$270</span>
              </div>
            )}

            <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-stone-900">
              <span>Total a Pagar</span>
              <span className="font-mono text-base tabular-nums">
                ${finalTotal.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Notice about WhatsApp */}
          <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <MessageCircle className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
            <div>
              <strong>Envío directo al WhatsApp de Pizzería OZ:</strong> Al confirmar, se abrirá WhatsApp con el pedido completo, tu Cédula de Identidad y los ítems detallados para comenzar la cocción.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(false)}
              className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Volver al Carrito
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isStoreClosed}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-400 disabled:cursor-not-allowed active:scale-[0.99] text-white rounded-lg font-bold text-sm transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isStoreClosed ? 'Local Cerrado Momentáneamente' : 'Confirmar y Enviar Pedido a WhatsApp OZ'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
