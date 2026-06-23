import React, { useState, useMemo } from 'react';
import { RocketLaunchIcon } from '../components/icons/RocketLaunchIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ChartPieIcon } from '../components/icons/ChartPieIcon';
import { SwitchHorizontalIcon } from '../components/icons/SwitchHorizontalIcon';
import { Plan, BillingCycle, Currency, Language } from '../types';
import { useTranslation } from '../translations';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard as LucideCreditCard, 
  TrendingUp, 
  Calendar as LucideCalendar, 
  Sparkles, 
  Plus, 
  ArrowLeftRight, 
  Search, 
  CheckCircle,
  FileDown,
  Trash2,
  ChevronRight,
  ArrowRight,
  BookmarkCheck,
  AlertCircle,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: (plan: Plan, cycle: BillingCycle) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(() => (localStorage.getItem('selected_currency') as Currency) || 'BRL');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'pt-BR');
  
  const t = useTranslation(language);

  // --- DEMO INTERATIVA DO SISTEMA ---
  const [demoTab, setDemoTab] = useState<'Painel' | 'Transações' | 'Cartões' | 'Investimentos' | 'Assinaturas' | 'Agenda'>('Painel');
  const [demoCurrency, setDemoCurrency] = useState<Currency>('BRL');
  
  const exchangeRate = 5.4;
  
  const formatDemoVal = (val: number) => {
    if (demoCurrency === 'USD') {
      const usdVal = val / exchangeRate;
      return usdVal.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const [demoTransactions, setDemoTransactions] = useState([
    { id: 1, date: '2026-06-22', title: language === 'pt-BR' ? 'Desenvolvimento de Software GTS' : 'GTS Software Development', amount: 8200.00, type: 'INCOME', category: 'Desenvolvimento', wallet: 'Banco Inter' },
    { id: 2, date: '2026-06-21', title: language === 'pt-BR' ? 'Supermercado Pão de Açúcar' : 'Pao de Acucar Supermarket', amount: -380.00, type: 'EXPENSE', category: 'Alimentação', wallet: 'Nubank' },
    { id: 3, date: '2026-06-20', title: language === 'pt-BR' ? 'Dividendos de Ações' : 'Stock Dividends', amount: 150.00, type: 'INCOME', category: 'Investimentos', wallet: 'XP Investimentos' },
    { id: 4, date: '2026-06-18', title: language === 'pt-BR' ? 'Assinatura AWS Cloud' : 'AWS Cloud Subscription', amount: -210.00, type: 'EXPENSE', category: 'Serviços', wallet: 'Inter Global' },
    { id: 5, date: '2026-06-15', title: language === 'pt-BR' ? 'Combustível Posto Shell' : 'Shell Gas Station', amount: -150.00, type: 'EXPENSE', category: 'Transporte', wallet: 'Nubank' },
    { id: 6, date: '2026-06-10', title: language === 'pt-BR' ? 'Venda de Criptoativos' : 'Crypto Sale Profit', amount: 1200.00, type: 'INCOME', category: 'Investimentos', wallet: 'Binance' },
  ]);

  const [newTxTitle, setNewTxTitle] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxType, setNewTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [newTxCategory, setNewTxCategory] = useState('Alimentação');
  const [demoSearchQuery, setDemoSearchQuery] = useState('');
  const [isDemoTransferOpen, setIsDemoTransferOpen] = useState(false);
  const [demoTransferAmount, setDemoTransferAmount] = useState('');
  const [demoTransferFrom, setDemoTransferFrom] = useState('BRL');
  const [showDemoNotification, setShowDemoNotification] = useState<string | null>(null);

  const demoTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    demoTransactions.forEach(t => {
      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += Math.abs(t.amount);
      }
    });
    const balance = income - expense;
    const invested = 35000.00;
    const netWorth = balance + invested;
    const margin = income > 0 ? ((income - expense) / income) * 100 : 0;

    return { balance, income, expense, invested, netWorth, margin };
  }, [demoTransactions]);

  const triggerNotification = (msg: string) => {
    setShowDemoNotification(msg);
    setTimeout(() => {
      setShowDemoNotification(null);
    }, 4000);
  };

  const handleAddDemoTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxTitle.trim() || !newTxAmount) return;
    const amountVal = parseFloat(newTxAmount);
    if (isNaN(amountVal)) return;

    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      title: newTxTitle.trim(),
      amount: newTxType === 'INCOME' ? amountVal : -amountVal,
      type: newTxType,
      category: newTxCategory,
      wallet: 'Carteira Demo'
    };

    setDemoTransactions([newTx, ...demoTransactions]);
    setNewTxTitle('');
    setNewTxAmount('');
    triggerNotification(language === 'pt-BR' ? 'Transação adicionada com sucesso!' : 'Transaction added successfully!');
  };

  const handleDemoTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoTransferAmount) return;
    const amountVal = parseFloat(demoTransferAmount);
    if (isNaN(amountVal)) return;

    if (demoTransferFrom === 'BRL') {
      const newTxOut = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        title: language === 'pt-BR' ? 'Câmbio: Saída de BRL' : 'Exchange: BRL Outflow',
        amount: -amountVal,
        type: 'EXPENSE',
        category: 'Câmbio',
        wallet: 'Carteira BRL'
      };
      const newTxIn = {
        id: Date.now() + 1,
        date: new Date().toISOString().split('T')[0],
        title: language === 'pt-BR' ? 'Câmbio: Entrada de USD' : 'Exchange: USD Inflow',
        amount: amountVal,
        type: 'INCOME',
        category: 'Câmbio',
        wallet: 'Carteira USD'
      };
      setDemoTransactions([newTxOut, newTxIn, ...demoTransactions]);
    } else {
      const newTxOut = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        title: language === 'pt-BR' ? 'Câmbio: Saída de USD' : 'Exchange: USD Outflow',
        amount: -amountVal,
        type: 'EXPENSE',
        category: 'Câmbio',
        wallet: 'Carteira USD'
      };
      const newTxIn = {
        id: Date.now() + 1,
        date: new Date().toISOString().split('T')[0],
        title: language === 'pt-BR' ? 'Câmbio: Entrada de BRL' : 'Exchange: BRL Inflow',
        amount: amountVal,
        type: 'INCOME',
        category: 'Câmbio',
        wallet: 'Carteira BRL'
      };
      setDemoTransactions([newTxOut, newTxIn, ...demoTransactions]);
    }

    setIsDemoTransferOpen(false);
    setDemoTransferAmount('');
    triggerNotification(language === 'pt-BR' ? 'Câmbio processado instantaneamente!' : 'Currency exchange completed instantly!');
  };

  const handleDeleteDemoTx = (id: number) => {
    setDemoTransactions(demoTransactions.filter(t => t.id !== id));
    triggerNotification(language === 'pt-BR' ? 'Transação removida!' : 'Transaction removed!');
  };

  const toggleLanguage = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('language', lang);
  };

  const toggleCurrency = (curr: Currency) => {
      setDisplayCurrency(curr);
      localStorage.setItem('selected_currency', curr);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const prices = {
      BRL: {
          PRO: billingCycle === 'MONTHLY' ? '39,90' : '399,90',
          VIP: billingCycle === 'MONTHLY' ? '79,90' : '799,90',
          symbol: 'R$',
          period: billingCycle === 'MONTHLY' ? '/mês' : '/ano'
      },
      USD: {
          PRO: billingCycle === 'MONTHLY' ? '9.90' : '99.90',
          VIP: billingCycle === 'MONTHLY' ? '19.90' : '199.90',
          symbol: '$',
          period: billingCycle === 'MONTHLY' ? '/mo' : '/yr'
      }
  };

  const currentPrices = prices[displayCurrency];

  return (
    <div className="font-sans text-slate-600 bg-white overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-200">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                 </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Money <span className="text-blue-600">Dashs</span></span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-blue-600 transition-colors">{t('features')}</a>
                <a href="#qualidades" onClick={(e) => scrollToSection(e, 'qualidades')} className="hover:text-blue-600 transition-colors">{language === 'pt-BR' ? 'Qualidades' : 'Qualities'}</a>
                <a href="#beneficios" onClick={(e) => scrollToSection(e, 'beneficios')} className="hover:text-blue-600 transition-colors">{t('benefits')}</a>
                <a href="#planos" onClick={(e) => scrollToSection(e, 'planos')} className="hover:text-blue-600 transition-colors">{t('plans')}</a>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden xs:flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
                  <button onClick={() => toggleLanguage('pt-BR')} className={`px-2 py-1 rounded-full text-[10px] font-bold ${language === 'pt-BR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>PT</button>
                  <button onClick={() => toggleLanguage('en-US')} className={`px-2 py-1 rounded-full text-[10px] font-bold ${language === 'en-US' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
              </div>
              
              <button onClick={onLogin} className="text-slate-600 hover:text-blue-600 font-bold text-xs md:text-sm transition-colors px-2">
                {language === 'pt-BR' ? 'Entrar' : 'Sign In'}
              </button>
              <button onClick={() => onRegister('FREE', 'MONTHLY')} className="bg-slate-900 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-[10px] md:text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                {language === 'pt-BR' ? 'Começar' : 'Start Free'}
              </button>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[80px] -z-10 opacity-60"></div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                {language === 'pt-BR' ? 'Suporte Multi-moedas (BRL/USD) Liberado' : 'Multi-currency Support (USD/BRL) Enabled'}
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 animate-fade-in-up">
                {language === 'pt-BR' ? (
                  <>Gestão Financeira <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Sem Fronteiras.</span></>
                ) : (
                  <>Financial Management <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Without Borders.</span></>
                )}
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 mb-10 leading-relaxed animate-fade-in-up">
                {language === 'pt-BR' 
                    ? 'Controle seu patrimônio no Brasil e no exterior em um único lugar. Separe custo de vida de aportes e veja sua riqueza crescer.'
                    : 'Track your wealth in multiple currencies and countries in one place. Separate expenses from investments and watch your net worth grow.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-fade-in-up">
                <button onClick={() => onRegister('FREE', 'MONTHLY')} className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-sm md:text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:scale-105 flex items-center justify-center gap-2">
                    {language === 'pt-BR' ? 'Criar Conta Gratuita' : 'Start Free Today'} <span className="text-blue-200">&rarr;</span>
                </button>
            </div>

            {/* --- MOCKUP DO SISTEMA --- */}
            <div className="relative mx-auto max-w-6xl animate-fade-in-up px-4">
                <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden aspect-[16/10] flex flex-col transition-transform duration-500 hover:scale-[1.01]">
                    {/* Barra do Navegador */}
                    <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-100">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-400 font-medium flex items-center gap-2 w-full max-w-md justify-center">
                                <span className="opacity-50">🔒</span> moneydashs.com
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex bg-[#f8fafc] overflow-hidden">
                        {/* Sidebar Mockup */}
                        <div className="hidden md:flex w-64 bg-[#0a0f1e] flex-col p-6">
                             <div className="flex items-center gap-3 mb-10 px-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white/40 rounded-full"></div>
                                </div>
                                <span className="text-white font-bold text-xl tracking-tight">Money Dashs</span>
                             </div>
                             <div className="space-y-2">
                                 <div className="flex items-center px-4 py-3 bg-blue-600/20 text-blue-400 rounded-xl text-xs font-bold gap-3 border border-blue-600/20">
                                     <div className="w-4 h-4 bg-blue-400/20 rounded-md"></div> Painel
                                 </div>
                                 <div className="flex items-center px-4 py-3 text-slate-500 rounded-xl text-xs font-bold gap-3">
                                     <div className="w-4 h-4 border border-slate-800 rounded-md"></div> Transações
                                 </div>
                             </div>
                        </div>

                        {/* Content Area Mockup */}
                        <div className="flex-1 flex flex-col bg-[#f8fafc]">
                            <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8">
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                     <div className="px-4 py-1.5 bg-[#0a0f1e] rounded-md text-[10px] flex items-center justify-center text-white font-black">USD</div>
                                     <div className="px-4 py-1.5 rounded-md text-[10px] flex items-center justify-center text-slate-400 font-black">BRL</div>
                                </div>
                                <div className="px-6 py-2 bg-indigo-600 rounded-xl flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-indigo-100 uppercase tracking-widest">Transferir</div>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-4 gap-6 mb-8">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-24">
                                            <div className="w-8 h-2 bg-slate-100 rounded mb-4"></div>
                                            <div className="w-16 h-4 bg-slate-50 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-64">
                                     <div className="w-full h-full bg-slate-50/50 rounded-2xl border border-dashed border-slate-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">{t('features')}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto mb-16 text-lg">{t('feature4Desc')}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-2xl transition-all group text-left">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform"><SwitchHorizontalIcon className="w-8 h-8" /></div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{t('feature1Title')}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{t('feature1Desc')}</p>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-2xl transition-all group text-left">
                      <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform"><TrendingUpIcon className="w-8 h-8" /></div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{t('feature2Title')}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{t('feature2Desc')}</p>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-2xl transition-all group text-left">
                      <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform"><CalendarIcon className="w-8 h-8" /></div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{t('feature3Title')}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{t('feature3Desc')}</p>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-purple-200 hover:bg-white hover:shadow-2xl transition-all group text-left">
                      <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform"><ChartPieIcon className="w-8 h-8" /></div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{t('feature4Title')}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{t('feature4Desc')}</p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- NOVA SECÇÃO: QUALIDADES DO SISTEMA (COM IMAGEM) --- */}
      <section id="qualidades" className="py-24 bg-slate-50 border-t border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Coluna do Texto / Qualidades */}
            <div className="w-full lg:w-1/2 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                {language === 'pt-BR' ? 'Excelência Estratégica' : 'Strategic Excellence'}
              </div>
              
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {language === 'pt-BR' 
                  ? 'O Planeamento Inteligente que a sua Vida Financeira Exige' 
                  : 'The Intelligent Planning Your Financial Life Demands'}
              </h2>
              
              <p className="text-slate-500 text-lg leading-relaxed">
                {language === 'pt-BR'
                  ? 'Não se trata apenas de registar despesas. O Money Dashs entrega uma arquitetura completa para desenhar o seu futuro, permitindo visibilidade de longo prazo e decisões baseadas em dados reais.'
                  : 'It is not just about logging expenses. Money Dashs delivers a complete architecture to design your future, allowing long-term visibility and decisions based on real data.'}
              </p>

              {/* Lista de Qualidades Metrificadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-white rounded-xl shadow-md text-blue-600 border border-slate-100">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{language === 'pt-BR' ? 'Segurança Absoluta' : 'Absolute Security'}</h4>
                    <p className="text-slate-500 text-sm mt-1">{language === 'pt-BR' ? 'Dados encriptados de ponta a ponta.' : 'End-to-end encrypted data.'}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-white rounded-xl shadow-md text-indigo-600 border border-slate-100">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{language === 'pt-BR' ? 'Agilidade Global' : 'Global Agility'}</h4>
                    <p className="text-slate-500 text-sm mt-1">{language === 'pt-BR' ? 'Conversão e atualização em tempo real.' : 'Real-time conversion & updates.'}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-white rounded-xl shadow-md text-emerald-600 border border-slate-100">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{language === 'pt-BR' ? 'Visão de Futuro' : 'Future Vision'}</h4>
                    <p className="text-slate-500 text-sm mt-1">{language === 'pt-BR' ? 'Previsibilidade orçamental precisa.' : 'Accurate budget predictability.'}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-white rounded-xl shadow-md text-purple-600 border border-slate-100">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{language === 'pt-BR' ? 'Interface Premium' : 'Premium Interface'}</h4>
                    <p className="text-slate-500 text-sm mt-1">{language === 'pt-BR' ? 'Fácil, limpa e altamente intuitiva.' : 'Easy, clean, and highly intuitive.'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna da Imagem Requisitada com Efeitos */}
            <div className="w-full lg:w-1/2 relative flex justify-center">
              <div className="relative max-w-lg lg:max-w-full rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-slate-200/60 bg-white p-4 group">
                
                {/* Imagem em si */}
                <img 
                  src="https://primeirapagina.com.br/wp-content/uploads/2024/07/planejamento-financeiro.jpg" 
                  alt="Planeamento Financeiro Inteligente" 
                  className="rounded-2xl object-cover w-full h-[350px] sm:h-[450px] transition-transform duration-700 group-hover:scale-105"
                />

                {/* Badge Flutuante em Glassmorphism sobre a imagem */}
                <div className="absolute bottom-10 left-10 right-10 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/40 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-slate-800">
                      {language === 'pt-BR' ? 'Gráficos de Crescimento Ativos' : 'Growth Charts Active'}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                    100% Digital
                  </span>
                </div>
                
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- BENEFITS SECTION --- */}
      <section id="beneficios" className="py-32 bg-[#020617] text-white overflow-hidden relative">
          {/* Luz de fundo sutil */}
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-24">
                  <div className="lg:w-1/2">
                        <h2 className="text-4xl md:text-6xl font-extrabold mb-12 leading-tight tracking-tight">
                          {language === 'pt-BR' ? 'Por que escolher o Money Dashs?' : 'Why choose Money Dashs?'}
                      </h2>
                      <div className="space-y-12">
                          <div className="flex gap-8 group">
                              <div className="flex-shrink-0 w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-blue-400 border border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                  <RocketLaunchIcon className="w-6 h-6" />
                              </div>
                              <div>
                                  <h4 className="text-2xl font-bold mb-3">{t('benefit1Title')}</h4>
                                  <p className="text-slate-400 text-lg leading-relaxed">{t('benefit1Desc')}</p>
                              </div>
                          </div>
                          <div className="flex gap-8 group">
                              <div className="flex-shrink-0 w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-indigo-400 border border-white/10 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                  <UsersIcon className="w-6 h-6" />
                              </div>
                              <div>
                                  <h4 className="text-2xl font-bold mb-3">{t('benefit2Title')}</h4>
                                  <p className="text-slate-400 text-lg leading-relaxed">{t('benefit2Desc')}</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="lg:w-1/2 relative w-full flex justify-center lg:justify-end">
                      {/* Glass Container da Imagem */}
                      <div className="relative p-12 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-50"></div>
                           
                           {/* Card de Investimento */}
                           <div className="relative bg-[#0a0f1e]/80 p-8 rounded-3xl border border-white/10 shadow-2xl min-w-[320px] md:min-w-[450px] transform transition-transform group-hover:translate-y-[-10px]">
                               <div className="flex justify-between items-center gap-12">
                                   <div className="flex items-center gap-5">
                                       <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center font-black text-lg border border-green-500/20 shadow-lg shadow-green-500/5">$$</div>
                                       <div>
                                           <p className="text-xl font-bold text-white tracking-tight">Investimentos</p>
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       <span className="text-2xl font-black text-[#22c55e] drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">R$ 15.000,00</span>
                                   </div>
                                </div>
                           </div>

                           {/* Elementos decorativos */}
                           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px]"></div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="planos" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">{language === 'pt-BR' ? 'Pronto para evoluir?' : 'Ready to evolve?'}</h2>
                  <div className="flex flex-col items-center gap-6">
                      <div className="bg-slate-200 p-1 rounded-full flex relative inline-flex">
                          <button onClick={() => setBillingCycle('MONTHLY')} className={`px-8 py-2 text-sm font-bold rounded-full transition-all duration-300 ${billingCycle === 'MONTHLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{language === 'pt-BR' ? 'Mensal' : 'Monthly'}</button>
                          <button onClick={() => setBillingCycle('ANNUAL')} className={`px-8 py-2 text-sm font-bold rounded-full transition-all duration-300 ${billingCycle === 'ANNUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{language === 'pt-BR' ? 'Anual' : 'Annual'}</button>
                      </div>
                      
                      <div className="flex gap-4">
                        <button onClick={() => toggleCurrency('BRL')} className={`text-xs font-black tracking-widest ${displayCurrency === 'BRL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>BRL (R$)</button>
                        <button onClick={() => toggleCurrency('USD')} className={`text-xs font-black tracking-widest ${displayCurrency === 'USD' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>USD ($)</button>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {/* LIVRE (FREE) */}
                  <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col items-start text-left">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">LIVRE</span>
                      <h3 className="text-5xl font-black text-slate-900 mb-3">{language === 'pt-BR' ? 'Grátis' : 'Free'}</h3>
                      <p className="text-slate-400 text-sm font-medium mb-10">{language === 'pt-BR' ? 'Organização básica' : 'Basic Organization'}</p>
                      
                      <ul className="space-y-4 mb-12 flex-grow">
                          <li className="flex items-center gap-3 text-sm text-slate-600 font-medium"><CheckCircleIcon className="w-5 h-5 text-green-500" /> {language === 'pt-BR' ? 'Fluxo de Caixa' : 'Cash Flow'}</li>
                          <li className="flex items-center gap-3 text-sm text-slate-600 font-medium"><CheckCircleIcon className="w-5 h-5 text-green-500" /> {language === 'pt-BR' ? 'Cadastro de Transações' : 'Transaction Logging'}</li>
                          <li className="flex items-center gap-3 text-sm text-slate-300 font-medium"><div className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px]">✕</div> {language === 'pt-BR' ? 'Sem medida Multi-moeda' : 'No Multi-currency'}</li>
                      </ul>
                      
                      <button onClick={() => onRegister('FREE', 'MONTHLY')} className="w-full py-4 px-6 border border-slate-200 text-slate-900 rounded-xl font-bold text-base hover:bg-slate-50 transition-colors">{language === 'pt-BR' ? 'Começar agora' : 'Get Started'}</button>
                  </div>

                  {/* PRÓ (PRO) */}
                  <div className="bg-white rounded-3xl p-10 border-[3px] border-blue-600 shadow-2xl shadow-blue-100 relative transform md:-translate-y-4 flex flex-col items-start text-left z-10">
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-bl-2xl rounded-tr-xl tracking-widest shadow-lg">GLOBAL</div>
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">PRÓ</span>
                      <div className="flex items-baseline gap-1 mb-3">
                          <h3 className="text-5xl font-black text-slate-900">{currentPrices.symbol} {currentPrices.PRO}</h3>
                          <span className="text-slate-300 text-3xl">/</span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium mb-10">{language === 'pt-BR' ? 'Total BRL/USD' : 'Full BRL/USD Control'}</p>
                      <ul className="space-y-4 mb-12 flex-grow">
                          <li className="flex items-center gap-3 text-sm text-slate-600 font-bold"><CheckCircleIcon className="w-5 h-5 text-blue-600" /> {language === 'pt-BR' ? 'Gestão Multimoedas' : 'Multi-currency Management'}</li>
                          <li className="flex items-center gap-3 text-sm text-slate-600 font-medium"><CheckCircleIcon className="w-5 h-5 text-blue-600" /> {language === 'pt-BR' ? 'Relatórios de Patrimônio' : 'Net Worth Reports'}</li>
                          <li className="flex items-center gap-3 text-sm text-slate-600 font-medium"><CheckCircleIcon className="w-5 h-5 text-blue-600" /> {language === 'pt-BR' ? 'Carteira de Investimentos' : 'Investment Portfolio'}</li>
                      </ul>
                      <button onClick={() => onRegister('PRO', billingCycle)} className="w-full py-4 px-6 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">{language === 'pt-BR' ? 'Assinar PRÓ' : 'Subscribe PRO'}</button>
                  </div>

                  {/* VIP */}
                  <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col items-start text-left">
                      <span className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4">VIP</span>
                      <div className="flex items-baseline gap-1 mb-3">
                          <h3 className="text-5xl font-black text-slate-900">{currentPrices.symbol} {currentPrices.VIP}</h3>
                          <span className="text-slate-300 text-3xl">/</span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium mb-10">{language === 'pt-BR' ? 'Especializado' : 'Concierge Support'}</p>
                      <ul className="space-y-4 mb-12 flex-grow">
                          <li className="flex items-center gap-3 text-sm text-slate-600 font-medium"><CheckCircleIcon className="w-5 h-5 text-purple-600" /> {language === 'pt-BR' ? 'Tudo do plano PRO' : 'Everything in PRO'}</li>
                          <li className="flex items-center gap-3 text-sm text-slate-600 font-medium"><CheckCircleIcon className="w-5 h-5 text-purple-600" /> {language === 'pt-BR' ? 'Insights com IA avançado' : 'Advanced AI Insights'}</li>
                          <li className="flex items-center gap-3 text-sm text-slate-600 font-medium"><CheckCircleIcon className="w-5 h-5 text-purple-600" /> {language === 'pt-BR' ? 'pagar Prioritário' : 'Priority Payouts'}</li>
                      </ul>
                      <button onClick={() => onRegister('VIP', billingCycle)} className="w-full py-4 px-6 border border-purple-200 text-purple-600 rounded-xl font-bold text-base hover:bg-purple-50 transition-colors">{language === 'pt-BR' ? 'Assinar VIP' : 'Get VIP Access'}</button>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#020617] text-slate-400 py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="bg-blue-600 p-1.5 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  </div>
                  <span className="text-xl font-bold text-white">Money Dashs</span>
              </div>
              <p className="text-xs">© 2025 Money Dashs. Powered by <span className="text-blue-500 font-bold">GTS Global Tech Software</span>.</p>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;