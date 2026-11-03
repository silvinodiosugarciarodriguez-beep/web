import React, { useState } from 'react';
import {
  X,
  Package,
  User as UserIcon,
  Settings,
  MessageCircle,
  Truck,
  Store,
  LogOut,
  ExternalLink,
  Receipt,
  Save,
  Phone,
  FileText,
  Sparkles,
  Pizza,
  Gift,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus, Order } from '../types';
import { LoyaltyCard } from './LoyaltyCard';

export const UserDashboard: React.FC = () => {
  const {
    user,
    logout,
    userOrders,
    updateProfile,
    updateOrderStatus,
    storeSettings,
    updateStoreSettings,
    getWhatsAppUrl,
    isUserDashboardOpen,
    setIsUserDashboardOpen,
    dashboardInitialTab,
    setIsAuthModalOpen,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'pedidos' | 'fidelizacion' | 'perfil' | 'configuracion'>(dashboardInitialTab);
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<Order | null>(null);

  // Profile Edit State (including Cédula)
  const [name, setName] = useState(user?.name || '');
  const [cedula, setCedula] = useState(user?.cedula || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [apartment, setApartment] = useState(user?.apartment || '');

  // Settings Edit State
  const [merchantPhone, setMerchantPhone] = useState(storeSettings.whatsappNumber);
  const [storeAddressInput, setStoreAddressInput] = useState(storeSettings.storeAddress);
  const [storeHoursInput, setStoreHoursInput] = useState(storeSettings.storeHours);

  React.useEffect(() => {
    setActiveTab(dashboardInitialTab);
  }, [dashboardInitialTab]);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setCedula(user.cedula);
      setPhone(user.phone);
      setAddress(user.address);
      setCity(user.city);
      setApartment(user.apartment || '');
    }
  }, [user]);

  if (!isUserDashboardOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      cedula,
      phone,
      address,
      city,
      apartment,
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      whatsappNumber: merchantPhone.replace(/[^0-9]/g, ''),
      storeAddress: storeAddressInput,
      storeHours: storeHoursInput,
    });
  };

  const getStatusBadge = (status: OrderStatus, method: 'delivery' | 'pickup') => {
    switch (status) {
      case 'recibido':
        return (
          <span className="text-amber-800 bg-amber-100 text-xs px-2.5 py-1 rounded-md font-medium">
            Recibido / En cola
          </span>
        );
      case 'preparando':
        return (
          <span className="text-blue-800 bg-blue-100 text-xs px-2.5 py-1 rounded-md font-medium">
            Al horno / Preparando
          </span>
        );
      case 'en_camino':
        return (
          <span className="text-purple-800 bg-purple-100 text-xs px-2.5 py-1 rounded-md font-medium">
            {method === 'delivery' ? 'Repartidor en camino' : 'Listo para retirar en local'}
          </span>
        );
      case 'listo_retiro':
        return (
          <span className="text-indigo-800 bg-indigo-100 text-xs px-2.5 py-1 rounded-md font-medium">
            Listo en mostrador OZ
          </span>
        );
      case 'entregado':
        return (
          <span className="text-emerald-800 bg-emerald-100 text-xs px-2.5 py-1 rounded-md font-medium">
            Entregado / Disfrutado
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div
        className="relative bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-stone-200 my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between gap-3 bg-stone-50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <img
              src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
              alt="Pizzería OZ Logo"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-amber-500/50 object-contain bg-black p-0.5 shadow-xs shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-serif font-bold text-stone-900 leading-tight truncate">
                Panel de Usuario · Pizzería OZ
              </h2>
              <div className="text-[11px] sm:text-xs text-stone-500 truncate">
                {user ? (
                  <span>
                    Cliente: <strong>{user.name}</strong> · CI: <strong className="font-mono text-stone-800">{user.cedula}</strong>
                  </span>
                ) : (
                  <span>Registrate con tu cédula para guardar tus pedidos</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {user && (
              <button
                onClick={() => {
                  logout();
                  setIsUserDashboardOpen(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
            <button
              onClick={() => setIsUserDashboardOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-200/50 cursor-pointer"
              aria-label="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 pt-2.5 border-b border-stone-200 bg-stone-50/50 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pedidos'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Mis Pedidos ({userOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('fidelizacion')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'fidelizacion'
                ? 'border-amber-500 text-amber-800 bg-amber-50/70 font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Mi Tarjeta 8 Porciones</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px]">
              {(user?.loyalty?.stampsCount ?? 3)}/8
            </span>
          </button>

          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'perfil'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Mis Datos & Cédula</span>
          </button>

          <button
            onClick={() => setActiveTab('configuracion')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'configuracion'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurar WhatsApp Pizzería OZ</span>
          </button>

          {user && (
            <button
              onClick={() => {
                logout();
                setIsUserDashboardOpen(false);
              }}
              className="ml-auto flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium py-2 px-3 rounded hover:bg-rose-50 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* TAB 0: TARJETA DE FIDELIZACIÓN CLUB OZ */}
          {activeTab === 'fidelizacion' && (
            <div className="space-y-6 max-w-xl mx-auto py-2">
              <div className="text-center space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Programa de Fidelidad de Pizzería OZ
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-stone-900">
                  Tu Tarjeta Digital "8 Porciones"
                </h3>
                <p className="text-xs sm:text-sm text-stone-600">
                  Cada pedido confirmado te acredita 1 porción. Al juntar las 8 porciones, ganás una Pizzeta Muzzarella o Fainá 100% GRATIS.
                </p>
              </div>

              <LoyaltyCard />
            </div>
          )}

          {/* TAB 1: MIS PEDIDOS */}
          {activeTab === 'pedidos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-stone-500">
                  Historial de tus pedidos a Pizzería OZ, seguimiento y reenvío directo por WhatsApp.
                </p>
                {!user && (
                  <button
                    onClick={() => {
                      setIsUserDashboardOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="text-xs font-semibold text-stone-900 hover:underline"
                  >
                    Crear cuenta con Cédula
                  </button>
                )}
              </div>

              {userOrders.length > 0 ? (
                userOrders.map((order) => {
                  const isDelivery = order.deliveryMethod === 'delivery';
                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-xl border border-stone-200 bg-white shadow-2xs hover:border-stone-300 transition-all space-y-3"
                    >
                      {/* Top Header of the Order */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-stone-900 text-sm">
                              #{order.id}
                            </span>
                            {getStatusBadge(order.status, order.deliveryMethod)}
                          </div>
                          <div className="text-[11px] text-stone-400 mt-0.5">
                            CI: <strong className="font-mono text-stone-600">{order.customerCedula}</strong> · Realizado el {new Date(order.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-stone-500">Total</span>
                          <div className="font-mono font-bold text-stone-900 text-base tabular-nums">
                            ${order.total.toLocaleString('es-AR')}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Items & Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-600">
                        <div>
                          <span className="font-semibold text-stone-800 block mb-1">
                            Pizzas y productos pedidos:
                          </span>
                          <ul className="space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between items-start">
                                <div>
                                  <span>{item.quantity}x {item.productName}</span>
                                  {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                                    <span className="text-[10px] text-amber-800 block">
                                      Sabores: {item.selectedFlavors.join(', ')}
                                      {item.extraFlavorsCost ? ` (+$${item.extraFlavorsCost})` : ''}
                                    </span>
                                  )}
                                  {item.observations && (
                                    <span className="text-[10px] text-stone-600 block italic">
                                      📝 Obs: {item.observations}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono tabular-nums text-stone-700">
                                  ${item.subtotal.toLocaleString('es-AR')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-medium text-stone-800">
                            {isDelivery ? (
                              <>
                                <Truck className="w-3.5 h-3.5 text-amber-700" />
                                <span>Delivery a: {order.deliveryAddress} {order.apartment || ''}</span>
                              </>
                            ) : (
                              <>
                                <Store className="w-3.5 h-3.5 text-stone-700" />
                                <span>Retiro en mostrador: {storeSettings.storeAddress}</span>
                              </>
                            )}
                          </div>

                          <div className="text-stone-500">
                            Pago: <strong>{order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}</strong>
                            {order.cashAmountToPayWith && ` (Abona con $${order.cashAmountToPayWith})`}
                          </div>

                          {order.customerNotes && (
                            <div className="text-stone-500 italic pt-1">
                              "{order.customerNotes}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2.5">
                        {/* Simulation tool for status */}
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <span>Simular estado:</span>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                            className="bg-stone-100 border border-stone-200 text-stone-800 text-[11px] rounded px-2 py-1 font-medium focus:outline-none"
                          >
                            <option value="recibido">Recibido</option>
                            <option value="preparando">Al horno</option>
                            <option value="en_camino">En camino / Listo retiro</option>
                            <option value="entregado">Entregado</option>
                          </select>
                        </div>

                        {/* WhatsApp dispatch & receipt buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrderReceipt(order)}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Ver Ticket</span>
                          </button>

                          <a
                            href={getWhatsAppUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Reenviar a WhatsApp OZ</span>
                            <ExternalLink className="w-3 h-3 text-emerald-200" />
                          </a>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                  <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-stone-700">No tenés pedidos aún</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Cuando confirmes una compra en el carrito, se registrará aquí asociado a tu cédula.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MIS DATOS & CÉDULA */}
          {activeTab === 'perfil' && (
            <div className="max-w-xl">
              <p className="text-xs text-stone-500 mb-5">
                Datos de contacto vinculados a tu Cédula de Identidad para agilizar tus pedidos de pizzas y empanadas.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Número de Cédula de Identidad (CI)
                  </label>
                  <input
                    type="text"
                    required
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Teléfono / WhatsApp de Contacto
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Dirección de Entrega Predeterminada
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle y número"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Piso / Departamento
                    </label>
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="Ej: 4to B"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Barrio / Zona
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Centro"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>Guardar Cambios de Perfil</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CONFIGURACIÓN TIENDA (WHATSAPP RECEPTOR) */}
          {activeTab === 'configuracion' && (
            <div className="max-w-xl">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-5 text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span>Configuración para el dueño de Pizzería OZ ("oz")</span>
                </div>
                <p>
                  Podés configurar el número de WhatsApp receptor para que los pedidos de los clientes lleguen a tu propio teléfono.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Número de WhatsApp Receptor (código de país sin '+')
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={merchantPhone}
                      onChange={(e) => setMerchantPhone(e.target.value)}
                      placeholder="Ej: 5491158492011 o 59899123456"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Dirección del Local
                  </label>
                  <input
                    type="text"
                    required
                    value={storeAddressInput}
                    onChange={(e) => setStoreAddressInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Horarios de Atención
                  </label>
                  <input
                    type="text"
                    required
                    value={storeHoursInput}
                    onChange={(e) => setStoreHoursInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Datos de Pizzería OZ</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal Ticket Overlay */}
        {selectedOrderReceipt && (
          <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
              <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/aistudio/logo_d58d58db.jpg"
                    alt="Pizzería OZ"
                    className="w-10 h-10 rounded-xl bg-black border border-amber-500/40 object-contain p-0.5 shadow-xs"
                  />
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Comprobante #{selectedOrderReceipt.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrderReceipt(null)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Cliente:</span>
                  <span className="font-semibold">{selectedOrderReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Cédula (CI):</span>
                  <span className="font-mono font-medium">{selectedOrderReceipt.customerCedula}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Teléfono:</span>
                  <span>{selectedOrderReceipt.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Modalidad:</span>
                  <span className="font-medium">
                    {selectedOrderReceipt.deliveryMethod === 'delivery' ? 'Delivery a domicilio' : 'Retiro en local'}
                  </span>
                </div>
                {selectedOrderReceipt.deliveryAddress && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Dirección:</span>
                    <span>{selectedOrderReceipt.deliveryAddress}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Pago:</span>
                  <span>{selectedOrderReceipt.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}</span>
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <span className="font-semibold block mb-1">Detalle:</span>
                  {selectedOrderReceipt.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-stone-100 last:border-0">
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
                      <span className="font-mono tabular-nums font-medium">${i.subtotal.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-900">
                  <span>Total:</span>
                  <span className="font-mono tabular-nums">${selectedOrderReceipt.total.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderReceipt(null)}
                className="mt-6 w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
