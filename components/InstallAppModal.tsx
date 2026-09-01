import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Apple, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  CheckCircle2, 
  X, 
  Sparkles, 
  WifiOff, 
  Zap, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { Language } from '../types';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose, language = 'pt-BR' }) => {
  const isPT = language === 'pt-BR';
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Detect if already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    // Detect user OS/device
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setActiveTab('ios');
    } else if (/android/i.test(userAgent)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // If deferredPrompt is not available (e.g. iOS or already installed or browser menu needed)
      if (activeTab === 'ios') {
        alert(isPT 
          ? 'No Safari (iPhone/iPad): Toque no botão de Compartilhar (quadrado com seta para cima) e escolha "Adicionar à Tela de Início".' 
          : 'In Safari (iPhone/iPad): Tap the Share button (square with arrow up) and choose "Add to Home Screen".'
        );
      } else {
        alert(isPT 
          ? 'Para instalar: Abra o menu do seu navegador (três pontinhos ⋮ no topo ou base) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".' 
          : 'To install: Open your browser menu (three dots ⋮) and select "Install app" or "Add to Home Screen".'
        );
      }
    }
  };

  const handleCopyAppUrl = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center shrink-0">
              <img src="/icon-192.png" alt="Money Dashs" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight leading-tight">
                  {isPT ? 'Instalar Money Dashs' : 'Install Money Dashs'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/20 text-white border border-white/20">
                  App Mobile
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                {isPT ? 'Use direto no seu celular como um app nativo' : 'Use directly on your phone like a native app'}
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

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* STATUS IF ALREADY INSTALLED */}
          {isInstalled && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{isPT ? 'O Money Dashs já está instalado como aplicativo no seu dispositivo!' : 'Money Dashs is already installed on your device!'}</span>
            </div>
          )}

          {/* ADVANTAGES BADGES */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200/80 dark:border-gray-700/80 text-center">
              <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{isPT ? 'Ultra Rápido' : 'Ultra Fast'}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">{isPT ? 'Sem barras de URL' : 'Full screen'}</p>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200/80 dark:border-gray-700/80 text-center">
              <Smartphone className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{isPT ? '1 Toque' : '1 Tap'}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">{isPT ? 'Ícone na tela' : 'Home screen'}</p>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200/80 dark:border-gray-700/80 text-center">
              <WifiOff className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{isPT ? 'Modo Offline' : 'Offline Mode'}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">{isPT ? 'Cache inteligente' : 'Cached assets'}</p>
            </div>
          </div>

          {/* DEVICE PLATFORM TABS */}
          <div className="space-y-2">
            <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'android'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'ios'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'desktop'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>PC / Mac</span>
              </button>
            </div>

            {/* TAB 1: ANDROID INSTRUCTIONS */}
            {activeTab === 'android' && (
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-900/60 border border-blue-100 dark:border-blue-900/40 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  {isPT ? 'Passo a Passo no Android (Chrome / Samsung / Edge):' : 'Step-by-step on Android:'}
                </p>
                <ol className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>{isPT ? 'Toque no botão ' : 'Tap the '}<strong>{isPT ? '"Instalar Aplicativo"' : '"Install App"'}</strong>{isPT ? ' abaixo ou nos 3 pontinhos ' : ' button below or the 3 dots '}<strong className="inline-flex items-center"><MoreVertical className="w-3.5 h-3.5 inline" /></strong>{isPT ? ' no topo do navegador.' : ' in browser.'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>{isPT ? 'Selecione a opção ' : 'Select '}<strong>{isPT ? '"Instalar aplicativo"' : '"Install application"'}</strong>{isPT ? ' ou ' : ' or '}<strong>{isPT ? '"Adicionar à tela inicial"' : '"Add to Home screen"'}</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>{isPT ? 'Confirme em ' : 'Confirm on '}<strong>{isPT ? '"Instalar"' : '"Install"'}</strong>.{isPT ? ' O app aparecerá na grade de aplicativos do seu celular!' : ' The app will appear on your phone apps grid!'}</span>
                  </li>
                </ol>
              </div>
            )}

            {/* TAB 2: IOS INSTRUCTIONS */}
            {activeTab === 'ios' && (
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  {isPT ? 'Passo a Passo no iPhone / iPad (Safari):' : 'Step-by-step on iPhone / iPad (Safari):'}
                </p>
                <ol className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>{isPT ? 'Abra no navegador ' : 'Open in '}<strong>Safari</strong>{isPT ? ' e toque no botão de ' : ' and tap the '}<strong>{isPT ? 'Compartilhar' : 'Share'}</strong> <Share className="w-3.5 h-3.5 inline text-blue-600" />{isPT ? ' (barra inferior).' : ' (bottom bar).'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>{isPT ? 'Role para baixo e toque em ' : 'Scroll down and tap '}<strong>{isPT ? '"Adicionar à Tela de Início"' : '"Add to Home Screen"'}</strong> <PlusSquare className="w-3.5 h-3.5 inline text-gray-600" />.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>{isPT ? 'Toque em ' : 'Tap '}<strong>{isPT ? '"Adicionar"' : '"Add"'}</strong>{isPT ? ' no canto superior direito. Pronto!' : ' in the top right corner. Done!'}</span>
                  </li>
                </ol>
              </div>
            )}

            {/* TAB 3: DESKTOP INSTRUCTIONS */}
            {activeTab === 'desktop' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300">
                  {isPT ? 'Instalação no Computador (Chrome / Edge / Brave):' : 'Installation on Computer:'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {isPT 
                    ? 'Clique no ícone de instalação no final da barra de endereços do seu navegador ou no botão "Instalar Aplicativo" abaixo para ter uma janela dedicada e atalho no desktop.'
                    : 'Click the install icon in your browser address bar or the "Install App" button below to create a desktop app shortcut.'}
                </p>
              </div>
            )}
          </div>

          {/* SHARE/OPEN ON PHONE LINK */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-700 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                {isPT ? 'Link para abrir no celular' : 'Link to open on mobile'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {typeof window !== 'undefined' ? window.location.origin : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyAppUrl}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">{isPT ? 'Copiado!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isPT ? 'Copiar Link' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isPT ? 'Fechar' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isPT ? 'Instalar Aplicativo Agora' : 'Install App Now'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
