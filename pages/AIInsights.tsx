import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PersonalTransaction, Investment, CreditCard, CreditTransaction, User as UserType, AiConversation, TransactionType, Currency } from '../types';
import { useTranslation } from '../translations';
import { aiService } from '../services/aiService';
import { api } from '../services/api';
import { 
  BarChart, Bar, Cell, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  Sparkles, TrendingUp, TrendingDown, Landmark, 
  AlertTriangle, DollarSign, PieChart as PieIcon, 
  ArrowUpRight, ArrowDownRight, Lightbulb,
  ChevronDown, Send, Trash2, HelpCircle, Activity, Award
} from 'lucide-react';
import Markdown from 'react-markdown';

interface AIInsightsProps {
  transactions: PersonalTransaction[];
  investments: Investment[];
  creditCards: CreditCard[];
  creditTransactions: CreditTransaction[];
  currentUser: UserType | null;
  aiConversation: AiConversation | null;
  token: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PerformanceMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  margin: number;
  biggestGain: PersonalTransaction | null;
  biggestSpend: PersonalTransaction | null;
  spendingByCategory: Array<{ category: string; amount: number; percentage: number }>;
  incomeByCategory: Array<{ category: string; amount: number; percentage: number }>;
}

const AIInsights: React.FC<AIInsightsProps> = ({ 
  transactions, 
  investments, 
  creditCards, 
  creditTransactions, 
  currentUser,
  aiConversation,
  token
}) => {
  const [activeCurrency, setActiveCurrency] = useState<Currency>('BRL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM'
  
  // Chat support states
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync historical conversations
  useEffect(() => {
    if (aiConversation) {
      setMessages(aiConversation.messages);
    }
  }, [aiConversation]);

  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  // Derive available months from transactions for selection
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        months.add(t.date.substring(0, 7));
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Descending order
  }, [transactions]);

  // Utility to format values
  const formatValue = (val: number) => {
    const absVal = Math.abs(val) < 0.009 ? 0 : Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (activeCurrency === 'BRL') {
      return `${sign}R$ ${absVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${sign}$ ${absVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper check for internal transfers
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

  // Filtered transactions for calculation
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      const matchCurrency = (t.currency || 'BRL') === activeCurrency;
      const matchMonth = selectedMonth === 'ALL' || t.date.startsWith(selectedMonth);
      return matchCurrency && matchMonth;
    });
  }, [transactions, activeCurrency, selectedMonth]);

  // Premium calculations requested by the user
  const metrics: PerformanceMetrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    
    let biggestGainField: PersonalTransaction | null = null;
    let biggestSpendField: PersonalTransaction | null = null;

    const categorySpendingMap: { [key: string]: number } = {};
    const categoryIncomeMap: { [key: string]: number } = {};

    filteredTx.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === TransactionType.Receita) {
        totalIncome += amount;
        
        // Compute biggest single gain
        if (!biggestGainField || amount > (Number(biggestGainField.amount) || 0)) {
          biggestGainField = t;
        }

        const cat = t.category || 'Outros';
        categoryIncomeMap[cat] = (categoryIncomeMap[cat] || 0) + amount;

      } else if (t.type === TransactionType.Despesa) {
        // Exclude internal exchange rates from real cost calculations
        if (!isInternalTransfer(t.category)) {
          totalExpenses += amount;
          
          // Compute biggest single spend
          if (!biggestSpendField || amount > (Number(biggestSpendField.amount) || 0)) {
            biggestSpendField = t;
          }

          const cat = t.category || 'Outros';
          categorySpendingMap[cat] = (categorySpendingMap[cat] || 0) + amount;
        }
      }
    });

    // Also include credit card pending transactions inside selected month if match
    const billingCreditMonth = creditTransactions.filter(ctx => {
      const matchCurrency = (ctx.userId === token) && (ctx.status !== 'PAID');
      const matchMonth = selectedMonth === 'ALL' || ctx.date.startsWith(selectedMonth);
      return matchCurrency && matchMonth;
    });

    billingCreditMonth.forEach(ctx => {
      const amount = Number(ctx.amount) || 0;
      totalExpenses += amount;
      
      const cat = ctx.category || 'Crédito';
      categorySpendingMap[cat] = (categorySpendingMap[cat] || 0) + amount;

      if (!biggestSpendField || amount > (Number(biggestSpendField.amount) || 0)) {
        // Mock transaction for listing
        biggestSpendField = {
          id: ctx.id,
          description: `[Crédito] ${ctx.description}`,
          amount: amount,
          currency: activeCurrency,
          date: ctx.date,
          type: TransactionType.Despesa,
          category: cat
        };
      }
    });

    const netProfit = totalIncome - totalExpenses;
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Format categories for recharts and progress bars
    const spendingByCategory = Object.entries(categorySpendingMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 105 : 0
    })).sort((a, b) => b.amount - a.amount);

    const incomeByCategory = Object.entries(categoryIncomeMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 105 : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      margin,
      biggestGain: biggestGainField,
      biggestSpend: biggestSpendField,
      spendingByCategory,
      incomeByCategory
    };
  }, [filteredTx, creditTransactions, activeCurrency, selectedMonth, token]);

  // Chronological Cash Flow for AreaChart
  const timelineData = useMemo(() => {
    const dailyData: { [key: string]: { date: string; Entradas: number; Saídas: number } } = {};
    
    // Fill previous days
    filteredTx.slice().reverse().forEach(t => {
      const dateStr = t.date ? t.date.substring(5, 10).split('-').reverse().join('/') : ''; // "DD/MM"
      if (!dateStr) return;
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, Entradas: 0, Saídas: 0 };
      }
      
      const val = Number(t.amount) || 0;
      if (t.type === TransactionType.Receita) {
        dailyData[dateStr].Entradas += val;
      } else if (t.type === TransactionType.Despesa && !isInternalTransfer(t.category)) {
        dailyData[dateStr].Saídas += val;
      }
    });

    return Object.values(dailyData).slice(-15); // Show latest 15 active days
  }, [filteredTx]);

  // Local AI rule engine advisor for 100% reliable insights
  const automatedInsights = useMemo(() => {
    const { margin, totalExpenses, totalIncome, biggestGain, biggestSpend, spendingByCategory } = metrics;
    const tips = [];

    if (totalIncome === 0 && totalExpenses === 0) {
      return [
        {
          title: "Inicie seus Registros para receber Insights",
          description: "Comece cadastrando suas receitas e despesas na tela de transações para obter um diagnóstico financeiro completo em tempo real.",
          type: "neutral"
        }
      ];
    }

    // 1. Profit Margin diagnostic
    if (margin > 30) {
      tips.push({
        title: "Excelente Gestão de Lucros! 🚀",
        description: `Sua margem líquida atual é de ${margin.toFixed(1)}%. Isso significa que você está conseguindo reter uma excelente fatia do seu faturamento para investimentos ou reservas.`,
        type: "success"
      });
    } else if (margin > 10) {
      tips.push({
        title: "Fluxo Equilibrado sob Controle 👍",
        description: `Você possui uma margem líquida positiva de ${margin.toFixed(1)}%. Há espaço para otimização de gastos secundários e aumento de aportes em carteira proativamente.`,
        type: "warning"
      });
    } else {
      tips.push({
        title: "Alerta de Saúde de Caixa ⚠️",
        description: `Sua margem de retenção é de apenas ${margin.toFixed(1)}%. Seus custos estão consumindo quase todo o seu faturamento. Recomendamos revisar despesas fixas recorrentes imediatas.`,
        type: "danger"
      });
    }

    // 2. High-performance analysis on "Maior Ganho" (Top Income source) e "Lucros"
    if (biggestGain) {
      const proportionOfTotal = totalIncome > 0 ? ((Number(biggestGain.amount) || 0) / totalIncome) * 100 : 0;
      tips.push({
        title: `Maior Alavanca Financeira: [${biggestGain.description}] 💡`,
        description: `Seu maior faturamento individual neste período foi de ${formatValue(Number(biggestGain.amount))}, representando ${proportionOfTotal.toFixed(1)}% de todas as suas entradas de caixa.`,
        type: "success"
      });
    }

    // 3. Category leak diagnostic (Onde está gastando)
    if (spendingByCategory.length > 0) {
      const topCat = spendingByCategory[0];
      tips.push({
        title: `Vazamento Crítico em "${topCat.category}" 🛑`,
        description: `A categoria "${topCat.category}" representa seu maior ralo de caixa com ${formatValue(topCat.amount)}, devorando cerca de ${topCat.percentage.toFixed(1)}% do seu orçamento total.`,
        type: "default"
      });
    }

    // 4. Action plan
    if (totalExpenses > totalIncome) {
      tips.push({
        title: "Plano de Redução Emergencial de Despesas ⚡",
        description: "Seu caixa está operando em saldo negativo. Pause assinaturas não utilizadas agora ou converta faturas pesadas em parcelas gerenciáveis no menu correspondente.",
        type: "danger"
      });
    } else {
      tips.push({
        title: "Estratégia de Alocação Inteligente 🎯",
        description: `Você possui um lucro líquido disponível de ${formatValue(totalIncome - totalExpenses)}. Sugerimos aplicar 50% em seus Ativos com rendimento para construir sua aposentadoria programada.`,
        type: "success"
      });
    }

    return tips;
  }, [metrics, activeCurrency]);

  // Handle AI Chat submissions with local fallback or service prompt
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newUserMessage: Message = { role: 'user', content: userMessage };
    const currentMessages = [...messages, newUserMessage];
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      const response = await aiService.askQuestion(
        userMessage, 
        filteredTx, 
        investments, 
        creditCards, 
        creditTransactions, 
        currentUser
      );
      const assistantMessage: Message = { role: 'assistant', content: response };
      const finalMessages = [...currentMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save
      await api.saveAiConversation({
        messages: finalMessages.map(m => ({ ...m, timestamp: new Date().toISOString() })),
        lastUpdate: new Date().toISOString()
      }, token);

    } catch (error) {
      console.error("Gemini configuration issue, triggering local financial analytics engine fallback.");
      // Complete rich local analytics answers automatically
      let answer = `Compreendo sua dúvida e analisei detalhadamente seu fluxo de caixa.\n\n`;
      answer += `**Resumo de Performance:**\n`;
      answer += `- **Faturamento/Entradas Totais**: ${formatValue(metrics.totalIncome)}\n`;
      answer += `- **Gastos Executados**: ${formatValue(metrics.totalExpenses)}\n`;
      answer += `- **Resultado Final (Lucro Líquido)**: ${formatValue(metrics.netProfit)} (Margem de ${metrics.margin.toFixed(1)}%)\n\n`;

      if (metrics.biggestGain) {
        answer += `-🏆 **Maior Ganho**: O faturamento \`${metrics.biggestGain.description}\` de **${formatValue(Number(metrics.biggestGain.amount))}** foi sua maior fonte de entrada.\n`;
      }
      if (metrics.spendingByCategory.length > 0) {
        answer += `-🔍 **Maior Gasto**: Você está concentrando suas despesas em \`${metrics.spendingByCategory[0].category}\` com um total de **${formatValue(metrics.spendingByCategory[0].amount)}**.\n`;
      }
      
      answer += `\n**Conselho Estratégico:** Mantenha um acompanhamento rigoroso sob o dreno de recursos de categorias não essenciais para viabilizar maiores lucros. Se precisar de mais ajustes em links de faturamento ou relatórios, me avise!`;

      const fallbackMsg: Message = { role: 'assistant', content: answer };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    if (token) {
        await api.saveAiConversation({ messages: [], lastUpdate: new Date().toISOString() }, token);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 md:px-4 pb-12">
      {/* Dynamic Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm tracking-wider uppercase">
            <Activity className="w-4 h-4 animate-pulse" />
            Performance Financeira
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Diagnóstico e Fluxo de Caixa Completo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Visão avançada sobre maior ganho, margens de lucro de fato e despesas por categoria</p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Controls */}
          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-1 flex border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setActiveCurrency('BRL')} 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeCurrency === 'BRL' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-400'}`}
            >
              BRL (R$)
            </button>
            <button 
              onClick={() => setActiveCurrency('USD')} 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeCurrency === 'USD' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-400'}`}
            >
              USD ($)
            </button>
          </div>

          {/* Month Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold px-4 py-2 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">Todo o Histórico</option>
              {availableMonths.map(m => {
                const [year, month] = m.split('-');
                return <option key={m} value={m}>{`${month}/${year}`}</option>;
              })}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Primary Intelligence Dashboard: Bento Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lucid Profit Metrics (Meus Lucros) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
              Meus Lucros Líquidos
              <Award className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">
              {formatValue(metrics.netProfit)}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${metrics.margin >= 30 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                Margem: {metrics.margin.toFixed(1)}%
              </span>
              <span className="text-slate-400 text-[10px]">retido</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 dark:border-slate-700/60 pt-2">
            Entradas: {formatValue(metrics.totalIncome)} | Saídas: {formatValue(metrics.totalExpenses)}
          </div>
        </div>

        {/* Highest Income Lever (Maior Ganho) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">
              Maior Faturamento / Ganho
              <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            {metrics.biggestGain ? (
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-white truncate" title={metrics.biggestGain.description}>
                  {metrics.biggestGain.description}
                </p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatValue(Number(metrics.biggestGain.amount))}
                </p>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-400 mt-2">Sem receitas registradas no momento</p>
            )}
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2 mt-2">
            Categoria: <span className="font-bold uppercase text-slate-500 dark:text-slate-300">{metrics.biggestGain?.category || '---'}</span>
          </div>
        </div>

        {/* Dominant Outflow (Maior Gasto / Vazamento) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
              Maior Gasto Unificado
              <div className="bg-rose-100 dark:bg-rose-900/30 p-1.5 rounded-lg">
                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            {metrics.biggestSpend ? (
              <div>
                <p className="text-xl font-black text-slate-850 dark:text-white truncate" title={metrics.biggestSpend.description}>
                  {metrics.biggestSpend.description}
                </p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  -{formatValue(Number(metrics.biggestSpend.amount))}
                </p>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-400 mt-2">Sem despesas registradas no momento</p>
            )}
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2 mt-2">
            Categoria: <span className="font-bold uppercase text-slate-500 dark:text-slate-300">{metrics.biggestSpend?.category || '---'}</span>
          </div>
        </div>

        {/* Financial Flow Efficiency index */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
              Fator de Produtividade
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-lg">
                <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-3xl font-extrabold text-slate-950 dark:text-white">
                {metrics.totalIncome > 0 ? (metrics.totalIncome / (metrics.totalExpenses || 1)).toFixed(2) : '0.00'}
              </span>
              <p className="text-[10px] text-slate-400 mt-2">Razão de faturamento x total gasto real. Um fator maior que 1.5 indica contas robustas.</p>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2 mt-1">
            Status: <span className="font-bold text-indigo-500">{metrics.totalIncome > metrics.totalExpenses ? "Superávit Positivo" : "Sob Pressão"}</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Category Spending vs Revenues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category spending (Gasto de categorias) */}
        <div id="gasto-categorias" className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Gasto de Categorias (Onde está gastando)</h2>
          </div>

          {metrics.spendingByCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <p className="text-slate-400 text-sm font-medium">Nenhuma despesa para esta seleção de filtro.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Performance category progress bars */}
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                {metrics.spendingByCategory.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="capitalize">{item.category}</span>
                      <span>{formatValue(item.amount)} <span className="text-[10px] text-slate-400 font-normal">({item.percentage.toFixed(0)}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Recharts Visualization */}
              <div className="h-56 w-full pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.spendingByCategory.slice(0, 6)}>
                    <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip 
                      formatter={(value) => [formatValue(Number(value) || 0), 'Total Gasto']}
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {metrics.spendingByCategory.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`rgba(239, 68, 68, ${Math.max(0.4, 1 - index * 0.15)})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Entradas/Ganhos por Categoria (Origem de faturamento) */}
        <div id="origem-ganhos" className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Origem de Ganhos / Lucros</h2>
          </div>

          {metrics.incomeByCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <p className="text-slate-400 text-sm font-medium">Nenhuma receita para esta seleção de filtro.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress bars */}
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                {metrics.incomeByCategory.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="capitalize">{item.category}</span>
                      <span>{formatValue(item.amount)} <span className="text-[10px] text-slate-400 font-normal">({item.percentage.toFixed(0)}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Recharts Visualization */}
              <div className="h-56 w-full pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.incomeByCategory.slice(0, 6)}>
                    <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip 
                      formatter={(value) => [formatValue(Number(value) || 0), 'Total Recebido']}
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {metrics.incomeByCategory.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`rgba(16, 185, 129, ${Math.max(0.4, 1 - index * 0.15)})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cash Flow Timeline Segment */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Linha de Fluxo de Caixa (15 dias ativos)</h2>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black">Entradas vs Saídas</span>
        </div>

        {timelineData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <p className="text-slate-400 text-sm font-medium">Sem dados históricos diários para apresentar no gráfico.</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [formatValue(Number(value) || 0)]}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="Entradas" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorEntradas)" />
                <Area type="monotone" dataKey="Saídas" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSaidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Real-time automated advisor insights */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-8 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Recomendações e Plano de Ação Personalizado</h2>
            <p className="text-xs text-slate-400">Gerado matematicamente com base em seu faturamento e ralo de categorias do período</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automatedInsights.map((insight, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                insight.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40' :
                insight.type === 'danger' ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40' :
                insight.type === 'warning' ? 'bg-amber-950/20 border-amber-500/20 hover:border-amber-500/40' :
                'bg-slate-800 border-slate-700/60 hover:border-slate-700'
              }`}
            >
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${
                  insight.type === 'success' ? 'text-emerald-400' :
                  insight.type === 'danger' ? 'text-rose-400' :
                  insight.type === 'warning' ? 'text-amber-400' :
                  'text-blue-400'
                }`}>
                  {insight.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive FAQ & AI Chat toggle */}
      <div className="border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
        <button 
          onClick={() => setShowChat(!showChat)}
          className="w-full flex items-center justify-between p-6 text-left transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-md font-black text-slate-950 dark:text-white">Perguntar ao Assistente de Inteligência Artificial</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tire dúvidas complexas sobre investimento, juros, câmbio ou otimização de faturamento</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showChat ? 'rotate-180' : ''}`} />
        </button>

        {showChat && (
          <div className="border-t border-slate-100 dark:border-slate-700/60 p-6 space-y-4">
            {/* Messages Log */}
            <div className="max-h-72 overflow-y-auto space-y-4 pr-1 scroll-smooth">
              {messages.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Ainda sem histórico nesta sessão. Pergunte qualquer coisa digitando no campo abaixo ou use uma sugestão!
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <button onClick={() => setInput("Como posso cortar gastos da maior categoria de despesa?")} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700">
                      Como cortar o maior gasto?
                    </button>
                    <button onClick={() => setInput("O que fazer com o lucro liquido obtido para render mais?")} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700">
                      Onde investir o lucro líquido?
                    </button>
                  </div>
                </div>
              )}

              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-150 dark:border-slate-850'
                  }`}>
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl rounded-tl-none text-xs text-slate-440 animate-pulse">
                    Money AI está analisando...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte aqui... ex: 'Como posso melhorar minha margem líquida?'"
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
