import React, { useState, useRef, useMemo } from 'react';
import { CalendarEvent, Language, Subscription, CreditCard, CreditTransaction } from '../types';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XIcon } from '../components/icons/XIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { useTranslation } from '../translations';
import { 
    AlertTriangle, 
    Clock, 
    CreditCard as CardIcon, 
    Repeat, 
    Percent, 
    Info, 
    HelpCircle,
    BellRing,
    Sparkles
} from 'lucide-react';

interface AgendaProps {
    tasks: CalendarEvent[];
    subscriptions?: Subscription[];
    creditCards?: CreditCard[];
    creditTransactions?: CreditTransaction[];
    onAddTask: (task: Omit<CalendarEvent, 'id'>) => Promise<void> | void;
    onToggleTask: (id: string, done: boolean) => void;
    onDeleteTask: (id: string) => void;
    language: Language;
}

interface UnifiedEvent {
    id: string;
    type: 'manual' | 'subscription' | 'creditCard' | 'overdraft';
    description: string;
    date: string;
    done: boolean;
    amount?: number;
    currency?: string;
    originalId?: string;
}

const Agenda: React.FC<AgendaProps> = ({ 
    tasks, 
    subscriptions = [], 
    creditCards = [], 
    creditTransactions = [], 
    onAddTask, 
    onToggleTask, 
    onDeleteTask, 
    language 
}) => {
    const t = useTranslation(language);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Filter by type state (All, Manual, Automatic Bills)
    const [filterSource, setFilterSource] = useState<'ALL' | 'MANUAL' | 'AUTO'>('ALL');

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');

    // Local storage of checked virtual events (for subscription payment confirmation or credit card payment simulation this month)
    const [checkedVirtuals, setCheckedVirtuals] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('gts_agenda_checked_virtuals');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const toggleVirtual = (key: string) => {
        const updated = checkedVirtuals.includes(key)
            ? checkedVirtuals.filter(k => k !== key)
            : [...checkedVirtuals, key];
        setCheckedVirtuals(updated);
        try {
            localStorage.setItem('gts_agenda_checked_virtuals', JSON.stringify(updated));
        } catch (e) {
            console.error(e);
        }
    };

    const getTodayString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const todayStr = getTodayString();

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const cleanDate = dateStr.split('T')[0];
        const parts = cleanDate.split('-');
        if (parts.length !== 3) return dateStr;
        const [y, m, d] = parts;
        if (language === 'pt-BR') return `${d}/${m}/${y}`;
        return `${m}/${d}/${y}`;
    };

    // Calculate dynamic difference in days relative to today
    const getDaysDifference = (dateStr: string) => {
        if (!dateStr) return 999;
        const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parts = cleanDate.split('-');
        if (parts.length !== 3) return 999;
        
        const [y, m, d] = parts.map(Number);
        const targetDate = new Date(y, m - 1, d);
        targetDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    };

    // Auto-detect and unify manual reminders, credit faturas, overdrafts and active subscriptions
    const unifiedEvents = useMemo(() => {
        const list: UnifiedEvent[] = [];

        // 1. Manual events
        tasks.forEach(task => {
            list.push({
                id: `manual-${task.id}`,
                type: 'manual',
                description: task.description,
                date: task.date.slice(0, 10),
                done: task.done,
                originalId: task.id
            });
        });

        // 2. Active subscriptions
        subscriptions.forEach(sub => {
            if (sub.status === 'ACTIVE') {
                let dayNum = sub.dueDay;
                if (dayNum < 1) dayNum = 1;
                if (dayNum > 28) dayNum = 28; // avoid leap year issues
                const dayStr = String(dayNum).padStart(2, '0');
                const eventDate = `${curYear}-${curMonth}-${dayStr}`;
                const virtualKey = `sub-${sub.id}-${curYear}-${curMonth}`;
                const isDone = checkedVirtuals.includes(virtualKey);

                list.push({
                    id: virtualKey,
                    type: 'subscription',
                    description: `${sub.description}`,
                    date: eventDate,
                    done: isDone,
                    amount: sub.amount,
                    currency: sub.currency,
                    originalId: sub.id
                });
            }
        });

        // 3. Credit Cards statement duedate
        creditCards.forEach(card => {
            // Find unpaid transactions on this card
            const activeCardTxs = creditTransactions.filter(tx => tx.cardId === card.id && tx.status !== 'PAID');
            const totalDue = activeCardTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

            let dayNum = card.dueDay;
            if (dayNum < 1) dayNum = 1;
            if (dayNum > 28) dayNum = 28;
            const dayStr = String(dayNum).padStart(2, '0');
            const eventDate = `${curYear}-${curMonth}-${dayStr}`;
            const virtualKey = `card-${card.id}-${curYear}-${curMonth}`;
            
            // Fatura is "done" if either checked or zero outstanding
            const isDone = checkedVirtuals.includes(virtualKey) || totalDue <= 0;

            list.push({
                id: virtualKey,
                type: 'creditCard',
                description: `${language === 'pt-BR' ? 'Fatura Cartão ' : 'Invoiced '}${card.name}`,
                date: eventDate,
                done: isDone,
                amount: totalDue,
                currency: card.currency,
                originalId: card.id
            });
        });

        // 4. Overdrafts
        creditTransactions.forEach(tx => {
            if (tx.isOverdraft && tx.status !== 'PAID') {
                const virtualKey = `overdraft-${tx.id}`;
                list.push({
                    id: virtualKey,
                    type: 'overdraft',
                    description: `${language === 'pt-BR' ? 'Cheque Especial Pendente: ' : 'Overdraft Pending: '}${tx.description}`,
                    date: tx.date.slice(0, 10),
                    done: false, // Outstanding cheque especial is never "done" until paid in Créditos
                    amount: tx.amount,
                    currency: 'BRL',
                    originalId: tx.id
                });
            }
        });

        // Filter based on client preference tab
        const filtered = list.filter(item => {
            if (filterSource === 'MANUAL') return item.type === 'manual';
            if (filterSource === 'AUTO') return item.type !== 'manual';
            return true;
        });

        // Sort by date
        return filtered.sort((a, b) => a.date.localeCompare(b.date));
    }, [tasks, subscriptions, creditCards, creditTransactions, curYear, curMonth, checkedVirtuals, language, filterSource]);

    // Calculate pending bills within the next 3 days on our active list
    const urgentBills = useMemo(() => {
        // Evaluate all tasks before filtering source (to ensure urgent ones aren't hidden)
        const fullList: UnifiedEvent[] = [];
        
        tasks.forEach(task => {
            if (!task.done) {
                fullList.push({
                    id: `manual-${task.id}`,
                    type: 'manual',
                    description: task.description,
                    date: task.date.slice(0, 10),
                    done: false
                });
            }
        });

        subscriptions.forEach(sub => {
            if (sub.status === 'ACTIVE') {
                let dayNum = sub.dueDay;
                if (dayNum < 1) dayNum = 1;
                if (dayNum > 28) dayNum = 28;
                const dayStr = String(dayNum).padStart(2, '0');
                const eventDate = `${curYear}-${curMonth}-${dayStr}`;
                const virtualKey = `sub-${sub.id}-${curYear}-${curMonth}`;
                if (!checkedVirtuals.includes(virtualKey)) {
                    fullList.push({
                        id: virtualKey,
                        type: 'subscription',
                        description: sub.description,
                        date: eventDate,
                        done: false,
                        amount: sub.amount,
                        currency: sub.currency
                    });
                }
            }
        });

        creditCards.forEach(card => {
            const activeCardTxs = creditTransactions.filter(tx => tx.cardId === card.id && tx.status !== 'PAID');
            const totalDue = activeCardTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
            
            let dayNum = card.dueDay;
            if (dayNum < 1) dayNum = 1;
            if (dayNum > 28) dayNum = 28;
            const dayStr = String(dayNum).padStart(2, '0');
            const eventDate = `${curYear}-${curMonth}-${dayStr}`;
            const virtualKey = `card-${card.id}-${curYear}-${curMonth}`;

            if (totalDue > 0 && !checkedVirtuals.includes(virtualKey)) {
                fullList.push({
                    id: virtualKey,
                    type: 'creditCard',
                    description: `${language === 'pt-BR' ? 'Fatura Cartão ' : 'Invoiced '}${card.name}`,
                    date: eventDate,
                    done: false,
                    amount: totalDue,
                    currency: card.currency
                });
            }
        });

        creditTransactions.forEach(tx => {
            if (tx.isOverdraft && tx.status !== 'PAID') {
                fullList.push({
                    id: `overdraft-${tx.id}`,
                    type: 'overdraft',
                    description: `${language === 'pt-BR' ? 'Cheque Especial: ' : 'Overdraft: '}${tx.description}`,
                    date: tx.date.slice(0, 10),
                    done: false,
                    amount: tx.amount,
                    currency: 'BRL'
                });
            }
        });

        return fullList.filter(item => {
            const diff = getDaysDifference(item.date);
            return diff <= 3; // overdue, today or next 3 days
        });
    }, [tasks, subscriptions, creditCards, creditTransactions, curYear, curMonth, checkedVirtuals, language]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (newTaskDesc && newTaskDate) {
            setIsSubmitting(true);
            try {
                await onAddTask({ description: newTaskDesc, date: newTaskDate, done: false });
                setNewTaskDesc('');
                setNewTaskDate('');
                setIsModalOpen(false);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const triggerDatePicker = () => {
        if (dateInputRef.current && 'showPicker' in dateInputRef.current) {
            (dateInputRef.current as any).showPicker();
        } else if (dateInputRef.current) {
            (dateInputRef.current as any).focus();
        }
    };

    const handleActionClick = (item: UnifiedEvent) => {
        if (item.type === 'manual') {
            onToggleTask(item.originalId!, !item.done);
        } else {
            toggleVirtual(item.id);
        }
    };

    const formatPrice = (amount?: number, curr?: string) => {
        if (amount === undefined) return '';
        const symbol = curr === 'USD' ? '$' : 'R$';
        return `${symbol} ${amount.toLocaleString(language, { minimumFractionDigits: 2 })}`;
    };

    return (
        <div id="agenda-page-container" className="space-y-6">
            
            {/* MAIN AGENDA TITLE BANNER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-750 gap-4">
                <div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="h-8 w-8 text-blue-600" />
                        {t('agenda')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-xl">
                        {language === 'pt-BR' 
                            ? 'Agenda Inteligente GTS: Consolida seus compromissos manuais de pagamento, suas assinaturas mensais ativas, limites e as faturas pendentes de cartões automaticamente.'
                            : 'GTS Smart Agenda: Automatically brings active subscription fees, outstanding credit invoices, and manual task reminders together into a single view.'}
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => { setNewTaskDate(getTodayString()); setIsModalOpen(true); setIsSubmitting(false); }} 
                        className="flex-1 md:flex-none flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 text-xs font-black shadow-lg"
                    >
                        <PlusIcon className="h-4.5 w-4.5 mr-1.5" />
                        {t('addReminder')}
                    </button>
                </div>
            </div>

            {/* AUTOMATED MULTI-SCREEN REMINDER BANNER */}
            {urgentBills.length > 0 && (
                <div id="urgent-bills-alert-banner" className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-600/15 border border-amber-300 dark:border-amber-900/60 p-5 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-300">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20 animate-bounce mt-0.5">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-base text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                {language === 'pt-BR' ? 'Lembrete Inteligente: Contas Próximas do Vencimento' : 'Smart Reminder: Imminent Expenses Due'}
                                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    GTS AI
                                </span>
                            </h4>
                            <p className="text-xs text-amber-600 dark:text-slate-400 mt-1 font-semibold">
                                {language === 'pt-BR' 
                                    ? `Centralizador GTS: Detectamos ${urgentBills.length} pendências (manuais, de cartão ou assinaturas) vencendo nos próximos 3 dias ou com pendências de pagamento. Confira-as abaixo:`
                                    : `GTS Central: Identified ${urgentBills.length} pending items (manual, subscription fee or outstanding card due date) expiring inside the next 3 days. Check them out:`}
                            </p>
                        </div>
                    </div>
                    
                    {/* Urgency List Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
                        {urgentBills.map(bill => {
                            const diff = getDaysDifference(bill.date);
                            return (
                                <div key={bill.id} className="bg-white/95 dark:bg-gray-800/95 p-4 rounded-xl border border-amber-200/90 dark:border-amber-900/40 shadow-xs flex flex-col justify-between hover:border-amber-400 hover:shadow-sm transition-all group">
                                    <div className="flex justify-between items-start gap-1">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                {bill.type === 'subscription' && (
                                                    <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 flex items-center gap-0.5">
                                                        <Repeat className="w-2.5 h-2.5" />
                                                        {language === 'pt-BR' ? 'ASSINATURA' : 'SUB'}
                                                    </span>
                                                )}
                                                {bill.type === 'creditCard' && (
                                                    <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 flex items-center gap-0.5">
                                                        <CardIcon className="w-2.5 h-2.5" />
                                                        {language === 'pt-BR' ? 'CARTÃO DE CRÉDITO' : 'CREDIT CARD'}
                                                    </span>
                                                )}
                                                {bill.type === 'overdraft' && (
                                                    <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 flex items-center gap-0.5 font-extrabold animate-pulse">
                                                        <Percent className="w-2.5 h-2.5" />
                                                        {language === 'pt-BR' ? 'CHEQUE ESPECIAL' : 'OVERDRAFT'}
                                                    </span>
                                                )}
                                                {bill.type === 'manual' && (
                                                    <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                        {language === 'pt-BR' ? 'AGENDA MANUAL' : 'MANUAL'}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-sm font-black text-gray-800 dark:text-gray-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                {bill.description}
                                            </p>
                                            
                                            {bill.amount !== undefined && (
                                                <p className="text-sm font-black text-slate-700 dark:text-slate-300 mt-1">
                                                    {formatPrice(bill.amount, bill.currency)}
                                                </p>
                                            )}

                                            <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-1.5">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                {formatDate(bill.date)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/60">
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                            diff === 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400' :
                                            diff < 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 animate-pulse' :
                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                            {diff === 0 
                                                ? (language === 'pt-BR' ? 'Hoje!' : 'Today') 
                                                : diff < 0 
                                                  ? (language === 'pt-BR' ? 'Apoiador Atrasado' : 'Overdue') 
                                                  : (language === 'pt-BR' ? `Vence em ${diff} dias` : `Due in ${diff} days`)}
                                        </span>
                                        
                                        <button 
                                            onClick={() => handleActionClick(bill)}
                                            className="text-[10px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 px-3 py-1 rounded-xl shadow-xs transition-all flex items-center gap-1"
                                        >
                                            <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
                                            {language === 'pt-BR' ? 'Confirmar Pago' : 'Confirm Paid'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* AGENDA UNIFIED ITEMS VIEW */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-750 space-y-6">
                
                {/* ADVANCED FILTER TABS SOURCE */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b dark:border-gray-700 pb-4">
                    <div className="bg-gray-100/90 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700 flex gap-1 w-full sm:w-auto">
                        <button 
                            onClick={() => setFilterSource('ALL')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterSource === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                            {language === 'pt-BR' ? 'Todas Pendências' : 'All Expenses'}
                        </button>
                        <button 
                            onClick={() => setFilterSource('MANUAL')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterSource === 'MANUAL' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                            {language === 'pt-BR' ? 'Remendados Manuais' : 'Manual Reminders'}
                        </button>
                        <button 
                            onClick={() => setFilterSource('AUTO')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterSource === 'AUTO' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                            <span className="flex items-center gap-1 justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                {language === 'pt-BR' ? 'Faturas & Assinaturas' : 'Cards & Subs'}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Info size={14} className="text-indigo-500" /> 
                        <span className="font-medium">
                            {language === 'pt-BR' 
                                ? 'Faturas e assinaturas sincronizam direto de seus respectivos painéis.' 
                                : 'Invoices & sub rates sync from their respective panels.'}
                        </span>
                    </div>
                </div>

                {unifiedEvents.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                            <CalendarIcon className="h-8 w-8 text-gray-300 dark:text-gray-500" />
                        </div>
                        <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200">{t('noReminders')}</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {language === 'pt-BR' ? 'Crie um lembrete manual ou configure cartões e assinaturas para carregar a pauta automática.' : 'Create a manual task or set up credit cards and sub programs to feed the schedule.'}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {unifiedEvents.map((item) => {
                             const diffDays = getDaysDifference(item.date);
                             const isUrgentBill = !item.done && diffDays <= 3;
                             const isPast = item.date < todayStr;
                             const isToday = item.date === todayStr;

                             return (
                                 <li key={item.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group ${
                                     item.done 
                                         ? 'bg-gray-50/50 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800 opacity-60' 
                                         : isUrgentBill
                                             ? 'bg-amber-50/70 dark:bg-amber-950/10 border-amber-300 dark:border-amber-900 hover:border-amber-400 dark:hover:border-amber-800 shadow-sm'
                                             : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-semibold hover:shadow-xs'
                                 }`}>
                                    <div className="flex items-start space-x-3 cursor-pointer flex-grow min-w-0" onClick={() => handleActionClick(item)}>
                                        <div className={`p-2 rounded-lg transition-all duration-300 flex-shrink-0 mt-0.5 ${
                                            item.done 
                                                ? 'text-green-500 bg-green-50 dark:bg-green-950/20' 
                                                : 'text-gray-400 bg-gray-50 dark:bg-gray-900 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20'
                                        }`}>
                                            <CheckCircleIcon className="h-5 w-5" />
                                        </div>

                                        <div className="flex-1 min-w-0 pr-3"> 
                                            {/* SOURCE BRAND BADGES */}
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                {item.type === 'manual' && (
                                                    <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
                                                        {language === 'pt-BR' ? 'MANUAL' : 'MANUAL'}
                                                    </span>
                                                )}
                                                {item.type === 'subscription' && (
                                                    <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 flex items-center gap-0.5">
                                                        <Repeat className="w-3 h-3" />
                                                        {language === 'pt-BR' ? 'ASSINATURA' : 'SUBSCRIPTION'}
                                                    </span>
                                                )}
                                                {item.type === 'creditCard' && (
                                                    <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 flex items-center gap-0.5">
                                                        <CardIcon className="w-3 h-3" />
                                                        {language === 'pt-BR' ? 'FATURA CARTÃO' : 'CARD BILL'}
                                                    </span>
                                                )}
                                                {item.type === 'overdraft' && (
                                                    <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 tracking-widest animate-pulse">
                                                        {language === 'pt-BR' ? 'CHEQUE ESPECIAL' : 'OVERDRAFT'}
                                                    </span>
                                                )}

                                                {/* URGENCY ALERT CHIP */}
                                                {isUrgentBill && (
                                                    <span className="inline-flex items-center gap-1 bg-amber-500 text-white dark:bg-amber-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                                                        <AlertTriangle className="w-2.5 h-2.5" />
                                                        {diffDays === 0 
                                                          ? (language === 'pt-BR' ? 'Hoje!' : 'Today!') 
                                                          : diffDays < 0 
                                                            ? (language === 'pt-BR' ? 'Atrasado!' : 'Overdue!') 
                                                            : (language === 'pt-BR' ? `Vence em ${diffDays}d!` : `Due in ${diffDays}d!`)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                                <p className={`font-bold text-base transition-all duration-300 break-words whitespace-pre-wrap ${item.done ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {item.description}
                                                </p>
                                                
                                                {item.amount !== undefined && (
                                                    <span className={`text-base font-black flex-shrink-0 ${item.done ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                        {formatPrice(item.amount, item.currency)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center text-sm mt-1.5 gap-2 flex-wrap">
                                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                                                    item.done ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : 
                                                    isPast ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 
                                                    isToday ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 
                                                    isUrgentBill ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                                    'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                                                }`}>
                                                    {item.done ? t('done') : isPast ? t('past') : isToday ? t('today') : t('future')}
                                                </span>
                                                <span className={`text-xs ${item.done ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {formatDate(item.date)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action items button */}
                                    {item.type === 'manual' ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteTask(item.originalId!); }} 
                                            className="p-2 text-gray-300 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/35 transition-all flex-shrink-0 self-center"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <div className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl transition-all mr-1">
                                            {item.done ? (
                                                <span className="text-green-600 dark:text-green-400 font-black">{language === 'pt-BR' ? 'Pago' : 'Paid'}</span>
                                            ) : (
                                                <span>{language === 'pt-BR' ? 'Simular Pago' : 'Simulate Paid'}</span>
                                            )}
                                        </div>
                                    )}
                                 </li>
                             );
                        })}
                    </ul>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 p-6">
                        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('addReminder')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-650 dark:hover:text-gray-200">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('whatToDo')}</label>
                                <input type="text" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-750 border dark:border-gray-650 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                    placeholder="Ex: Pagar fatura do cartão"
                                    required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('when')}</label>
                                <div onClick={triggerDatePicker} className="relative group cursor-pointer">
                                    <input 
                                        ref={dateInputRef}
                                        type="date" 
                                        value={newTaskDate} 
                                        onChange={(e) => setNewTaskDate(e.target.value)}
                                        className="w-full pr-10 pl-4 py-2 bg-white dark:bg-gray-750 border dark:border-gray-650 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                        required 
                                    />
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-500 pointer-events-none transition-colors" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-705 rounded-lg font-medium transition-colors">{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-70">
                                    {isSubmitting ? t('saving') : t('add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agenda;
