
import React, { useMemo, useState, useRef } from 'react';
import { PersonalTransaction, TransactionType, Currency, Language, Investment, CreditTransaction, Subscription, User } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { FileText, Download, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from '../translations';
import AnnualIncomeReportModal from '../components/AnnualIncomeReportModal';

interface ReportsProps {
    transactions: PersonalTransaction[];
    creditTransactions: CreditTransaction[];
    investments: Investment[];
    subscriptions?: Subscription[];
    language: Language;
    selectedCurrency: Currency;
    onCurrencyChange: (currency: Currency) => void;
    currentUser?: User | null;
}

const COLOR_RECEITA = '#10B981';
const COLOR_DESPESA = '#EF4444';
const COLOR_APORTE = '#6366F1';
const COLOR_SALDO = '#3B82F6';

const Reports: React.FC<ReportsProps> = ({ 
    transactions, 
    creditTransactions = [], 
    investments, 
    subscriptions = [], 
    language, 
    selectedCurrency, 
    onCurrencyChange,
    currentUser
}) => {
    const t = useTranslation(language);
    const isPT = language === 'pt-BR';
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [isAnnualReportOpen, setIsAnnualReportOpen] = useState(false);
    const monthInputRef = useRef<HTMLInputElement>(null);

    const formatCurrency = (value: number) => {
        // Normalização rigorosa para evitar -0,00
        const normalizedValue = Math.abs(value) < 0.009 ? 0 : value;
        if (selectedCurrency === 'BRL') {
            return `R$ ${normalizedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$ ${normalizedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const isInternalTransfer = (category: string) => {
        if (!category) return false;
        const cat = category.toLowerCase().trim();
        const internalKeywords = [
            'investimento', 'investimentos', 'investment', 'investments',
            'aporte', 'aportes', 'contribution', 'contributions',
            'câmbio', 'cambio', 'exchange', 'transferência', 'transferencia', 'transfer', 'resgate'
        ];
        return internalKeywords.some(keyword => cat.includes(keyword));
    };

    const selectedYear = selectedMonth.split('-')[0];

    const monthTotals = useMemo(() => {
        let rec = 0; 
        let despReal = 0; 
        let totalRecAteMes = 0;
        let totalDespAteMes = 0;
        
        transactions.forEach(t => {
            const txCurrency = t.currency || 'BRL';
            if (txCurrency === selectedCurrency) {
                const amount = Number(t.amount) || 0;
                const txMonth = t.date.substring(0, 7);
                
                // Totais do mês selecionado (Matching Dashboard: Income all, Expenses real)
                if (txMonth === selectedMonth) {
                    if (t.type === TransactionType.Receita) {
                        rec += amount; 
                    } else if (t.type === TransactionType.Despesa && !isInternalTransfer(t.category)) {
                        despReal += amount;
                    }
                }

                // Saldo acumulado (Rollover): Tudo até o mês selecionado
                if (txMonth <= selectedMonth) {
                    if (t.type === TransactionType.Receita) {
                        totalRecAteMes += amount;
                    } else if (t.type === TransactionType.Despesa && !isInternalTransfer(t.category)) {
                        totalDespAteMes += amount;
                    }
                }
            }
        });

        const pendingCreditMonth = (creditTransactions || [])
            .filter(ctx => ctx.date.startsWith(selectedMonth) && ctx.status !== 'PAID')
            .reduce((acc, ctx) => acc + (Number(ctx.amount) || 0), 0);
        
        const subsTotal = (subscriptions || [])
            .filter((s: Subscription) => {
                if (s.status !== 'ACTIVE' || s.currency !== selectedCurrency) return false;
                if (s.startDate) {
                    const startMonth = s.startDate.slice(0, 7);
                    return selectedMonth >= startMonth;
                }
                return true;
            })
            .reduce((acc: number, s: Subscription) => acc + (Number(s.amount) || 0), 0);

        despReal += pendingCreditMonth + subsTotal;
        
        const saldoTotal = transactions
            .filter(t => (t.currency || 'BRL') === selectedCurrency)
            .reduce((acc, t) => acc + (t.type === TransactionType.Receita ? Number(t.amount) : -Number(t.amount)), 0);

        const patrimonioTotalAtivos = (investments || [])
            .filter(i => (i.currency || 'BRL') === selectedCurrency)
            .reduce((acc, inv) => acc + (Number(inv.currentValue) || 0), 0);

        return { rec, despReal, saldoTotal, patrimonioTotalAtivos };
    }, [transactions, investments, selectedMonth, selectedCurrency, subscriptions]);

    const monthlyData = useMemo(() => {
        const months = language === 'pt-BR' 
            ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const data = months.map(m => ({ name: m, income: 0, expense: 0, balance: 0 }));

        // Primeiro, calculamos o saldo inicial (tudo antes do ano atual)
        let runningBalance = transactions.reduce((acc, t) => {
            const txCurrency = t.currency || 'BRL';
            if (txCurrency === selectedCurrency && t.date < `${selectedYear}-01-01`) {
                const amount = Number(t.amount) || 0;
                return acc + (t.type === TransactionType.Receita ? amount : -amount);
            }
            return acc;
        }, 0);

        // Depois, preenchemos os meses do ano atual
        transactions.forEach(t => {
            const txCurrency = t.currency || 'BRL';
            if (t.date.startsWith(selectedYear) && txCurrency === selectedCurrency) {
                const monthIndex = parseInt(t.date.split('-')[1]) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    const amount = Number(t.amount) || 0;
                    if (t.type === TransactionType.Receita) {
                        data[monthIndex].income += amount;
                        // O saldo SEMPRE considera tudo
                        data[monthIndex].balance += amount;
                    } else if (t.type === TransactionType.Despesa) {
                        if (!isInternalTransfer(t.category)) {
                            data[monthIndex].expense += amount;
                        }
                        // O saldo SEMPRE considera tudo
                        data[monthIndex].balance -= amount;
                    }
                }
            }
        });

        // Inclui gastos pendentes no crédito no gráfico de barras/áreas
        (creditTransactions || []).forEach(ctx => {
            if (ctx.date.startsWith(selectedYear) && ctx.status !== 'PAID') {
                const monthIndex = parseInt(ctx.date.split('-')[1]) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    data[monthIndex].expense += Number(ctx.amount) || 0;
                }
            }
        });

        // Inclui assinaturas ativas no gráfico de barras/áreas
        data.forEach((d, monthIndex) => {
            const mStr = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
            const subsTotalForMonth = (subscriptions || [])
                .filter((s: Subscription) => {
                    if (s.status !== 'ACTIVE' || s.currency !== selectedCurrency) return false;
                    if (s.startDate) {
                        const startMonth = s.startDate.slice(0, 7);
                        return mStr >= startMonth;
                    }
                    return true;
                })
                .reduce((acc: number, s: Subscription) => acc + (Number(s.amount) || 0), 0);

            d.expense += subsTotalForMonth;
            d.balance -= subsTotalForMonth;
        });

        // Por fim, calculamos o saldo acumulado mês a mês para o gráfico
        return data.map(d => {
            runningBalance += d.balance; // d.balance aqui é a variação do mês (incluindo internas)
            return {
                ...d,
                balance: Number(runningBalance.toFixed(2))
            };
        });
    }, [transactions, selectedYear, selectedCurrency, language, subscriptions, creditTransactions]);

    const pieData = useMemo(() => {
        return [
            { name: t('income'), value: monthTotals.rec, color: COLOR_RECEITA },
            { name: t('costOfLiving'), value: monthTotals.despReal, color: COLOR_DESPESA },
            { name: t('balance'), value: Math.max(0, monthTotals.rec - monthTotals.despReal), color: COLOR_SALDO }
        ].filter(item => item.value > 0); 
    }, [monthTotals, t]);

    const triggerMonthPicker = () => {
        if (monthInputRef.current && 'showPicker' in monthInputRef.current) {
            (monthInputRef.current as any).showPicker();
        } else if (monthInputRef.current) {
            (monthInputRef.current as any).focus();
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* TOP BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">{t('reports')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Visão Geral Detalhada ({selectedCurrency})</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* INFORME DE RENDIMENTOS ANUAL BUTTON */}
                    <button
                        type="button"
                        onClick={() => setIsAnnualReportOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 border border-indigo-500/30"
                        title={isPT ? 'Gerar e baixar o informe oficial de rendimentos para IRPF' : 'Generate and download annual tax statement'}
                    >
                        <FileText className="w-4 h-4" />
                        <span>{isPT ? 'Informe de Rendimentos' : 'Annual Income Report'}</span>
                        <span className="bg-white/20 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            {selectedYear}
                        </span>
                    </button>

                    <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex gap-1">
                        <button onClick={() => onCurrencyChange('BRL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>BRL</button>
                        <button onClick={() => onCurrencyChange('USD')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>USD</button>
                    </div>
                    
                    <div 
                        onClick={triggerMonthPicker}
                        className="group relative bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex items-center gap-3 cursor-pointer hover:border-blue-400 transition-all active:scale-95"
                    >
                        <CalendarIcon className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col min-w-[120px]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Mês de Análise</span>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-700 dark:text-white capitalize">
                                    {new Date(selectedMonth + '-02').toLocaleDateString(language, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                </span>
                                <ChevronDownIcon className="w-4 h-4 text-gray-400 ml-2" />
                            </div>
                        </div>
                        <input 
                            ref={monthInputRef}
                            type="month" 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)} 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                            aria-label="Selecionar mês de análise"
                        />
                    </div>
                </div>
            </div>

            {/* ANNUAL STATEMENT HIGHLIGHT BANNER */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="relative z-10 max-w-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-indigo-400/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {isPT ? 'Fiscal & IRPF' : 'Tax & Accounting'}
                        </span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-gray-300 text-xs font-semibold">
                            {isPT ? `Ano-Calendário ${selectedYear}` : `Tax Year ${selectedYear}`}
                        </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black tracking-tight text-white mb-1">
                        {isPT ? 'Informe de Rendimentos e Posição Patrimonial' : 'Annual Income & Financial Statement'}
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        {isPT 
                            ? 'Emita a declaração consolidada anual com total de receitas, custo de vida, aportes, saldo mês a mês e posição de ativos em 31/12 em PDF oficial ou WhatsApp.'
                            : 'Generate your official annual statement with revenues, deductible expenses, month-by-month cashflow, and year-end asset holdings in PDF or WhatsApp.'}
                    </p>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                    <button
                        type="button"
                        onClick={() => setIsAnnualReportOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-lg shadow-indigo-950 transition-all active:scale-95"
                    >
                        <FileText className="w-4 h-4" />
                        <span>{isPT ? 'Visualizar e Emitir Informe' : 'View & Generate Report'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-2 mb-1.5 text-green-600">
                        <ArrowUpIcon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('income')}</span>
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.rec)}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Receita total do mês</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-2 mb-1.5 text-red-600">
                        <ArrowDownIcon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('costOfLiving')}</span>
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.despReal)}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Gastos reais do mês</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
                        <TrendingUpIcon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('totalInvested')}</span>
                    </div>
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(monthTotals.patrimonioTotalAtivos)}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Valor total em investimentos</p>
                </div>

                <div className="bg-blue-600 p-5 rounded-xl shadow-xl text-white hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-2 mb-1.5 opacity-80">
                        <CreditCardIcon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('balance')}</span>
                    </div>
                    <p className="text-xl font-black">
                        {formatCurrency(monthTotals.saldoTotal)}
                    </p>
                    <p className="text-[9px] mt-0.5 opacity-70">Saldo total disponível em conta</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Fluxo de Renda vs Gastos ({selectedYear})</h4>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_RECEITA} stopOpacity={0.3}/><stop offset="95%" stopColor={COLOR_RECEITA} stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_DESPESA} stopOpacity={0.3}/><stop offset="95%" stopColor={COLOR_DESPESA} stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_SALDO} stopOpacity={0.3}/><stop offset="95%" stopColor={COLOR_SALDO} stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip formatter={(v: number) => formatCurrency(v)} labelStyle={{ fontWeight: 'bold' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'none' }} />
                                <Legend verticalAlign="top" height={36}/>
                                <Area type="monotone" name="Renda Real" dataKey="income" stroke={COLOR_RECEITA} fill="url(#colorRec)" strokeWidth={3} />
                                <Area type="monotone" name={t('costOfLiving')} dataKey="expense" stroke={COLOR_DESPESA} fill="url(#colorDesp)" strokeWidth={3} />
                                <Area type="monotone" name="Evolução Saldo" dataKey="balance" stroke={COLOR_SALDO} fill="url(#colorSaldo)" strokeWidth={2} strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Onde seu dinheiro está indo? ({selectedCurrency})</h4>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value">
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500">Patrimônio Total em Ativos:</span>
                            <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.patrimonioTotalAtivos)}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Esse valor representa a soma de todos os seus ativos cadastrados na aba Investimentos, independente da movimentação deste mês.</p>
                    </div>
                </div>
            </div>

            {/* MODAL DO INFORME DE RENDIMENTOS ANUAL */}
            <AnnualIncomeReportModal
                isOpen={isAnnualReportOpen}
                onClose={() => setIsAnnualReportOpen(false)}
                transactions={transactions}
                investments={investments}
                creditTransactions={creditTransactions}
                subscriptions={subscriptions}
                language={language}
                selectedCurrency={selectedCurrency}
                onCurrencyChange={onCurrencyChange}
                currentUser={currentUser}
            />
        </div>
    );
};

export default Reports;
