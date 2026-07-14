
import React, { useState, useMemo } from 'react';
import { CreditCard, CreditTransaction, Language, Currency, TransactionType } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../translations';
import { 
    Plus, 
    CreditCard as CardIcon, 
    Trash2, 
    AlertCircle, 
    ArrowRight, 
    Info,
    ChevronDown,
    ChevronUp,
    Calendar,
    DollarSign,
    Edit2,
    Settings,
    CheckCircle
} from 'lucide-react';
import { User } from '../types';

const CATEGORIES_PT = [
    'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Investimentos', 'Aporte', 'Assinaturas', 'Salário', 'Financiamento', 'Cartão', 'Empréstimo', 'Outros'
];

const CATEGORIES_EN = [
    'Food', 'Housing', 'Transport', 'Health', 'Education', 'Leisure', 'Investments', 'Contributions', 'Subscriptions', 'Salary', 'Financing', 'Credit Card', 'Loan', 'Others'
];

interface CreditsProps {
    creditCards: CreditCard[];
    creditTransactions: CreditTransaction[];
    language: Language;
    selectedCurrency: Currency;
    onCurrencyChange: (c: Currency) => void;
    token: string;
    currentUser: User | null;
}

const Credits: React.FC<CreditsProps> = ({ 
    creditCards, 
    creditTransactions, 
    language, 
    selectedCurrency, 
    onCurrencyChange, 
    token,
    currentUser
}) => {
    const t = useTranslation(language);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isOverdraftModalOpen, setIsOverdraftModalOpen] = useState(false);
    
    // New Card Form
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [cardName, setCardName] = useState('');
    const [cardLimit, setCardLimit] = useState('');
    const [closingDay, setClosingDay] = useState('10');
    const [dueDay, setDueDay] = useState('15');

    // Overdraft Limit
    const [tempOverdraftLimit, setTempOverdraftLimit] = useState(currentUser?.overdraftLimit?.toString() || '0');
    
    // New Transaction Form
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
    const [selectedCardId, setSelectedCardId] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [installments, setInstallments] = useState('1');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isOverdraft, setIsOverdraft] = useState(false);
    const [category, setCategory] = useState(language === 'pt-BR' ? CATEGORIES_PT[0] : CATEGORIES_EN[0]);

    const categories = language === 'pt-BR' ? CATEGORIES_PT : CATEGORIES_EN;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(language, {
            style: 'currency',
            currency: selectedCurrency,
        }).format(val);
    };

    const cardExpenses = useMemo(() => {
        const totals: Record<string, number> = {};
        creditTransactions.forEach(tx => {
            if (tx.status === 'PAID') return;
            if (tx.cardId && tx.cardId !== 'overdraft') {
                totals[tx.cardId] = (totals[tx.cardId] || 0) + tx.amount;
            }
        });
        return totals;
    }, [creditTransactions]);

    const overdraftSpent = useMemo(() => {
        return creditTransactions
            .filter(tx => (tx.isOverdraft || tx.cardId === 'overdraft') && tx.status !== 'PAID')
            .reduce((acc, tx) => acc + tx.amount, 0);
    }, [creditTransactions]);

    const handleSaveOverdraftLimit = async () => {
        if (!token) return;
        try {
            await api.updateUser(token, { overdraftLimit: parseFloat(tempOverdraftLimit) });
            setIsOverdraftModalOpen(false);
        } catch (err) {
            console.error("Error saving overdraft limit:", err);
        }
    };

    const handleSaveCard = async () => {
        if (!cardName || !cardLimit) return;
        try {
            await api.createCreditCard({
                id: editingCardId || undefined,
                name: cardName,
                limit: parseFloat(cardLimit),
                closingDay: parseInt(closingDay),
                dueDay: parseInt(dueDay),
                currency: selectedCurrency
            }, token);
            setIsCardModalOpen(false);
            setEditingCardId(null);
            setCardName('');
            setCardLimit('');
        } catch (err) {
            console.error("Error saving card:", err);
        }
    };

    const handleOpenNewCard = () => {
        setEditingCardId(null);
        setCardName('');
        setCardLimit('');
        setClosingDay('10');
        setDueDay('15');
        setIsCardModalOpen(true);
    };

    const handleOpenEditCard = (card: CreditCard) => {
        setEditingCardId(card.id);
        setCardName(card.name);
        setCardLimit(card.limit.toString());
        setClosingDay(card.closingDay.toString());
        setDueDay(card.dueDay.toString());
        setIsCardModalOpen(true);
    };

    const handleCardSelection = (cardId: string) => {
        setSelectedCardId(cardId);
        if (!cardId) return;
        const card = creditCards.find(c => c.id === cardId);
        if (card && card.dueDay) {
            const today = new Date();
            let year = today.getFullYear();
            let month = today.getMonth() + 1; // 1-indexed

            const currentDay = today.getDate();
            if (card.closingDay && currentDay >= card.closingDay) {
                month += 1;
                if (month > 12) {
                    month = 1;
                    year += 1;
                }
            }

            const targetDay = String(card.dueDay).padStart(2, '0');
            const targetMonth = String(month).padStart(2, '0');
            setDate(`${year}-${targetMonth}-${targetDay}`);
        }
    };

    const handleOpenNewTransaction = () => {
        setEditingTransactionId(null);
        setSelectedCardId('');
        setDescription('');
        setAmount('');
        setInstallments('1');
        setDate(new Date().toISOString().split('T')[0]);
        setIsOverdraft(false);
        setCategory(language === 'pt-BR' ? CATEGORIES_PT[0] : CATEGORIES_EN[0]);
        setIsTransactionModalOpen(true);
    };

    const handleOpenEditTransaction = (tx: CreditTransaction) => {
        setEditingTransactionId(tx.id);
        setSelectedCardId(tx.cardId === 'overdraft' ? '' : tx.cardId);
        setDescription(tx.description);
        setAmount(tx.amount.toString());
        setInstallments(tx.totalInstallments.toString());
        setDate(tx.date);
        setIsOverdraft(tx.isOverdraft || false);
        setCategory(tx.category || (tx.isOverdraft ? 'Cheque Especial' : (language === 'pt-BR' ? CATEGORIES_PT[0] : CATEGORIES_EN[0])));
        setIsTransactionModalOpen(true);
    };

    const handleSaveTransaction = async () => {
        if (!description || !amount || (!selectedCardId && !isOverdraft)) return;
        try {
            const totalVal = parseFloat(amount);
            const totalInst = parseInt(installments) || 1;
            
            const existingTx = editingTransactionId ? creditTransactions.find(t => t.id === editingTransactionId) : null;
            const status = existingTx ? existingTx.status || 'PENDING' : 'PENDING';
            const paymentDateVal = existingTx ? existingTx.paymentDate || null : null;

            if (editingTransactionId) {
                // Ao editar um lançamento existente, atualizamos o registro individual
                await api.createCreditTransaction({
                    id: editingTransactionId,
                    cardId: isOverdraft ? 'overdraft' : selectedCardId,
                    description,
                    amount: totalVal,
                    installments: existingTx ? existingTx.installments || 1 : 1, 
                    totalInstallments: existingTx ? existingTx.totalInstallments || 1 : 1,
                    date,
                    category: category || (isOverdraft ? 'Cheque Especial' : 'Cartão de Crédito'),
                    isOverdraft,
                    status: status,
                    ...(paymentDateVal ? { paymentDate: paymentDateVal } : {})
                }, token);
            } else {
                // Criando novas despesas: se for parcelado, dividimos o valor total e criamos lançamentos futuros
                if (totalInst > 1 && !isOverdraft) {
                    const instAmount = Number((totalVal / totalInst).toFixed(2));
                    // Parse correto da data base para evitar desvios de fuso horário
                    const baseDate = new Date(date + 'T12:00:00');

                    for (let i = 0; i < totalInst; i++) {
                        const instDate = new Date(baseDate);
                        instDate.setMonth(baseDate.getMonth() + i);
                        const dateStr = instDate.toISOString().split('T')[0];

                        // Ajusta centavo de arredondamento na última parcela
                        const currentAmount = i === totalInst - 1 
                            ? Number((totalVal - (instAmount * (totalInst - 1))).toFixed(2))
                            : instAmount;

                        const displayDesc = `${description} (${i + 1}/${totalInst})`;

                        await api.createCreditTransaction({
                            cardId: selectedCardId,
                            description: displayDesc,
                            amount: currentAmount,
                            installments: i + 1, 
                            totalInstallments: totalInst,
                            date: dateStr,
                            category: category || 'Cartão de Crédito',
                            isOverdraft: false,
                            status: 'PENDING'
                        }, token);
                    }
                } else {
                    // Sem parcelamento ou é cheque especial
                    await api.createCreditTransaction({
                        cardId: isOverdraft ? 'overdraft' : selectedCardId,
                        description,
                        amount: totalVal,
                        installments: 1, 
                        totalInstallments: 1,
                        date,
                        category: category || (isOverdraft ? 'Cheque Especial' : 'Cartão de Crédito'),
                        isOverdraft,
                        status: 'PENDING'
                    }, token);
                }
            }
            
            setIsTransactionModalOpen(false);
            setEditingTransactionId(null);
            setDescription('');
            setAmount('');
            setInstallments('1');
            setSelectedCardId('');
            setIsOverdraft(false);
        } catch (err) {
            console.error("Error saving credit transaction:", err);
        }
    };

    const handlePayNow = async (tx: CreditTransaction) => {
        if (!token) return;
        try {
            // 1. Criar transação real de despesa (sai da conta)
            await api.createTransaction({
                description: `PGTO: ${tx.description}`,
                amount: tx.amount,
                currency: selectedCurrency,
                date: new Date().toISOString().split('T')[0],
                type: TransactionType.Despesa,
                category: tx.category || 'Pagamento'
            }, token);

            // 2. Atualizar status da transação de crédito
            await api.createCreditTransaction({
                ...tx,
                status: 'PAID',
                paymentDate: new Date().toISOString().split('T')[0]
            }, token);

            alert('Pagamento realizado e registrado nas suas despesas!');
        } catch (err) {
            console.error("Error paying transaction:", err);
            alert('Erro ao processar pagamento.');
        }
    };

    const handleDeleteCard = async (id: string) => {
        if (window.confirm('Tem certeza?')) {
            await api.deleteCreditCard(id, token);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        await api.deleteCreditTransaction(id, token);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <CardIcon className="text-blue-600" />
                        {t('credits')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Controle seus cartões e cheque especial</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleOpenNewCard}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm text-sm"
                    >
                        <Plus size={18} /> {t('newCard')}
                    </button>
                    <button 
                        onClick={handleOpenNewTransaction}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-sm"
                    >
                        <Plus size={18} /> {t('newCreditExpense')}
                    </button>
                </div>
            </header>

            {/* Overdraft Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gradient-to-br from-red-500 to-red-700 p-6 rounded-3xl text-white shadow-xl shadow-red-500/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-xs font-black uppercase tracking-widest opacity-80">{t('overdraft')}</span>
                            <button 
                                onClick={() => setIsOverdraftModalOpen(true)}
                                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <div>
                            <p className="text-3xl font-black tracking-tight mb-2">{formatCurrency(overdraftSpent)}</p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    {t('usedOverdraft')}
                                </div>
                                
                                {currentUser?.overdraftLimit ? (
                                    <div className="space-y-1.5 pt-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase opacity-80">
                                            <span>{t('availableLimit')}</span>
                                            <span>{formatCurrency(currentUser.overdraftLimit - overdraftSpent)}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-white transition-all duration-1000"
                                                style={{ width: `${Math.min((overdraftSpent / currentUser.overdraftLimit) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-bold opacity-70 italic pt-2">Limite não configurado</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                    {creditCards.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 min-w-[300px]">
                             <CardIcon className="w-12 h-12 text-gray-300 mb-4" />
                             <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum cartão cadastrado</p>
                        </div>
                    ) : (
                        creditCards.map(card => {
                            const spent = cardExpenses[card.id] || 0;
                            const available = card.limit - spent;
                            const progress = Math.min((spent / card.limit) * 100, 100);

                            return (
                                <div key={card.id} className="min-w-[280px] bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                <CardIcon size={16} className="text-blue-600" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{card.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleOpenEditCard(card)} 
                                                className="text-gray-300 hover:text-blue-500 transition-colors"
                                                title={language === 'pt-BR' ? 'Editar cartão' : 'Edit card'}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteCard(card.id)} 
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                                title={language === 'pt-BR' ? 'Excluir cartão' : 'Delete card'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('availableLimit')}</p>
                                            <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(available)}</p>
                                        </div>

                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            <div>
                                                <p>{t('billClosing')}</p>
                                                <p className="text-gray-700 dark:text-gray-200 mt-0.5">Dia {card.closingDay}</p>
                                            </div>
                                            <div>
                                                <p>{t('billDue')}</p>
                                                <p className="text-gray-700 dark:text-gray-200 mt-0.5">Dia {card.dueDay}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('history')}</h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('description')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('category')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('installments')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('paymentDate')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t('value')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {creditTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{tx.description}</span>
                                            <span className="text-[10px] font-medium text-gray-400">
                                                {tx.isOverdraft ? 'Cheque Especial' : creditCards.find(c => c.id === tx.cardId)?.name || 'Cartão'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{tx.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                            {tx.totalInstallments}x
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                                        {tx.date}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(tx.amount)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {tx.status !== 'PAID' ? (
                                                <button 
                                                    onClick={() => handlePayNow(tx)}
                                                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm"
                                                >
                                                    {t('payNow')}
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-1 text-green-500 font-bold text-[10px] uppercase tracking-wider bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                                    <CheckCircle size={12} />
                                                    {t('paid')}
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => handleOpenEditTransaction(tx)} 
                                                className="text-gray-300 hover:text-blue-500 transition-colors p-1"
                                                title={language === 'pt-BR' ? 'Editar lançamento' : 'Edit transaction'}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteTransaction(tx.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {creditTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t('noTransactions')}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCardModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCardModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
                            {editingCardId 
                                ? (language === 'pt-BR' ? 'Editar Cartão' : 'Edit Credit Card') 
                                : t('newCard')}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('cardName')}</label>
                                <input 
                                    type="text" 
                                    value={cardName} 
                                    onChange={e => setCardName(e.target.value)}
                                    placeholder="Ex: Nubank, Inter..." 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('limit')}</label>
                                <input 
                                    type="number" 
                                    value={cardLimit} 
                                    onChange={e => setCardLimit(e.target.value)}
                                    placeholder="0,00" 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('closingDay')}</label>
                                    <input 
                                        type="number" 
                                        min="1" max="31"
                                        value={closingDay} 
                                        onChange={e => setClosingDay(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('dueDay')}</label>
                                    <input 
                                        type="number" 
                                        min="1" max="31"
                                        value={dueDay} 
                                        onChange={e => setDueDay(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveCard}
                                className="w-full py-4 mt-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isTransactionModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTransactionModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
                            {editingTransactionId 
                                ? (language === 'pt-BR' ? 'Editar Lançamento de Crédito' : 'Edit Credit Expense') 
                                : t('newCreditExpense')}
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-2 p-1 bg-gray-50 dark:bg-slate-900 rounded-xl mb-4">
                                <button 
                                    onClick={() => setIsOverdraft(false)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isOverdraft ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}
                                >
                                    {t('creditCards')}
                                </button>
                                <button 
                                    onClick={() => setIsOverdraft(true)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isOverdraft ? 'bg-white dark:bg-slate-800 text-red-600 shadow-sm' : 'text-gray-400'}`}
                                >
                                    {t('overdraft')}
                                </button>
                            </div>

                            {!isOverdraft && (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('creditCards')}</label>
                                    <select 
                                        value={selectedCardId} 
                                        onChange={e => handleCardSelection(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                    >
                                        <option value="">Selecione um cartão</option>
                                        {creditCards.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('description')}</label>
                                <input 
                                    type="text" 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ex: Supermercado, Aluguel..." 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('category')}</label>
                                <select 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('value')}</label>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0,00" 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <p className="text-[9px] text-gray-400 mt-1 ml-1">Coloque o valor final (com juros se houver)</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('installments')}</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={installments} 
                                        onChange={e => setInstallments(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('paymentDate')}</label>
                                <input 
                                    type="date" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            <button 
                                onClick={handleSaveTransaction}
                                className={`w-full py-4 mt-4 ${isOverdraft ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'} text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95`}
                            >
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isOverdraftModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOverdraftModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                                <AlertCircle className="text-red-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('overdraft')}</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t('overdraftLimit')}</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                        {selectedCurrency === 'BRL' ? 'R$' : '$'}
                                    </div>
                                    <input 
                                        type="number" 
                                        value={tempOverdraftLimit} 
                                        onChange={e => setTempOverdraftLimit(e.target.value)}
                                        placeholder="0,00" 
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-black text-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 px-1">O cheque especial permite que você use um valor extra além do seu saldo disponível em conta.</p>
                            </div>
                            
                            <button 
                                onClick={handleSaveOverdraftLimit}
                                className="w-full py-4 mt-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                            >
                                {t('save')}
                            </button>
                            <button 
                                onClick={() => setIsOverdraftModalOpen(false)}
                                className="w-full py-4 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-gray-600 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Credits;
