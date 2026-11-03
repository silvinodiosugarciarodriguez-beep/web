import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ContactSection: React.FC = () => {
  const { storeSettings, sendContactMessage } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Consulta sobre productos');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    sendContactMessage({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject,
      message: message.trim(),
    });

    setSubmitted(true);
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  const directWhatsAppHelpUrl = `https://api.whatsapp.com/send?phone=${storeSettings.whatsappNumber.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(
    `Hola ${storeSettings.storeName}, tengo una consulta general desde su sitio web.`
  )}`;

  return (
    <section id="contacto" className="py-16 bg-stone-100/60 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            Pizzería OZ · El Laboratorio de Sabores
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Formulario de Contacto & Sucursal
          </h2>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            ¿Tenés alguna consulta sobre nuestros sabores, pedidos para eventos o zonas de reparto? Envianos un mensaje o chateá directamente con nuestro mostrador por WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Formulario de Contacto */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-1">
              Envianos un Mensaje
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Completá el formulario y nuestro equipo te responderá en el día.
            </p>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">
                  ¡Mensaje enviado con éxito!
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Muchas gracias por contactarte. Te responderemos a la brevedad a tu correo o teléfono.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Sofía Herrera"
                      className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sofia@ejemplo.com"
                      className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+54 9 11..."
                      className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Motivo de Contacto
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                    >
                      <option value="Consulta sobre productos">Consulta sobre productos</option>
                      <option value="Dudas sobre envíos o delivery">Dudas sobre envíos o delivery</option>
                      <option value="Pedidos corporativos o eventos">Pedidos corporativos o eventos</option>
                      <option value="Venta mayorista o alianzas">Venta mayorista o alianzas</option>
                      <option value="Otro motivo">Otro motivo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Tu Mensaje *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Contanos en qué podemos ayudarte..."
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Consulta</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Local & Canales Directos */}
          <div id="local" className="lg:col-span-5 space-y-6">
            
            {/* Direct WhatsApp Callout */}
            <div className="bg-emerald-800 text-white p-6 sm:p-7 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                <MessageCircle className="w-4 h-4 text-emerald-300" />
                <span>Atención Inmediata</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-white">
                ¿Preferís chatear directamente?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Respondemos consultas en tiempo real de lunes a sábados. Escribinos para chequear stock o coordinar pedidos especiales.
              </p>
              <a
                href={directWhatsAppHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>Escribir por WhatsApp</span>
              </a>
            </div>

            {/* Store Information Card */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-sm space-y-4 text-xs text-stone-600">
              <h3 className="text-base font-serif font-bold text-stone-900 pb-2 border-b border-stone-100">
                Información de Nuestro Local
              </h3>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-800">Dirección para retiros:</strong>
                  <span>{storeSettings.storeAddress}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-800">Horarios de atención:</strong>
                  <span>{storeSettings.storeHours}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-800">Teléfono comercial:</strong>
                  <span>+{storeSettings.whatsappNumber}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-stone-400">
                * Todos los pedidos con opción "Retiro en local" se preparan y se avisa por WhatsApp cuando están listos para buscar.
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
