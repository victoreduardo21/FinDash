
import React, { useState, useEffect } from 'react';
import { Subscription, Currency, Language } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../translations';
import { 
    Plus, 
    RefreshCw, 
    Trash2, 
    CreditCard, 
    Calendar, 
    DollarSign,
    MoreHorizontal,
    Pause,
    Play,
    Info
} from 'lucide-react';

interface SubscriptionsProps {
    subscriptions: Subscription[];
    language: Language;
    selectedCurrency: Currency;
    token: string;
}

const CATEGORIES_PT = [
    'Streaming', 'Academia', 'Internet', 'Seguros', 'Assinaturas', 'Aluguel', 'Educação', 'Outros'
];

const CATEGORIES_EN = [
    'Streaming', 'Gym', 'Internet', 'Insurance', 'Subscriptions', 'Rent', 'Education', 'Others'
];

const Subscriptions: React.FC<SubscriptionsProps> = ({ 
    subscriptions, 
    language, 
    selectedCurrency, 
    token 
}) => {
    const t = useTranslation(language);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDay, setDueDay] = useState('10');
    const [category, setCategory] = useState(language === 'pt-BR' ? CATEGORIES_PT[0] : CATEGORIES_EN[0]);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const categories = language === 'pt-BR' ? CATEGORIES_PT : CATEGORIES_EN;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(language, {
            style: 'currency',
            currency: selectedCurrency,
        }).format(val);
    };

    const handleSave = async () => {
        if (!description || !amount) return;
        const localToday = (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })();
        try {
            await api.createSubscription({
                description,
                amount: parseFloat(amount),
                currency: selectedCurrency,
                dueDay: parseInt(dueDay),
                category,
                status: 'ACTIVE',
                startDate: startDate || localToday
            }, token);
            setIsModalOpen(false);
            setDescription('');
            setAmount('');
            setStartDate(localToday);
        } catch (err) {
            console.error("Error saving subscription:", err);
        }
    };

    const handleToggleStatus = async (sub: Subscription) => {
        try {
            await api.createSubscription({
                ...sub,
                status: sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
            }, token);
        } catch (err) {
            console.error("Error toggling status:", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Excluir esta assinatura?')) {
            await api.deleteSubscription(id, token);
        }
    };

    const totalMonthly = subscriptions
        .filter(s => s.status === 'ACTIVE' && s.currency === selectedCurrency)
        .reduce((acc, s) => acc + s.amount, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <RefreshCw className="text-indigo-600" />
                        {t('subscriptions')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Gerencie seus gastos fixos e recorrentes</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                >
                    <Plus size={20} /> {t('newSubscription')}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('monthlyBalance')}</p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalMonthly)}</p>
                    <span className="text-[10px] font-bold text-gray-400">Comprometido mensalmente</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('serviceName')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('category')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('dueDay')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t('value')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {subscriptions.map(sub => (
                                <tr key={sub.id} className={`hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors ${sub.status === 'PAUSED' ? 'opacity-60' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                                                <RefreshCw size={18} className="text-indigo-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{sub.description}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${sub.status === 'ACTIVE' ? 'text-green-500' : 'text-orange-500'}`}>
                                                        {sub.status === 'ACTIVE' ? t('activeSub') : t('pausedSub')}
                                                    </span>
                                                    {sub.startDate && (
                                                        <span className="text-[10px] font-bold text-gray-400">
                                                            • {language === 'pt-BR' ? `Início: ${sub.startDate.split('-').reverse().join('/')}` : `Start: ${sub.startDate}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            {sub.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300">
                                            <Calendar size={14} className="text-gray-400" />
                                            Dia {sub.dueDay}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(sub.amount)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleToggleStatus(sub)}
                                                className={`p-2 rounded-xl transition-all ${sub.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                            >
                                                {sub.status === 'ACTIVE' ? <Pause size={16} /> : <Play size={16} />}
                                            </button>
                                            <button onClick={() => handleDelete(sub.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {subscriptions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-gray-300">
                                                <RefreshCw size={32} />
                                            </div>
                                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t('noSubscriptions')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">{t('newSubscription')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('serviceName')}</label>
                                <input 
                                    type="text" 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ex: Netflix, Spotify, Aluguel..." 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('category')}</label>
                                <select 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('recurringValue')}</label>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0,00" 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('dueDay')}</label>
                                    <input 
                                        type="number" 
                                        min="1" max="31"
                                        value={dueDay} 
                                        onChange={e => setDueDay(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                    {language === 'pt-BR' ? 'Data de Início' : 'Start Date'}
                                </label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    required
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                                    {language === 'pt-BR' 
                                        ? 'A assinatura será cobrada a partir deste mês de início selecionado.' 
                                        : 'The subscription will be active from this selected start month onwards.'}
                                </p>
                            </div>
                            <button 
                                onClick={handleSave}
                                className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
