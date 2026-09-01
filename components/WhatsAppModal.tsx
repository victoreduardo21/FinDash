import React, { useState } from 'react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { X, MessageSquare, Send, HelpCircle, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { Language } from '../types';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

const SUPPORT_PHONE = '5513996104848';

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, language = 'pt-BR' }) => {
  const isPT = language === 'pt-BR';
  const [customMsg, setCustomMsg] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  if (!isOpen) return null;

  const topics = [
    {
      id: 'support',
      title: isPT ? 'Suporte Técnico' : 'Technical Support',
      desc: isPT ? 'Ajuda com lançamentos, cartões ou configurações' : 'Help with entries, cards or settings',
      defaultMsg: isPT ? 'Olá! Preciso de ajuda técnica com o sistema Money Dashs.' : 'Hello! I need technical help with Money Dashs.',
      icon: '🛠️'
    },
    {
      id: 'plan',
      title: isPT ? 'Planos & Upgrade VIP' : 'Plans & VIP Upgrade',
      desc: isPT ? 'Tirar dúvidas sobre planos, limites e vantagens' : 'Questions about plans, limits and perks',
      defaultMsg: isPT ? 'Olá! Gostaria de mais informações sobre os planos e upgrade no Money Dashs.' : 'Hello! I would like more information about plans and upgrade in Money Dashs.',
      icon: '💎'
    },
    {
      id: 'subscription',
      title: isPT ? 'Assinatura & Faturamento' : 'Subscription & Billing',
      desc: isPT ? 'Dúvidas sobre pagamentos, renovação ou troca' : 'Billing questions, renewals or change',
      defaultMsg: isPT ? 'Olá! Gostaria de falar sobre a assinatura da minha conta Money Dashs.' : 'Hello! I would like to talk about my Money Dashs account subscription.',
      icon: '💳'
    },
    {
      id: 'custom',
      title: isPT ? 'Falar com Atendente' : 'Talk to an Agent',
      desc: isPT ? 'Dúvidas gerais, sugestões ou parcerias' : 'General questions, suggestions or partnerships',
      defaultMsg: isPT ? 'Olá! Gostaria de falar com o atendimento do Money Dashs.' : 'Hello! I would like to talk with Money Dashs support.',
      icon: '💬'
    }
  ];

  const handleSendMessage = (msgToSend?: string) => {
    const text = msgToSend || customMsg || (isPT ? 'Olá! Gostaria de atendimento no Money Dashs.' : 'Hello! I would like support with Money Dashs.');
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${SUPPORT_PHONE}?text=${encoded}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <WhatsAppIcon className="w-7 h-7 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight leading-tight">
                  {isPT ? 'Atendimento WhatsApp' : 'WhatsApp Support'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                {isPT ? 'GTS Global Tech Software • Suporte Oficial' : 'GTS Global Tech Software • Official Support'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {isPT 
              ? 'Selecione um dos assuntos rápidos abaixo ou digite sua mensagem para iniciar uma conversa direta pelo WhatsApp:'
              : 'Select a quick topic below or type your message to start a direct WhatsApp chat:'}
          </p>

          {/* QUICK TOPIC BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTopic(t.id);
                  setCustomMsg(t.defaultMsg);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                  selectedTopic === t.id
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/30'
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5">{t.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                    {t.title}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5 line-clamp-2">
                    {t.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* MESSAGE INPUT */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>{isPT ? 'Sua Mensagem' : 'Your Message'}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold lowercase">
                wa.me/+55 (13) 99610-4848
              </span>
            </label>
            <textarea
              rows={3}
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder={isPT ? 'Digite o que você precisa ou selecione uma opção acima...' : 'Type what you need or select an option above...'}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {/* TRUST BADGE */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-700/80 flex items-center gap-2.5 text-[11px] text-gray-600 dark:text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isPT 
                ? 'Canal verificado GTS Global Tech. Atendimento rápido e seguro.'
                : 'Verified GTS Global Tech channel. Fast and secure support.'}
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isPT ? 'Cancelar' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={() => handleSendMessage()}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isPT ? 'Abrir no WhatsApp' : 'Open in WhatsApp'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>

      </div>
    </div>
  );
};
