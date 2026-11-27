import React, { useState } from 'react';
import {
  X,
  Package,
  User as UserIcon,
  MessageCircle,
  Truck,
  Store,
  LogOut,
  ExternalLink,
  Receipt,
  Save,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Lock,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { LoyaltyCard } from './LoyaltyCard';

export const UserDashboard: React.FC = () => {
  const {
    user,
    logout,
    userOrders,
    updateProfile,
    changeUserPassword,
    reorderFromOrder,
    storeSettings,
    getWhatsAppUrl,
    isUserDashboardOpen,
    setIsUserDashboardOpen,
    dashboardInitialTab,
    setIsAuthModalOpen,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'pedidos' | 'fidelizacion' | 'perfil'>(dashboardInitialTab);
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<Order | null>(null);

  // Profile Edit State (including Cédula)
  const [name, setName] = useState(user?.name && !user.name.startsWith('Cliente CI ') && user.name !== 'Cliente OZ' ? user.name : '');
  const [cedula, setCedula] = useState(user?.cedula || '');
  const [phone, setPhone] = useState(user?.phone && !user.phone.includes('5555-0000') ? user.phone : '');
  const [address, setAddress] = useState(
    user?.address && user.address !== 'Dirección por definir' && user.address !== 'Retiro en local'
      ? user.address
      : ''
  );
  const [city, setCity] = useState(
    user?.city && user.city.trim().toLowerCase() !== 'buenos aires' ? user.city : 'Melo'
  );
  const [apartment, setApartment] = useState(user?.apartment || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showChangePass, setShowChangePass] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  React.useEffect(() => {
    setActiveTab(dashboardInitialTab);
  }, [dashboardInitialTab]);

  React.useEffect(() => {
    if (user) {
      setName(user.name && !user.name.startsWith('Cliente CI ') && user.name !== 'Cliente OZ' ? user.name : '');
      setCedula(user.cedula || '');
      setPhone(user.phone && !user.phone.includes('5555-0000') ? user.phone : '');
      setAddress(
        user.address && user.address !== 'Dirección por definir' && user.address !== 'Retiro en local'
          ? user.address
          : ''
      );
      setCity(
        user.city && user.city.trim() && user.city.trim().toLowerCase() !== 'buenos aires'
          ? user.city
          : 'Melo'
      );
      setApartment(user.apartment || '');
    }
  }, [user]);

  if (!isUserDashboardOpen) return null;

  const isProfileIncomplete = Boolean(
    user &&
      (!name.trim() || !cedula.trim() || !phone.trim() || !address.trim() || !city.trim())
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cedula.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      showToast('Completá tu nombre, cédula, teléfono, dirección y barrio.');
      return;
    }
    updateProfile({
      name: name.trim(),
      cedula: cedula.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim() || 'Melo',
      apartment: apartment.trim(),
    });
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (newPassword.length < 4) {
      setPasswordFeedback({ type: 'error', text: 'La nueva contraseña debe tener al menos 4 caracteres.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }
    const res = changeUserPassword(currentPassword, newPassword);
    if (!res.ok) {
      setPasswordFeedback({ type: 'error', text: res.error || 'No se pudo cambiar la contraseña.' });
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordFeedback({ type: 'success', text: 'Contraseña actualizada correctamente.' });
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
                            <span className="text-emerald-800 bg-emerald-100 text-xs px-2.5 py-1 rounded-md font-medium">
                              Enviado
                            </span>
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
                      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-end gap-2.5">
                        {/* Reorder, Receipt & WhatsApp buttons */}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => reorderFromOrder(order)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Volver a pedir</span>
                          </button>

                          <button
                            onClick={() => setSelectedOrderReceipt(order)}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
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
              {isProfileIncomplete && (
                <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Completá tus datos para pedir más rápido</strong>
                    <span>
                      Necesitamos tu nombre completo, teléfono/WhatsApp, dirección y barrio para entregar o coordinar tus pedidos.
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-stone-500 mb-5">
                Datos de contacto vinculados a tu Cédula de Identidad para agilizar tus pedidos de pizzas y empanadas.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Nombre y Apellido Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Marcelo Silva"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Número de Cédula de Identidad (CI) *
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
                    Teléfono / WhatsApp de Contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 099 123 456"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Dirección de Entrega Predeterminada *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle y número (ej: Aparicio Saravia 740)"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Piso / Departamento / Esquina
                    </label>
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="Ej: Casa esquina / Apto 2"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Barrio / Zona *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Melo"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>Guardar Cambios de Perfil</span>
                  </button>
                </div>
              </form>

              {/* Change Password Section */}
              {user && user.id !== 'usr-demo-pizzeria' && (
                <div className="mt-8 pt-6 border-t border-stone-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <h3 className="text-sm font-bold text-stone-900">Cambiar Contraseña</h3>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">
                    Actualizá la contraseña con la que ingresás usando tu Cédula.
                  </p>

                  <form onSubmit={handleChangePasswordSubmit} className="space-y-3 bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Contraseña actual *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowChangePass((v) => !v)}
                          className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                        >
                          {showChangePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showChangePass ? 'Ocultar claves' : 'Ver claves'}</span>
                        </button>
                      </div>
                      <input
                        type={showChangePass ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (passwordFeedback) setPasswordFeedback(null);
                        }}
                        placeholder="Ingresá tu contraseña actual"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Nueva contraseña * (4+ caracteres)
                        </label>
                        <input
                          type={showChangePass ? 'text' : 'password'}
                          required
                          minLength={4}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (passwordFeedback) setPasswordFeedback(null);
                          }}
                          placeholder="4 o más caracteres (puede ser larga)"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Repetir nueva contraseña *
                        </label>
                        <input
                          type={showChangePass ? 'text' : 'password'}
                          required
                          minLength={4}
                          value={confirmNewPassword}
                          onChange={(e) => {
                            setConfirmNewPassword(e.target.value);
                            if (passwordFeedback) setPasswordFeedback(null);
                          }}
                          placeholder="Repetí tu nueva contraseña"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {passwordFeedback && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                          passwordFeedback.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        {passwordFeedback.type === 'success' ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{passwordFeedback.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Actualizar Contraseña</span>
                    </button>
                  </form>
                </div>
              )}
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
