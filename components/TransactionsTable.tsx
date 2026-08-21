
import React, { useState } from 'react';
import { PersonalTransaction, TransactionType, Language, User } from '../types';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useTranslation } from '../translations';
import { FileText, Share2, Receipt } from 'lucide-react';
import TransactionReceiptModal from './TransactionReceiptModal';

interface TransactionsTableProps {
  transactions: PersonalTransaction[];
  title?: string;
  onEdit?: (transaction: PersonalTransaction) => void;
  onDelete?: (id: string) => void;
  onViewAll?: () => void;
  showViewAllLink?: boolean;
  language?: Language;
  currentUser?: User | null;
  onViewReceipt?: (transaction: PersonalTransaction) => void;
}

const ActionMenu: React.FC<{ 
  transaction: PersonalTransaction; 
  onEdit?: (transaction: PersonalTransaction) => void; 
  onDelete?: (id: string) => void; 
  onViewReceipt: (transaction: PersonalTransaction) => void;
  language: Language;
}> = ({ transaction, onEdit, onDelete, onViewReceipt, language }) => {
    const t = useTranslation(language);
    const isPT = language === 'pt-BR';
    const [isOpen, setIsOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isPT ? 'Mais opções' : 'More options'}
            >
                <MoreVerticalIcon className="h-5 w-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1.5 z-50 border border-gray-200 dark:border-gray-700 animate-fade-in origin-top-right">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onViewReceipt(transaction); setIsOpen(false); }} 
                        className="w-full text-left flex items-center px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                        <FileText className="h-4 w-4 mr-2.5" /> {isPT ? 'Ver Comprovante' : 'View Receipt'}
                    </button>
                    {onEdit && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(transaction); setIsOpen(false); }} 
                            className="w-full text-left flex items-center px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <EditIcon className="h-4 w-4 mr-2.5" /> {t('edit')}
                        </button>
                    )}
                    {onDelete && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); setIsOpen(false); }} 
                            className="w-full text-left flex items-center px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border-t border-gray-100 dark:border-gray-700/60 mt-1"
                        >
                            <TrashIcon className="h-4 w-4 mr-2.5" /> {t('delete')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const getCategoryColor = (category: string) => {
    const cat = (category || '').toLowerCase().trim();
    if (cat.includes('invest') || cat === 'aporte') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
    if (cat.includes('alimen') || cat.includes('food')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    if (cat.includes('lazer') || cat.includes('leisure')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400 border-pink-200 dark:border-pink-800';
    if (cat.includes('saúde') || cat.includes('health')) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ 
    transactions, 
    title = "Transações",
    onEdit,
    onDelete,
    onViewAll,
    showViewAllLink = false,
    language = 'pt-BR',
    currentUser,
    onViewReceipt
}) => {
  const currentLanguage = language as Language;
  const isPT = currentLanguage === 'pt-BR';
  const t = useTranslation(currentLanguage);
  
  const [internalReceiptTx, setInternalReceiptTx] = useState<PersonalTransaction | null>(null);

  const handleOpenReceipt = (tx: PersonalTransaction) => {
    if (onViewReceipt) {
      onViewReceipt(tx);
    } else {
      setInternalReceiptTx(tx);
    }
  };

  const isInvestment = (category: string) => {
    const cat = (category || '').toLowerCase().trim();
    return cat.includes('invest') || cat === 'aporte' || cat === 'contribution' || cat === 'resgate';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    if (currentLanguage === 'pt-BR') return `${d}/${m}/${y}`;
    return `${m}/${d}/${y}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm md:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 flex justify-between items-center">
        <h4 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">{title}</h4>
        <span className="text-xs text-gray-400 font-medium">
          {transactions.length} {isPT ? 'lançamento(s)' : 'entry(ies)'}
        </span>
      </div>

      {/* VIEW MOBILE: CARDS */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-2 cursor-pointer" onClick={() => handleOpenReceipt(transaction)}>
                <p className="font-bold text-gray-900 dark:text-white truncate">{transaction.description}</p>
                <p className="text-[10px] text-gray-500 font-medium">{formatDate(transaction.date)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenReceipt(transaction)}
                  className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                  title={isPT ? 'Ver comprovante' : 'View receipt'}
                >
                  <Receipt className="w-4 h-4" />
                </button>
                <ActionMenu 
                  transaction={transaction} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  onViewReceipt={handleOpenReceipt}
                  language={currentLanguage} 
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2">
                 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${getCategoryColor(transaction.category)}`}>
                    {transaction.category}
                 </span>
                 <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${transaction.currency === 'USD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {transaction.currency || 'BRL'}
                 </span>
              </div>
              <p className={`font-black text-sm ${
                transaction.type === TransactionType.Receita 
                  ? 'text-green-600 dark:text-green-400' 
                  : isInvestment(transaction.category) 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {transaction.type === TransactionType.Despesa && '- '}
                {transaction.currency === 'BRL' ? 'R$ ' : '$ '}
                {transaction.amount.toLocaleString(currentLanguage, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="p-10 text-center text-gray-500 text-sm">{t('noTransactions')}</div>
        )}
      </div>

      {/* VIEW DESKTOP: TABLE */}
      <div className="hidden md:block overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-[10px] text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold">{t('description')}</th>
              <th scope="col" className="px-4 py-3 font-bold">{t('value')}</th>
              <th scope="col" className="px-4 py-3 font-bold">Moeda</th>
              <th scope="col" className="px-4 py-3 font-bold">{t('date')}</th>
              <th scope="col" className="px-4 py-3 font-bold">{t('category')}</th>
              <th scope="col" className="px-4 py-3 font-bold text-center">{isPT ? 'Comprovante' : 'Receipt'}</th>
              <th scope="col" className="px-4 py-3 font-bold text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <span>{transaction.description}</span>
                  </div>
                </td>
                <td className={`px-4 py-3 font-bold ${
                  transaction.type === TransactionType.Receita 
                    ? 'text-green-600 dark:text-green-400' 
                    : isInvestment(transaction.category) 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === TransactionType.Despesa && '- '}
                  {transaction.currency === 'BRL' ? 'R$ ' : '$ '}
                  {transaction.amount.toLocaleString(currentLanguage, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${transaction.currency === 'USD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {transaction.currency || 'BRL'}
                    </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-tighter ${getCategoryColor(transaction.category)}`}>
                    {transaction.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleOpenReceipt(transaction)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-100 dark:border-indigo-800/40 transition-all active:scale-95"
                    title={isPT ? 'Visualizar, baixar ou compartilhar comprovante' : 'View, download or share receipt'}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{isPT ? 'Extrato' : 'Receipt'}</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                   <ActionMenu 
                      transaction={transaction} 
                      onEdit={onEdit} 
                      onDelete={onDelete} 
                      onViewReceipt={handleOpenReceipt}
                      language={currentLanguage} 
                   />
                </td>
              </tr>
            ))}
             {transactions.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">{t('noTransactions')}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {showViewAllLink && onViewAll && (
        <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
            <button onClick={onViewAll} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-widest">{t('viewAll')}</button>
        </div>
      )}

      {/* STANDALONE RECEIPT MODAL */}
      <TransactionReceiptModal
        isOpen={!!internalReceiptTx}
        onClose={() => setInternalReceiptTx(null)}
        transaction={internalReceiptTx}
        language={currentLanguage}
        currentUser={currentUser}
      />
    </div>
  );
};

export default TransactionsTable;
