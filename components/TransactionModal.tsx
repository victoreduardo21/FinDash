
import React, { useState, useEffect, useRef } from 'react';
import { PersonalTransaction, TransactionType, Currency, Language } from '../types';
import { XIcon } from './icons/XIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { useTranslation } from '../translations';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }) => Promise<void> | void;
    transaction: PersonalTransaction | null;
    language: Language;
}

const CATEGORIES_PT = [
    'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Investimentos', 'Aporte', 'Assinaturas', 'Salário', 'Financiamento', 'Cartão', 'Empréstimo', 'Outros'
];

const CATEGORIES_EN = [
    'Food', 'Housing', 'Transport', 'Health', 'Education', 'Leisure', 'Investments', 'Contributions', 'Subscriptions', 'Salary', 'Financing', 'Credit Card', 'Loan', 'Others'
];

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, transaction, language }) => {
    const t = useTranslation(language);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [currency, setCurrency] = useState<Currency>('BRL');
    const [date, setDate] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.Despesa);
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const categories = language === 'pt-BR' ? CATEGORIES_PT : CATEGORIES_EN;

    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            if (transaction) {
                setDescription(transaction.description); 
                setAmount(transaction.amount); 
                setCurrency(transaction.currency || 'BRL'); 
                setDate(transaction.date); 
                setType(transaction.type); 
                setCategory(transaction.category);
            } else {
                setDescription(''); 
                setAmount(0); 
                setCurrency('BRL'); 
                setDate(new Date().toISOString().split('T')[0]); 
                setType(TransactionType.Despesa); 
                setCategory(categories[0]);
            }
        }
    }, [transaction, isOpen, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); 
        if (isSubmitting) return; 
        setIsSubmitting(true);
        try { 
            await onSave({ id: transaction?.id, description, amount, currency, date, type, category }); 
        } catch (error) { 
            setIsSubmitting(false); 
        }
    };

    const triggerDatePicker = () => {
        if (dateInputRef.current && 'showPicker' in dateInputRef.current) {
            (dateInputRef.current as any).showPicker();
        } else if (dateInputRef.current) {
            (dateInputRef.current as any).focus();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{transaction ? t('edit') : t('newTransaction')}</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('status')}</label>
                                <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white font-medium">
                                    <option value={TransactionType.Despesa}>{t('expense')}</option>
                                    <option value={TransactionType.Receita}>{t('income')}</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Currency</label>
                                <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white font-bold">
                                    <option value="BRL">🇧🇷 BRL</option>
                                    <option value="USD">🇺🇸 USD</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('description')}</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white font-medium" placeholder="Ex: Mercado Mensal" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('value')}</label>
                            <input type="number" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} required className="w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white font-black text-lg" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('category')}</label>
                                <select 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)} 
                                    required 
                                    className={`w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white font-bold ${category.toLowerCase().includes('invest') ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('date')}</label>
                                <div onClick={triggerDatePicker} className="relative group cursor-pointer">
                                    <input 
                                        ref={dateInputRef}
                                        type="date" 
                                        value={date} 
                                        onChange={e => setDate(e.target.value)} 
                                        required 
                                        className="w-full p-2.5 pr-10 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                                    />
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-500 pointer-events-none transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">{t('cancel')}</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all">
                            {isSubmitting ? t('saving') : t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;
