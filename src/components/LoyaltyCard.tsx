import React, { useState } from 'react';
import {
  Pizza,
  Sparkles,
  Gift,
  Check,
  Award,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Flame,
  Star,
  Info,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { LoyaltyData } from '../types';

interface LoyaltyCardProps {
  compact?: boolean;
  onRedeemClick?: () => void;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ compact = false, onRedeemClick }) => {
  const { user, storeSettings, isRewardRedeemActive, setIsRewardRedeemActive, showToast } = useStore();
  const [activeView, setActiveView] = useState<'tarjeta' | 'rueda'>('tarjeta');
  const [showRulesModal, setShowRulesModal] = useState(false);

  if (!user) return null;

  // Extract clean card number from Cédula
  const cleanCedula = user.cedula.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
  const defaultCardNumber = `OZ-${cleanCedula.slice(0, 4)}-${cleanCedula.slice(4)}`;

  const loyalty: LoyaltyData = {
    stampsCount: user.loyalty?.stampsCount ?? 3,
    totalStampsEarned: user.loyalty?.totalStampsEarned ?? 3,
    completedCards: user.loyalty?.completedCards ?? 0,
    unclaimedRewards: user.loyalty?.unclaimedRewards ?? (user.loyalty?.stampsCount === 8 ? 1 : 0),
    tier:
      user.loyalty?.tier ??
      (user.loyalty?.totalStampsEarned && user.loyalty.totalStampsEarned >= 16
        ? 'maestro_vip'
        : user.loyalty?.totalStampsEarned && user.loyalty.totalStampsEarned >= 8
        ? 'explorador'
        : 'amigo'),
    cardNumber: user.loyalty?.cardNumber ?? defaultCardNumber,
  };

  const currentStamps = loyalty.stampsCount % 8 || (loyalty.stampsCount >= 8 ? 8 : 0);
  const hasPendingReward = loyalty.unclaimedRewards > 0 || loyalty.stampsCount >= 8;
  const missingStamps = Math.max(0, 8 - currentStamps);
  const progressPercent = Math.min(100, Math.round((currentStamps / 8) * 100));

  const tierConfig = {
    amigo: {
      name: 'Amigo OZ',
      badge: '🥉 Socio Amigo',
      color: 'from-amber-500 to-amber-700',
      tagline: '1ª porción de regalo de bienvenida',
    },
    explorador: {
      name: 'Explorador del Sabor',
      badge: '🥈 Cliente Frecuente',
      color: 'from-stone-400 via-amber-400 to-yellow-500',
      tagline: 'Descuentos exclusivos y atención ágil',
    },
    maestro_vip: {
      name: 'Maestro VIP OZ',
      badge: '🥇 VIP Preferencial',
      color: 'from-yellow-300 via-amber-400 to-orange-500',
      tagline: 'Prioridad máxima en cocina y delivery',
    },
  };

  const currentTier = tierConfig[loyalty.tier] || tierConfig.amigo;

  // Geometry for 8-slice SVG Pizza Wheel
  const cx = 120;
  const cy = 120;
  const outerR = 108;
  const innerR = 42;

  const getSlicePath = (index: number) => {
    const startAngle = -90 + index * 45;
    const endAngle = -90 + (index + 1) * 45;
    const radStart = (startAngle * Math.PI) / 180;
    const radEnd = (endAngle * Math.PI) / 180;

    const x1 = cx + outerR * Math.cos(radStart);
    const y1 = cy + outerR * Math.sin(radStart);
    const x2 = cx + outerR * Math.cos(radEnd);
    const y2 = cy + outerR * Math.sin(radEnd);

    const x3 = cx + innerR * Math.cos(radEnd);
    const y3 = cy + innerR * Math.sin(radEnd);
    const x4 = cx + innerR * Math.cos(radStart);
    const y4 = cy + innerR * Math.sin(radStart);

    return `M ${x4} ${y4} L ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`;
  };

  const getSliceMidPoint = (index: number, r: number) => {
    const midAngle = -90 + (index + 0.5) * 45;
    const rad = (midAngle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* View Switcher Tabs (Tarjeta VIP vs Rueda de Pizza 3D) */}
      <div className="flex items-center justify-between bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 text-xs">
        <button
          onClick={() => setActiveView('tarjeta')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
            activeView === 'tarjeta'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Tarjeta VIP Dorada</span>
        </button>

        <button
          onClick={() => setActiveView('rueda')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
            activeView === 'rueda'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Pizza className="w-4 h-4" />
          <span>Rueda de 8 Porciones</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* VISTA 1: LA TARJETA METÁLICA DORADA VIP */}
      {/* ============================================================== */}
      {activeView === 'tarjeta' && (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-7 bg-gradient-to-br from-[#1c1917] via-[#0c0a09] to-[#292010] border-2 border-amber-400/90 text-white select-none transition-transform duration-300 hover:scale-[1.01] group">
          {/* Hologram sweep sheen effect */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-amber-200/10 to-transparent rotate-45 group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Official Medallion, Title & Hologram Seal */}
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-amber-400 rounded-full blur-xs opacity-80 animate-pulse" />
                <img
                  src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
                  alt="Pizzería OZ Logo"
                  className="relative w-12 h-12 rounded-full bg-black border border-amber-400 p-0.5 object-contain shadow-md"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Club Fidelidad OZ</span>
                </div>
                <h3 className="font-serif font-black text-lg text-white leading-tight">
                  Tarjeta 8 Porciones
                </h3>
              </div>
            </div>

            {/* Hologram Security Seal */}
            <div className="relative flex flex-col items-end">
              <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-400/60 shadow-xs flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-300 fill-amber-300 animate-spin" />
                <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                  {currentTier.badge}
                </span>
              </div>
              <span className="text-[9px] text-stone-400 font-mono mt-1">Socio Oficial OZ</span>
            </div>
          </div>

          {/* EMV Gold Chip & Contactless Waves */}
          <div className="relative z-10 my-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Golden Smart Microchip with authentic circuits */}
              <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border border-amber-100/80 shadow-md p-1 relative overflow-hidden flex items-center justify-center">
                <div className="w-full h-full border border-amber-700/40 rounded-xs grid grid-cols-3 gap-0.5 p-0.5">
                  <div className="bg-amber-600/30 rounded-2xs" />
                  <div className="bg-amber-600/30 rounded-2xs" />
                  <div className="bg-amber-600/30 rounded-2xs" />
                  <div className="bg-amber-600/30 rounded-2xs" />
                  <div className="bg-amber-600/40 rounded-2xs border border-amber-800/40" />
                  <div className="bg-amber-600/30 rounded-2xs" />
                </div>
              </div>

              {/* NFC Contactless Wave icon */}
              <div className="flex items-center text-amber-300/80" title="Identificación contactless y QR">
                <Radio className="w-5 h-5 rotate-90" />
              </div>
            </div>

            {/* Embossed Card Number */}
            <div className="font-mono text-sm sm:text-base tracking-[0.2em] text-amber-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {loyalty.cardNumber}
            </div>
          </div>

          {/* Slices Ticker Grid (8 Porciones) */}
          <div className="relative z-10 p-3.5 bg-black/50 rounded-2xl border border-amber-500/30 backdrop-blur-xs my-2">
            <div className="flex items-center justify-between mb-2.5 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Pizza className="w-4 h-4 text-amber-400" />
                <span>Porciones Acumuladas ({currentStamps}/8)</span>
              </span>
              <span className="font-mono text-amber-300 font-bold">
                {hasPendingReward ? '¡Completada!' : `Faltan ${missingStamps}`}
              </span>
            </div>

            {/* 8 Porciones Mini Badges */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
                const isStamped = s <= currentStamps;
                const isNext = s === currentStamps + 1;
                return (
                  <div
                    key={s}
                    className={`relative flex flex-col items-center justify-center h-12 rounded-xl transition-all duration-300 ${
                      isStamped
                        ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 scale-105'
                        : isNext
                        ? 'bg-amber-950/40 border-2 border-dashed border-amber-400 text-amber-300 animate-pulse'
                        : 'bg-stone-900/90 border border-stone-800 text-stone-600'
                    }`}
                  >
                    {isStamped ? (
                      <>
                        <Pizza className="w-4 h-4 fill-stone-950 text-stone-950" />
                        <span className="text-[10px] font-black leading-none mt-0.5">#{s}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-mono font-bold">#{s}</span>
                        {isNext && <span className="text-[8px] font-extrabold uppercase mt-0.5">Próx</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Animated Progress Bar */}
            <div className="mt-3 pt-2.5 border-t border-stone-800/80">
              <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                <span>Progreso hacia Pizzeta Gratis</span>
                <span className="font-mono text-amber-300 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-900 overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Member Card Footer: Cardholder & QR verification */}
          <div className="relative z-10 pt-3 flex items-end justify-between text-xs">
            <div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wider">Titular de la Tarjeta</div>
              <div className="font-bold text-white tracking-wide text-sm sm:text-base">
                {user.name}
              </div>
              <div className="text-[11px] text-amber-300/90 font-mono">
                Cédula: {user.cedula}
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-2 bg-stone-950/80 border border-amber-500/30 rounded-xl">
              <QrCode className="w-6 h-6 text-amber-400" />
              <div className="text-[9px] text-stone-400 leading-tight hidden sm:block">
                Válida en Local<br />& WhatsApp
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 2: LA RUEDA DE 8 PORCIONES ILUSTRADA (PIZZA REAL) */}
      {/* ============================================================== */}
      {activeView === 'rueda' && (
        <div className="rounded-3xl p-6 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border-2 border-amber-400/80 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 mb-4">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Corte Tradicional en 8 Porciones</span>
            </div>
            <h3 className="font-serif font-black text-xl text-white mt-0.5">
              Completá tu Pizza OZ
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Cada pedido confirmado enciende una porción. ¡Al completar las 8 ganás tu pizza gratis!
            </p>
          </div>

          {/* SVG Pizza Wheel */}
          <div className="relative z-10 flex items-center justify-center py-2">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 drop-shadow-[0_10px_25px_rgba(245,158,11,0.25)]">
              <svg viewBox="0 0 240 240" className="w-full h-full">
                <defs>
                  {/* Cheese Melted Gradient */}
                  <linearGradient id="cheeseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>

                  {/* Empty Slice Gradient */}
                  <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1c1917" />
                    <stop offset="100%" stopColor="#0c0a09" />
                  </linearGradient>

                  {/* Gold Center Medallion Gradient */}
                  <radialGradient id="centerGoldGrad">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="70%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </radialGradient>
                </defs>

                {/* Outer Oven Wood Board Effect */}
                <circle cx={cx} cy={cy} r="116" fill="#141210" stroke="#78350f" strokeWidth="4" />

                {/* The 8 Slices */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                  const sliceNum = idx + 1;
                  const isEarned = sliceNum <= currentStamps;
                  const isNext = sliceNum === currentStamps + 1;
                  const labelPt = getSliceMidPoint(idx, 72);
                  const pepPt1 = getSliceMidPoint(idx, 56);
                  const pepPt2 = getSliceMidPoint(idx, 88);

                  return (
                    <g key={idx} className="transition-all duration-300">
                      {/* Pizza Sector Path */}
                      <path
                        d={getSlicePath(idx)}
                        fill={isEarned ? 'url(#cheeseGrad)' : 'url(#emptyGrad)'}
                        stroke={isEarned ? '#b45309' : isNext ? '#f59e0b' : '#292524'}
                        strokeWidth={isNext ? '2' : '1.5'}
                        strokeDasharray={!isEarned && !isNext ? '3 3' : 'none'}
                        className={`transition-all duration-300 ${
                          isEarned ? 'filter drop-shadow(0 2px 3px rgba(0,0,0,0.4))' : ''
                        }`}
                      />

                      {/* Toppings if earned: Pepperoni slice dots */}
                      {isEarned && (
                        <>
                          <circle cx={pepPt1.x} cy={pepPt1.y} r="5" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1" />
                          <circle cx={pepPt2.x} cy={pepPt2.y} r="4" fill="#b91c1c" />
                        </>
                      )}

                      {/* Slice Number Badge */}
                      <circle
                        cx={labelPt.x}
                        cy={labelPt.y}
                        r="10"
                        fill={isEarned ? '#0c0a09' : '#292524'}
                        stroke={isEarned ? '#fbbf24' : '#44403c'}
                        strokeWidth="1.5"
                      />
                      <text
                        x={labelPt.x}
                        y={labelPt.y + 3.5}
                        textAnchor="middle"
                        fill={isEarned ? '#fbbf24' : '#78716c'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        #{sliceNum}
                      </text>
                    </g>
                  );
                })}

                {/* Center Hub Golden Medallion */}
                <circle cx={cx} cy={cy} r="40" fill="url(#centerGoldGrad)" stroke="#fef08a" strokeWidth="2.5" />
                <circle cx={cx} cy={cy} r="35" fill="#0c0a09" stroke="#92400e" strokeWidth="1.5" />

                {/* Center Content */}
                <text x={cx} y={cy - 12} textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="900" letterSpacing="1">
                  CLUB OZ
                </text>
                <text x={cx} y={cy + 8} textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="900" fontFamily="monospace">
                  {currentStamps}/8
                </text>
                <text x={cx} y={cy + 20} textAnchor="middle" fill="#a8a29e" fontSize="7" fontWeight="bold">
                  PORCIONES
                </text>
              </svg>
            </div>
          </div>

          <div className="relative z-10 mt-3 text-xs text-stone-300">
            {hasPendingReward ? (
              <span className="text-emerald-400 font-bold">
                🎉 ¡Felicidades! Tenés 1 Pizzeta Muzzarella o Fainá gratis disponible.
              </span>
            ) : (
              <span>
                Llevás <strong className="text-amber-400">{currentStamps} de 8 porciones</strong>. ¡Te faltan{' '}
                <strong className="text-amber-300">{missingStamps} pedidos</strong> para tu premio gratis!
              </span>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BANNER DE PREMIO CANJEABLE (CUANDO COMPLETA 8 SELLOS) */}
      {/* ============================================================== */}
      {hasPendingReward && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900/80 to-stone-900 border-2 border-emerald-400 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/25 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <Gift className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>¡Premio Disponible!</span>
              </div>
              <h4 className="font-serif font-bold text-base sm:text-lg text-white">
                1 Pizzeta Muzzarella o Fainá Gratis
              </h4>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Activá el canje para descontar -$270 automáticamente en tu próximo pedido.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsRewardRedeemActive(!isRewardRedeemActive);
              showToast(
                !isRewardRedeemActive
                  ? '✓ ¡Premio de Tarjeta activado! Se descontará -$270 en el total de tu pedido.'
                  : 'Premio desactivado para usar en otro pedido.'
              );
            }}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
              isRewardRedeemActive
                ? 'bg-emerald-400 text-stone-950 ring-2 ring-emerald-200'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRewardRedeemActive ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Premio Activado (-$270)</span>
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                <span>Canjear en mi Pedido</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* BENEFICIOS DEL CLUB Y REGLAS */}
      {/* ============================================================== */}
      {!compact && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 text-stone-300 text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-xs">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Beneficios Exclusivos Club OZ</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              100% Automático
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800/80">
              <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <Pizza className="w-3.5 h-3.5" />
                <span>1 Pedido = 1 Porción</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Cada vez que confirmás un pedido por WhatsApp se acredita una porción en tu tarjeta.
              </p>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800/80">
              <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <Gift className="w-3.5 h-3.5" />
                <span>8 Porciones = Gratis</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Al llegar al 8º sello ganás 1 Pizzeta Muzzarella o Fainá tradicional de regalo.
              </p>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800/80">
              <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sin Extravíos</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                No necesitás llevar un cartón; tus porciones están seguras en la nube asociadas a tu Cédula.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
