
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { BellIcon } from './icons/BellIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MenuIcon } from './icons/MenuIcon';
import { User, CalendarEvent, Page, Language, Subscription, CreditCard, CreditTransaction, SystemNotification } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { HelpCircle, Megaphone, X, Smartphone, MessageCircle } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

interface HeaderProps {
    onLogout: () => void;
    onNewTransaction: () => void;
    currentUser: User | null;
    setActivePage: (page: Page) => void;
    onSearch: (query: string) => void;
    tasks: CalendarEvent[];
    language: Language;
    onLanguageChange: (lang: Language) => void;
    toggleSidebar: () => void;
    subscriptions?: Subscription[];
    creditCards?: CreditCard[];
    creditTransactions?: CreditTransaction[];
    onStartTour?: () => void;
    systemNotifications?: SystemNotification[];
    onOpenInstallApp?: () => void;
    onOpenWhatsApp?: () => void;
}

const getInvoiceDueDate = (txDateStr: string, closingDay: number, dueDay: number): string => {
    if (!txDateStr) return '';
    const cleanDate = txDateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return txDateStr;
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]); // 1-indexed
    const day = parseInt(parts[2]);

    // Se o dia da compra for maior ou igual ao dia de fechamento, cai no vencimento do mes SEGUINTE
    if (day >= closingDay) {
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }

    const targetDay = String(dueDay).padStart(2, '0');
    const targetMonth = String(month).padStart(2, '0');
    return `${year}-${targetMonth}-${targetDay}`;
};

const Header: React.FC<HeaderProps> = ({ 
    onLogout, 
    onNewTransaction, 
    currentUser, 
    setActivePage, 
    onSearch, 
    tasks, 
    language, 
    onLanguageChange, 
    toggleSidebar,
    subscriptions = [],
    creditCards = [],
    creditTransactions = [],
    onStartTour,
    systemNotifications = [],
    onOpenInstallApp,
    onOpenWhatsApp
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  const [selectedSystemNotif, setSelectedSystemNotif] = useState<any | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setIsPushEnabled(Notification.permission === 'granted' && localStorage.getItem('gts_device_notifications') === 'true');
    }
  }, []);

  const handleToggleDeviceNotifications = async () => {
    if (!('Notification' in window)) {
      alert(language === 'pt-BR' ? 'Seu navegador não suporta notificações de sistema.' : 'Your browser does not support system notifications.');
      return;
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('gts_device_notifications', 'true');
        setIsPushEnabled(true);
        new Notification(language === 'pt-BR' ? 'Notificações Ativas! 🎉' : 'Notifications Enabled! 🎉', {
          body: language === 'pt-BR' ? 'Agora você receberá avisos importantes do sistema.' : 'Now you will receive important system notifications.',
        });
      } else {
        localStorage.setItem('gts_device_notifications', 'false');
        setIsPushEnabled(false);
      }
    } else if (Notification.permission === 'denied') {
      alert(language === 'pt-BR' 
        ? 'As notificações foram bloqueadas no seu navegador. Ative as permissões nas configurações do site no seu navegador.' 
        : 'Notifications were blocked in your browser. Enable permissions in your browser settings.');
    } else {
      const nextState = !isPushEnabled;
      localStorage.setItem('gts_device_notifications', nextState ? 'true' : 'false');
      setIsPushEnabled(nextState);
      if (nextState) {
        new Notification(language === 'pt-BR' ? 'Notificações Ativas! 🚀' : 'Notifications Active! 🚀', {
          body: language === 'pt-BR' ? 'As notificações do sistema voltaram a ficar ativas.' : 'System notifications are active again.',
        });
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismissNotification = (id: string) => {
      try {
          const saved = localStorage.getItem('gts_agenda_checked_virtuals');
          let checkedVirtuals: string[] = [];
          if (saved) checkedVirtuals = JSON.parse(saved);
          if (!checkedVirtuals.includes(id)) {
              checkedVirtuals.push(id);
              localStorage.setItem('gts_agenda_checked_virtuals', JSON.stringify(checkedVirtuals));
              setDismissedNotifs(prev => [...prev, id]);
          }
      } catch (err) {
          console.error(err);
      }
  };
  
  const notifications = useMemo(() => {
      const list: { id: string; description: string; date: string; type: string; title?: string }[] = [];
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Retrieve checked virtuals
      let checkedVirtuals: string[] = [];
      try {
          const saved = localStorage.getItem('gts_agenda_checked_virtuals');
          if (saved) checkedVirtuals = JSON.parse(saved);
      } catch {}

      const allDismissed = [...checkedVirtuals, ...dismissedNotifs];

      // 1. Manual events
      (tasks || []).forEach(task => {
          const virtualKey = `manual-${task.id}`;
          if (!task.done && task.date <= todayStr && !allDismissed.includes(virtualKey)) {
              list.push({
                  id: virtualKey,
                  type: 'manual',
                  description: task.description,
                  date: task.date.slice(0, 10)
              });
          }
      });

      const curYear = d.getFullYear();
      const curMonth = String(d.getMonth() + 1).padStart(2, '0');

      // Helper to calculate days diff
      const getDaysDifference = (dateStr: string) => {
          if (!dateStr) return 999;
          const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
          const parts = cleanDate.split('-');
          if (parts.length !== 3) return 999;
          const [y, m, dNum] = parts.map(Number);
          const targetDate = new Date(y, m - 1, dNum);
          targetDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffTime = targetDate.getTime() - today.getTime();
          return Math.round(diffTime / (1000 * 60 * 60 * 24));
      };

      // 2. Active subscriptions due within next 3 days of current month
      (subscriptions || []).forEach(sub => {
          if (sub.status === 'ACTIVE') {
              let dayNum = sub.dueDay;
              if (dayNum < 1) dayNum = 1;
              if (dayNum > 28) dayNum = 28;
              const dayStr = String(dayNum).padStart(2, '0');
              const eventDate = `${curYear}-${curMonth}-${dayStr}`;
              const virtualKey = `sub-${sub.id}-${curYear}-${curMonth}`;
              if (!allDismissed.includes(virtualKey)) {
                  const diff = getDaysDifference(eventDate);
                  if (diff <= 3) {
                      list.push({
                          id: virtualKey,
                          type: 'subscription',
                          description: `${sub.description}`,
                          date: eventDate
                      });
                  }
              }
          }
      });

      // 3. Credit Card bills due within next 3 days of current month
      (creditCards || []).forEach(card => {
          const activeCardTxs = (creditTransactions || []).filter(tx => tx.cardId === card.id && tx.status !== 'PAID');
          
          // Map each active transaction to its correct physical invoice due date
          const dueDatesMap: Record<string, number> = {};
          activeCardTxs.forEach(tx => {
              const calculatedDueDate = getInvoiceDueDate(tx.date, card.closingDay || 10, card.dueDay || 15);
              dueDatesMap[calculatedDueDate] = (dueDatesMap[calculatedDueDate] || 0) + tx.amount;
          });

          Object.entries(dueDatesMap).forEach(([eventDate, totalDue]) => {
              const [y, m] = eventDate.split('-');
              const virtualKey = `card-${card.id}-${y}-${m}`;

              if (totalDue > 0 && !allDismissed.includes(virtualKey)) {
                  const diff = getDaysDifference(eventDate);
                  if (diff <= 3) {
                      list.push({
                          id: virtualKey,
                          type: 'creditCard',
                          description: `${language === 'pt-BR' ? 'Fatura Vencendo ' : 'Invoice Due '}${card.name}`,
                          date: eventDate
                      });
                  }
              }
          });
      });

      // 4. Overdrafts
      (creditTransactions || []).forEach(tx => {
          if (tx.isOverdraft && tx.status !== 'PAID') {
              const virtualKey = `overdraft-${tx.id}`;
              if (!allDismissed.includes(virtualKey)) {
                  list.push({
                      id: virtualKey,
                      type: 'overdraft',
                      description: `${language === 'pt-BR' ? 'Cheque Especial: ' : 'Overdraft: '}${tx.description}`,
                      date: tx.date.slice(0, 10)
                  });
              }
          }
      });

      // 5. System Messages / Announcements from Admin
      (systemNotifications || []).forEach(notif => {
          const virtualKey = `sys-${notif.id}`;
          if (!allDismissed.includes(virtualKey)) {
              list.push({
                  id: virtualKey,
                  type: 'system',
                  title: notif.title,
                  description: notif.message,
                  date: notif.createdAt
              });
          }
      });

      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks, subscriptions, creditCards, creditTransactions, systemNotifications, language, dismissedNotifs]);

  const userInitials = useMemo(() => {
      const name = currentUser?.name || 'U';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [currentUser]);

  return (
    <header className="flex items-center justify-between px-4 py-2 md:px-6 md:py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 z-40 transition-colors sticky top-0">
      {/* Lado Esquerdo: Menu Burger */}
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-400 hover:text-blue-600 transition-colors lg:hidden">
            <MenuIcon className="h-7 w-7" />
        </button>

        {/* Busca: Oculta no mobile para focar no layout de App */}
        <div className="relative hidden lg:block ml-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </span>
          <input
            className="w-48 xl:w-64 pl-9 pr-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            type="text"
            placeholder={language === 'pt-BR' ? "Buscar..." : "Search..."}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      
      {/* Lado Direito: Ações rápidas igual à imagem 2 */}
      <div className="flex items-center gap-2 md:gap-4">
         {/* Botão de Nova Transação Circular no Mobile */}
         <button 
            id="tour-btn-new-transaction"
            onClick={onNewTransaction} 
            className="flex items-center justify-center bg-blue-600 text-white w-10 h-10 md:w-auto md:h-auto md:px-5 md:py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-90"
          >
            <PlusIcon className="h-6 w-6 md:mr-2" />
            <span className="hidden md:inline font-bold text-sm">Nova Transação</span>
        </button>

        {/* Ajuda/Tour Guiado */}
        {onStartTour && (
            <button 
                onClick={onStartTour} 
                title={language === 'pt-BR' ? 'Iniciar Tour Guiado' : 'Start Guided Tour'}
                className="p-2 text-gray-400 hover:text-blue-600 transition-all active:scale-95 flex items-center justify-center"
            >
                <HelpCircle className="h-7 w-7" />
            </button>
        )}

        {/* Notificações */}
        <div className="relative" ref={notificationsMenuRef}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 text-gray-400 hover:text-blue-600 relative">
                <BellIcon className="h-7 w-7" />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 dark:border-gray-700 animate-fade-in origin-top-right overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        {language === 'pt-BR' ? 'Notificações' : 'Notifications'}
                    </div>
                    
                    {/* Ativador de Notificações rápidas no dispositivo */}
                    <div className="px-4 py-2 bg-blue-50/20 dark:bg-slate-900/40 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            📱 {language === 'pt-BR' ? 'Notificações de Celular/PC' : 'Phone/PC Notifications'}
                        </span>
                        <button
                            onClick={handleToggleDeviceNotifications}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                                isPushEnabled 
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' 
                                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 hover:bg-blue-100'
                            }`}
                        >
                            {isPushEnabled ? (language === 'pt-BR' ? 'Ativas' : 'Active') : (language === 'pt-BR' ? 'Ativar' : 'Enable')}
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                {language === 'pt-BR' ? 'Tudo em dia!' : 'All caught up!'}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {notifications.map(item => {
                                    const isSystem = item.type === 'system';
                                    return (
                                        <div key={item.id} className="relative group w-full text-left hover:bg-blue-50/50 dark:hover:bg-slate-700/30 flex gap-3 items-start p-3">
                                            <button 
                                                onClick={() => {
                                                    if (isSystem) {
                                                        setSelectedSystemNotif(item);
                                                    } else {
                                                        setActivePage('Agenda');
                                                    }
                                                    setIsNotificationsOpen(false);
                                                }}
                                                className="flex-1 text-left flex gap-3 items-start min-w-0"
                                            >
                                                <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isSystem ? 'bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'}`}>
                                                    {isSystem ? <Megaphone className="w-3.5 h-3.5" /> : <ClockIcon className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {isSystem && item.title && (
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-0.5">{item.title}</p>
                                                    )}
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{item.description}</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5 uppercase">
                                                        {new Date(item.date).toLocaleDateString(language, {timeZone: 'UTC'})}
                                                    </p>
                                                </div>
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDismissNotification(item.id);
                                                }}
                                                title={language === 'pt-BR' ? 'Dispensar' : 'Dismiss'}
                                                className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all self-center ml-1 animate-fade-in"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Perfil Circle com iniciais */}
        <div className="relative" ref={profileMenuRef}>
          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center h-10 w-10 md:h-11 md:w-11 rounded-full bg-blue-50 border-2 border-blue-100 text-blue-700 font-bold justify-center transition-transform active:scale-95 shadow-sm">
              <span className="text-sm md:text-base">{userInitials}</span>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 dark:border-gray-700 animate-fade-in origin-top-right overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{currentUser?.name || 'Usuário'}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
              </div>

              <button 
                onClick={() => {setActivePage('Configurações'); setIsProfileMenuOpen(false);}} 
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 font-semibold transition-colors"
              >
                <span>Configurações da Conta</span>
              </button>

              <button 
                onClick={() => {
                  if (onOpenInstallApp) onOpenInstallApp();
                  setIsProfileMenuOpen(false);
                }} 
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold transition-colors"
              >
                <Smartphone className="w-4 h-4 text-blue-500" />
                <span>{language === 'pt-BR' ? 'Instalar no Celular (App)' : 'Install on Mobile (App)'}</span>
              </button>

              <button 
                onClick={() => {
                  if (onOpenWhatsApp) onOpenWhatsApp();
                  setIsProfileMenuOpen(false);
                }} 
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-bold transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 fill-emerald-600 dark:fill-emerald-400" />
                <span>{language === 'pt-BR' ? 'Atendimento WhatsApp' : 'WhatsApp Support'}</span>
              </button>

              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>
              
              <button 
                onClick={onLogout} 
                className="w-full text-left block px-4 py-2.5 text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Sair da Conta
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedSystemNotif && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 p-6 animate-scale-up">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg">
                              <Megaphone className="w-5 h-5" />
                          </div>
                          <div>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500 dark:text-blue-400">
                                  {language === 'pt-BR' ? 'Mensagem do Sistema' : 'System Message'}
                              </span>
                              <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5 leading-snug">
                                  {selectedSystemNotif.title || (language === 'pt-BR' ? 'Aviso Importante' : 'Important Announcement')}
                              </h3>
                          </div>
                      </div>
                      <button 
                          onClick={() => {
                              handleDismissNotification(selectedSystemNotif.id);
                              setSelectedSystemNotif(null);
                          }}
                          className="p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap max-h-64 overflow-y-auto pr-1">
                      {selectedSystemNotif.description}
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
                      <span>{new Date(selectedSystemNotif.date).toLocaleDateString(language)}</span>
                      <button
                          onClick={() => {
                              handleDismissNotification(selectedSystemNotif.id);
                              setSelectedSystemNotif(null);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
                      >
                          {language === 'pt-BR' ? 'Entendi' : 'Understood'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </header>
  );
};

export default Header;
