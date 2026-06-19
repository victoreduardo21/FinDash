import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import TransactionsTable from '../components/TransactionsTable';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PersonalTransaction, Currency, Language, TransactionType } from '../types';
import { useTranslation } from '../translations';
import { 
  FileDown, 
  Filter, 
  Calendar, 
  X, 
  ListFilter, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RotateCw,
  Search
} from 'lucide-react';

interface TransactionsProps {
    transactions: PersonalTransaction[];
    onOpenModal: (transaction: PersonalTransaction | null) => void;
    onDeleteTransaction: (id: string) => void;
    searchQuery: string;
    language: Language;
    selectedCurrency: Currency;
    onCurrencyChange: (currency: Currency) => void;
}

const CATEGORIES_PT = [
    'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Investimentos', 'Aporte', 'Assinaturas', 'Salário', 'Financiamento', 'Cartão', 'Empréstimo', 'Outros'
];

const CATEGORIES_EN = [
    'Food', 'Housing', 'Transport', 'Health', 'Education', 'Leisure', 'Investments', 'Contributions', 'Subscriptions', 'Salary', 'Financing', 'Credit Card', 'Loan', 'Others'
];

const texts = {
    'pt-BR': {
        statementTitle: 'Extrato de Conferência',
        filters: 'Filtros do Extrato',
        startDate: 'De (Data Inicial)',
        endDate: 'Até (Data Final)',
        category: 'Categoria',
        type: 'Tipo de Lançamento',
        all: 'Todos',
        clearFilters: 'Limpar Filtros',
        downloadPdf: 'Baixar Extrato (PDF)',
        downloading: 'Gerando PDF...',
        income: 'Receitas (Entradas)',
        expense: 'Despesas (Saídas)',
        metricsSummary: 'Resumo do Período',
        totalIn: 'Total de Entradas',
        totalOut: 'Total de Saídas',
        netBalance: 'Saldo Líquido',
        generatedBy: 'Documento gerado eletronicamente por GTS Global Tech Software',
        reconciliationLabel: 'Assinatura / Visto de Conferência',
        noRecords: 'Nenhuma transação encontrada para os filtros selecionados.',
        dateCol: 'Data',
        descCol: 'Descrição',
        catCol: 'Categoria',
        typeCol: 'Tipo',
        valCol: 'Valor',
        credits: 'Utilize os filtros abaixo para selecionar o período e categorias desejadas antes de baixar o arquivo para realizar conferência.'
    },
    'en': {
        statementTitle: 'Verification Statement',
        filters: 'Statement Filters',
        startDate: 'From (Start Date)',
        endDate: 'To (End Date)',
        category: 'Category',
        type: 'Transaction Type',
        all: 'All',
        clearFilters: 'Reset Filters',
        downloadPdf: 'Download PDF Statement',
        downloading: 'Generating PDF...',
        income: 'Incomes (Deposits)',
        expense: 'Expenses (Debits)',
        metricsSummary: 'Period Summary',
        totalIn: 'Total Incomes',
        totalOut: 'Total Expenses',
        netBalance: 'Net Balance',
        generatedBy: 'Document generated electronically by GTS Global Tech Software',
        reconciliationLabel: 'Conferral Signature / Verification',
        noRecords: 'No transactions found with selected filters.',
        dateCol: 'Date',
        descCol: 'Description',
        catCol: 'Category',
        typeCol: 'Type',
        valCol: 'Value',
        credits: 'Use the filters below to choose the perfect date range and categories before exporting to PDF for double checking.'
    }
};

const Transactions: React.FC<TransactionsProps> = ({ 
  transactions, 
  onOpenModal, 
  onDeleteTransaction, 
  searchQuery, 
  language, 
  selectedCurrency, 
  onCurrencyChange 
}) => {
  const t = useTranslation(language);
  const langKey = language === 'pt-BR' ? 'pt-BR' : 'en';
  const term = texts[langKey];

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const categories = language === 'pt-BR' ? CATEGORIES_PT : CATEGORIES_EN;

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase();
    
    return transactions.filter(item => {
        // match currency
        const matchCurrency = item.currency === selectedCurrency;
        if (!matchCurrency) return false;

        // match search query
        if (query) {
            const descriptionMatch = (item.description || '').toLowerCase().includes(query);
            const categoryMatch = (item.category || '').toLowerCase().includes(query);
            const amountMatch = (item.amount || 0).toString().includes(query);
            if (!descriptionMatch && !categoryMatch && !amountMatch) return false;
        }

        // match startDate (YYYY-MM-DD format check)
        if (startDate) {
            const itemDate = item.date ? item.date.slice(0, 10) : '';
            if (itemDate < startDate) return false;
        }

        // match endDate (YYYY-MM-DD format check)
        if (endDate) {
            const itemDate = item.date ? item.date.slice(0, 10) : '';
            if (itemDate > endDate) return false;
        }

        // match category
        if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;

        // match type
        if (filterType !== 'ALL' && item.type !== filterType) return false;

        return true;
    });
  }, [transactions, selectedCurrency, searchQuery, startDate, endDate, filterCategory, filterType]);

  // Derived filtered totals
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.type === 'Receita') {
        income += amt;
      } else {
        expense += amt;
      }
    });
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterCategory('ALL');
    setFilterType('ALL');
  };

  // Safe accent string normalization or text conversion for PDF output
  const cleanCharText = (txt: string) => {
    return txt || '';
  };

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const isPT = language === 'pt-BR';
        const formattedCurrency = selectedCurrency === 'BRL' ? 'R$' : '$';

        // Styling Palette
        const colorPrimary = [15, 23, 42]; // Slate 900
        const colorTextSec = [100, 116, 139]; // Slate 500

        // 1. BANNER BRAND CABEÇALHO
        doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        doc.rect(10, 10, 190, 16, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("GTS Global Tech Software | Money Dashs", 15, 20);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(new Date().toLocaleString(isPT ? 'pt-BR' : 'en-US'), 152, 20);

        // 2. TÍTULO DO EXTRATO
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        doc.text(cleanCharText(term.statementTitle.toUpperCase()), 10, 38);

        // 3. CRITÉRIOS DE FILTRAGEM NOS METADADOS do PDF
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(colorTextSec[0], colorTextSec[1], colorTextSec[2]);
        const periodText = (startDate || endDate) 
          ? `${startDate || '...'} ate ${endDate || '...'}` 
          : (isPT ? 'Filtro de periodo completo (Todo o historico)' : 'All time range');
        doc.text(`${cleanCharText(term.type)}: ${filterType === 'ALL' ? term.all : filterType}  |  ${cleanCharText(term.category)}: ${filterCategory === 'ALL' ? term.all : filterCategory}`, 10, 44);
        doc.text(`Moeda: ${selectedCurrency}  |  ${isPT ? 'Periodo' : 'Period'}: ${periodText}`, 10, 49);

        // Linha divisória
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.line(10, 53, 200, 53);

        // 4. RESUMO DOS VALORES DO PERÍODO FILTRADO (CARDS DE RESUMO)
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.rect(10, 57, 190, 20, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(10, 57, 190, 20, 'S');

        // Receitas (Entradas)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(16, 185, 129); // Emerald 500
        doc.text(cleanCharText(term.totalIn.toUpperCase()), 15, 64);
        doc.setFontSize(11);
        doc.text(`${formattedCurrency} ${totals.income.toLocaleString(language, { minimumFractionDigits: 2 })}`, 15, 71);

        // Despesas (Saídas)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(239, 68, 68); // Rose 500
        doc.text(cleanCharText(term.totalOut.toUpperCase()), 80, 64);
        doc.setFontSize(11);
        doc.text(`- ${formattedCurrency} ${totals.expense.toLocaleString(language, { minimumFractionDigits: 2 })}`, 80, 71);

        // Saldo Final
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(totals.balance >= 0 ? 37 : 239, totals.balance >= 0 ? 99 : 68, totals.balance >= 0 ? 235 : 68); // Blue 600 or Rose 500
        doc.text(cleanCharText(term.netBalance.toUpperCase()), 145, 64);
        doc.setFontSize(11);
        doc.text(`${totals.balance < 0 ? '-' : ''} ${formattedCurrency} ${Math.abs(totals.balance).toLocaleString(language, { minimumFractionDigits: 2 })}`, 145, 71);

        // 5. CABEÇALHO DA TABELA
        doc.setFillColor(241, 245, 249); // Slate 100
        doc.rect(10, 83, 190, 9, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(10, 83, 190, 9, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(cleanCharText(term.dateCol.toUpperCase()), 14, 89);
        doc.text(cleanCharText(term.descCol.toUpperCase()), 38, 89);
        doc.text(cleanCharText(term.catCol.toUpperCase()), 110, 89);
        doc.text(cleanCharText(term.typeCol.toUpperCase()), 148, 89);
        doc.text(cleanCharText(term.valCol.toUpperCase()), 172, 89);

        // 6. RENDERIZAÇÃO DAS LINHAS DE TRANSAÇÕES
        let y = 98;
        const pageHeight = doc.internal.pageSize.height;

        filteredTransactions.forEach((item, index) => {
          // Page breaks handling
          if (y > pageHeight - 35) {
            doc.addPage();
            y = 20;

            // Brand header repeat on next page
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text("GTS Global Tech Software | Money Dashs", 10, y - 5);
            doc.line(10, y - 3, 200, y - 3);

            // Table header row render again on new page
            doc.setFillColor(241, 245, 249);
            doc.rect(10, y, 190, 9, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.rect(10, y, 190, 9, 'S');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(15, 23, 42);
            doc.text(cleanCharText(term.dateCol.toUpperCase()), 14, y + 6);
            doc.text(cleanCharText(term.descCol.toUpperCase()), 38, y + 6);
            doc.text(cleanCharText(term.catCol.toUpperCase()), 110, y + 6);
            doc.text(cleanCharText(term.typeCol.toUpperCase()), 148, y + 6);
            doc.text(cleanCharText(term.valCol.toUpperCase()), 172, y + 6);

            y += 15;
          }

          // Light zebra layout
          if (index % 2 === 1) {
            doc.setFillColor(250, 251, 252);
            doc.rect(10, y - 5, 190, 8, 'F');
          }

          // Values render
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);

          // Date Formatting
          let rawDate = item.date || '';
          if (rawDate.includes('T')) rawDate = rawDate.split('T')[0];
          const parts = rawDate.split('-');
          const formatedDate = parts.length === 3
            ? (isPT ? `${parts[2]}/${parts[1]}/${parts[0]}` : `${parts[1]}/${parts[2]}/${parts[0]}`)
            : rawDate;

          doc.text(formatedDate, 14, y + 1);

          // Description truncate elegantly to avoid overflow
          const originalDesc = item.description || '';
          const truncated = originalDesc.length > 38 ? originalDesc.substring(0, 35) + '...' : originalDesc;
          doc.text(cleanCharText(truncated), 38, y + 1);

          // Category name
          doc.text(cleanCharText(item.category || ''), 110, y + 1);

          // Type with color green/red
          const isIncome = item.type === 'Receita';
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(isIncome ? 16 : 239, isIncome ? 185 : 68, isIncome ? 129 : 68);
          doc.text(cleanCharText(isIncome ? 'RECEITA' : 'DESPESA'), 148, y + 1);

          // Reset font color to standard slate 800
          doc.setTextColor(15, 23, 42);
          const signText = isIncome ? '+ ' : '- ';
          doc.text(`${signText}${formattedCurrency} ${item.amount.toLocaleString(language, { minimumFractionDigits: 2 })}`, 172, y + 1);

          // Divider horizontal dotted or light line
          doc.setDrawColor(241, 245, 249);
          doc.line(10, y + 3, 200, y + 3);

          y += 8;
        });

        // Blank State on PDF
        if (filteredTransactions.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(cleanCharText(term.noRecords), 45, y + 10);
          y += 20;
        }

        // 7. VISTO / ASSINATURA DE CONFERÊNCIA
        y += 15;
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 30;
        }

        doc.setDrawColor(203, 213, 225); // Slate 300
        doc.setLineDashPattern([2, 2], 0);
        doc.line(65, y + 10, 145, y + 10);
        doc.setLineDashPattern([], 0); // resets dash

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(cleanCharText(term.reconciliationLabel), 82, y + 15);

        // 8. RODAPÉ DE AUTORIA EXCLUSIVA
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(cleanCharText(term.generatedBy), 10, pageHeight - 12);

        // 9. SALVAR E FAZER DOWNLOAD DO DOCUMENTO
        const dateString = new Date().toISOString().slice(0, 10);
        const outputFilename = `extrato_conferencia_${selectedCurrency}_${dateString}.pdf`;
        doc.save(outputFilename);

      } catch (err) {
        console.error("Failed to generate statement:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
        {/* TOP TITLE HEADER BANNER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-750 gap-4">
            <div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  {t('transactions')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                  {language === 'pt-BR' 
                      ? `Gerencie suas contas, confira lançamentos em tempo real e emita relatórios oficiais em ${selectedCurrency}`
                      : `Manage your accounts, review real-time statements and output official PDFs in ${selectedCurrency}`}
                </p>
            </div>

            {/* QUICK ACTIONS BANNER */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="bg-gray-100/85 dark:bg-gray-900/60 p-1.5 rounded-xl border border-gray-200/60 dark:border-gray-700 flex gap-1">
                    <button 
                        onClick={() => onCurrencyChange('BRL')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        BRL
                    </button>
                    <button 
                        onClick={() => onCurrencyChange('USD')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        USD
                    </button>
                </div>

                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex-1 md:flex-none flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <Filter className="h-4 w-4 mr-2 text-gray-500" />
                    {showFilters ? (language === 'pt-BR' ? 'Ocultar Filtros' : 'Hide Filters') : term.filters}
                </button>

                <button 
                    onClick={() => onOpenModal(null)} 
                    className="flex-1 md:flex-none flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors duration-200 text-sm font-bold shadow-lg"
                >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    {t('add')}
                </button>
            </div>
        </div>

        {/* COMPREHENSIVE RECONCILIATION FILTER CARD */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200/90 dark:border-gray-700 shadow-sm space-y-4 transition-all animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 dark:border-gray-700/80 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                      <ListFilter className="w-5 h-5 text-indigo-500" />
                      <h4 className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-wider">{term.filters}</h4>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {term.credits}
                  </p>
              </div>

              {/* GRID CONTROLS FILTER BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                  {/* Start Date */}
                  <div>
                      <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{term.startDate}</label>
                      <div className="relative">
                          <input 
                              type="date"
                              value={startDate}
                              onChange={e => setStartDate(e.target.value)}
                              className="w-full text-xs font-semibold p-2.5 pl-9 rounded-xl border border-gray-200 dark:border-gray-705 bg-gray-50 dark:bg-gray-900/40 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                  </div>

                  {/* End Date */}
                  <div>
                      <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{term.endDate}</label>
                      <div className="relative">
                          <input 
                              type="date"
                              value={endDate}
                              onChange={e => setEndDate(e.target.value)}
                              className="w-full text-xs font-semibold p-2.5 pl-9 rounded-xl border border-gray-200 dark:border-gray-705 bg-gray-50 dark:bg-gray-900/40 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                  </div>

                  {/* Category dropdown */}
                  <div>
                      <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{term.category}</label>
                      <select 
                          value={filterCategory}
                          onChange={e => setFilterCategory(e.target.value)}
                          className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-705 bg-gray-50 dark:bg-gray-900/40 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                          <option value="ALL">{term.all}</option>
                          {categories.map((cat, idx) => (
                              <option key={idx} value={cat}>{cat}</option>
                          ))}
                      </select>
                  </div>

                  {/* Type dropdown */}
                  <div>
                      <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{term.type}</label>
                      <select 
                          value={filterType}
                          onChange={e => setFilterType(e.target.value)}
                          className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-705 bg-gray-50 dark:bg-gray-900/40 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                          <option value="ALL">{term.all}</option>
                          <option value="Receita">{term.income}</option>
                          <option value="Despesa">{term.expense}</option>
                      </select>
                  </div>
              </div>

              {/* ACTION ROW WITHIN FILTERS */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60 gap-3">
                  {/* Clean stats indicator */}
                  <div className="flex items-center gap-2">
                       <span className="text-xs text-gray-500 dark:text-gray-400">
                          {language === 'pt-BR' ? 'Resultados Encontrados: ' : 'Results Found: '}
                          <strong className="text-blue-600 dark:text-blue-400 font-black">{filteredTransactions.length}</strong>
                       </span>
                       {(startDate || endDate || filterCategory !== 'ALL' || filterType !== 'ALL') && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                       )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Clear Filters Button */}
                      {(startDate || endDate || filterCategory !== 'ALL' || filterType !== 'ALL') && (
                          <button 
                              onClick={handleClearFilters}
                              className="text-xs font-bold text-gray-500 hover:text-red-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1"
                          >
                              <RotateCw className="w-3.5 h-3.5" />
                              {term.clearFilters}
                          </button>
                      )}

                      {/* EXPORT ADVANCED PDF BUTTON */}
                      <button 
                          onClick={handleDownloadPDF}
                          disabled={isGenerating}
                          className="flex items-center justify-center bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-800 disabled:opacity-70 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md gap-2 w-full sm:w-auto"
                      >
                          {isGenerating ? (
                              <>
                                  <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                  {term.downloading}
                              </>
                          ) : (
                              <>
                                  <FileDown className="w-4 h-4 text-white" />
                                  {term.downloadPdf}
                              </>
                          )}
                      </button>
                  </div>
              </div>
          </div>
        )}

        {/* PERIOD OVERVIEW METRIC STRIPS FOR CONFIRMATION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             {/* Total Entrada Card */}
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                 <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                     <ArrowUpCircle className="w-5 h-5" />
                 </div>
                 <div>
                     <p className="text-[10px] text-gray-500 text-slate-400 font-bold uppercase">{term.totalIn}</p>
                     <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                         {selectedCurrency === 'BRL' ? 'R$' : '$'} {totals.income.toLocaleString(language, { minimumFractionDigits: 2 })}
                     </p>
                 </div>
             </div>

             {/* Total Saída Card */}
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                 <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
                     <ArrowDownCircle className="w-5 h-5" />
                 </div>
                 <div>
                     <p className="text-[10px] text-gray-500 text-slate-400 font-bold uppercase">{term.totalOut}</p>
                     <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                         {selectedCurrency === 'BRL' ? 'R$' : '$'} {totals.expense.toLocaleString(language, { minimumFractionDigits: 2 })}
                     </p>
                 </div>
             </div>

             {/* Saldo Periodo Card */}
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                 <div className={`p-2.5 rounded-lg ${totals.balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                     <Search className="w-5 h-5" />
                 </div>
                 <div>
                     <p className="text-[10px] text-gray-500 text-slate-400 font-bold uppercase">{term.netBalance}</p>
                     <p className={`text-base font-black mt-0.5 ${totals.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                         {totals.balance < 0 ? '-' : ''} {selectedCurrency === 'BRL' ? 'R$' : '$'} {Math.abs(totals.balance).toLocaleString(language, { minimumFractionDigits: 2 })}
                     </p>
                 </div>
             </div>
        </div>
        
        {/* TRANSACTIONS TABLE LIST CONTEXT */}
        <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <TransactionsTable 
                transactions={filteredTransactions} 
                title={searchQuery ? `${language === 'pt-BR' ? 'Resultados de busca para' : 'Search results for'} "${searchQuery}" (${selectedCurrency})` : `${t('history')} (${selectedCurrency})`}
                onEdit={onOpenModal}
                onDelete={onDeleteTransaction}
                language={language}
            />
        </div>
    </div>
  );
};

export default Transactions;
