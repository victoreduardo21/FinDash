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
import { InstallAppModal } from '../components/InstallAppModal';
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
  BarChart3,
  Smartphone,
  Download,
  Wallet,
  Coins,
  CreditCard,
  Layers,
  Globe2,
  PiggyBank,
  BellRing,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Repeat,
  RotateCcw
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: (plan: Plan, cycle: BillingCycle) => void;
  onOpenInstallApp?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister, onOpenInstallApp }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(() => (localStorage.getItem('selected_currency') as Currency) || 'BRL');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'pt-BR');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [interactiveBenefitCurrency, setInteractiveBenefitCurrency] = useState<Currency>('BRL');
  
  const t = useTranslation(language);

  const handleOpenInstall = () => {
    if (onOpenInstallApp) {
      onOpenInstallApp();
    } else {
      setIsInstallModalOpen(true);
    }
  };

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
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <img 
                src="/icon-192.png" 
                alt="Money Dashs" 
                className="w-9 h-9 rounded-xl object-cover shadow-md ring-1 ring-slate-200" 
              />
              <span className="text-xl font-bold tracking-tight text-slate-900">Money <span className="text-blue-600">Dashs</span></span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-blue-600 transition-colors">{t('features')}</a>
                <a href="#app-mobile" onClick={(e) => scrollToSection(e, 'app-mobile')} className="hover:text-blue-600 transition-colors flex items-center gap-1.5 font-bold text-blue-600">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  {language === 'pt-BR' ? 'App Mobile' : 'Mobile App'}
                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Novo</span>
                </a>
                <a href="#qualidades" onClick={(e) => scrollToSection(e, 'qualidades')} className="hover:text-blue-600 transition-colors">{language === 'pt-BR' ? 'Qualidades' : 'Qualities'}</a>
                <a href="#beneficios" onClick={(e) => scrollToSection(e, 'beneficios')} className="hover:text-blue-600 transition-colors">{t('benefits')}</a>
                <a href="#planos" onClick={(e) => scrollToSection(e, 'planos')} className="hover:text-blue-600 transition-colors">{t('plans')}</a>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={handleOpenInstall}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-all shadow-sm"
                title="Instalar App no Celular ou Computador"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'pt-BR' ? 'Baixar App' : 'Download App'}</span>
              </button>

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

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up">
                <button onClick={() => onRegister('FREE', 'MONTHLY')} className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-sm md:text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:scale-105 flex items-center justify-center gap-2">
                    {language === 'pt-BR' ? 'Criar Conta Gratuita' : 'Start Free Today'} <span className="text-blue-200">&rarr;</span>
                </button>
                <button 
                  onClick={handleOpenInstall}
                  className="px-7 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-sm md:text-base transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-3 border border-slate-700 group"
                >
                  <Smartphone className="w-5 h-5 text-blue-400 group-hover:animate-bounce" />
                  <span>{language === 'pt-BR' ? 'Baixar App no Celular' : 'Install Mobile App'}</span>
                  <span className="bg-blue-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white">Grátis</span>
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

      {/* --- NOVA SECÇÃO: APP MOBILE / BAIXAR APLICATIVO --- */}
      <section id="app-mobile" className="py-24 bg-gradient-to-b from-slate-900 to-[#020617] text-white relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Coluna Texto App */}
            <div className="w-full lg:w-1/2 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-blue-400" />
                {language === 'pt-BR' ? 'Disponível para iPhone, Android & PC' : 'Available for iPhone, Android & PC'}
              </div>

              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {language === 'pt-BR' ? (
                  <>Instale o <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Money Dashs App</span> e leve suas finanças no bolso.</>
                ) : (
                  <>Install <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Money Dashs App</span> and manage your wealth anywhere.</>
                )}
              </h2>

              <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                {language === 'pt-BR' 
                  ? 'Acesse instantaneamente sem precisar baixar centenas de megabytes em lojas. O aplicativo roda em tela cheia, funciona offline, envia alertas de vencimento e sincroniza em tempo real com seu computador.'
                  : 'Instant access without downloading heavy store packages. Runs in standalone fullscreen mode, works offline, sends bill alerts, and syncs in real time with your computer.'}
              </p>

              {/* Grid de Vantagens do App */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{language === 'pt-BR' ? 'Instalação em 1 Toque' : '1-Tap Fast Install'}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{language === 'pt-BR' ? 'Leve, seguro e não ocupa memória.' : 'Lightweight and memory safe.'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{language === 'pt-BR' ? 'Modo Standalone Nativo' : 'Native Standalone UI'}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{language === 'pt-BR' ? 'Sem barras do navegador no caminho.' : 'No browser bars cluttering.'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl shrink-0">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{language === 'pt-BR' ? 'Lembretes de Fatura' : 'Bill Due Reminders'}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{language === 'pt-BR' ? 'Notificações antes dos vencimentos.' : 'Notifications before due dates.'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{language === 'pt-BR' ? 'Segurança e Biometria' : 'Safe & Biometric Lock'}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{language === 'pt-BR' ? 'Protegido por Face ID e digital.' : 'Protected by Face ID/Fingerprint.'}</p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button
                  onClick={handleOpenInstall}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/30 hover:scale-105 flex items-center gap-3"
                >
                  <Download className="w-5 h-5" />
                  <span>{language === 'pt-BR' ? 'Baixar & Instalar App' : 'Download & Install App'}</span>
                </button>

                <button
                  onClick={handleOpenInstall}
                  className="px-6 py-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl transition-all border border-white/15 flex items-center gap-2.5 text-sm"
                >
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>{language === 'pt-BR' ? 'Ver Passo a Passo' : 'View Install Guide'}</span>
                </button>
              </div>
            </div>

            {/* Coluna Mockup Celular Realista */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
                {/* Efeito Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[3rem] blur-2xl opacity-30 animate-pulse"></div>

                {/* Moldura do Celular */}
                <div className="relative bg-[#0b1120] border-[8px] border-slate-700/90 rounded-[3rem] p-3 shadow-2xl overflow-hidden ring-1 ring-white/20">
                  {/* Speaker & Camera Notch */}
                  <div className="flex justify-center items-center gap-2 py-1.5 mb-1.5">
                    <div className="w-16 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-slate-800 rounded-full"></div>
                    </div>
                  </div>

                  {/* Tela do App no Celular - 100% Fiel à Interface Real do Mobile (Tema Claro Nativo) */}
                  <div className="bg-[#f8fafc] rounded-[2.2rem] overflow-hidden text-slate-800 shadow-inner flex flex-col justify-between border border-slate-200 min-h-[560px]">
                    
                    {/* Top Bar Mobile Real */}
                    <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                      <div className="flex items-center gap-3">
                        <button className="text-slate-600 hover:text-slate-900">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Botão + Flutuante */}
                        <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/30 text-lg font-bold">
                          +
                        </div>
                        {/* Botão Ajuda ? */}
                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold bg-white">
                          ?
                        </div>
                        {/* Notificações com Badge */}
                        <div className="relative w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 bg-white">
                          <BellRing className="w-4 h-4 text-slate-600" />
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                            6
                          </span>
                        </div>
                        {/* Avatar VG */}
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center border border-blue-200">
                          VG
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo do Dashboard Mobile Real */}
                    <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
                      
                      {/* Título & Resumo */}
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Dashboard</h2>
                        <p className="text-xs text-slate-400 font-medium">Resumo em BRL</p>
                      </div>

                      {/* Seletor BRL / USD Real */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                          <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-extrabold shadow-sm">
                            BRL
                          </button>
                          <button className="px-4 py-1.5 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-extrabold">
                            USD
                          </button>
                        </div>
                        <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                          <Repeat className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Seletor de Data */}
                      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2 text-blue-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                          </svg>
                          <span className="text-slate-800">Setembro De 2026</span>
                        </div>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* CARD 1: Saldo Disponível */}
                      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                            Saldo Disponível
                          </span>
                          <span className="text-xl font-black text-slate-900 tracking-tight">
                            R$ 48.750,00
                          </span>
                        </div>
                      </div>

                      {/* CARD 2: Total Investido */}
                      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                            Total Investido
                          </span>
                          <span className="text-xl font-black text-slate-900 tracking-tight">
                            R$ 125.400,00
                          </span>
                        </div>
                      </div>

                      {/* CARD 3: Recebido no Mês */}
                      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                            Recebido no Mês
                          </span>
                          <span className="text-xl font-black text-emerald-600 tracking-tight">
                            R$ 28.500,00
                          </span>
                        </div>
                      </div>

                      {/* CARD 4: Saídas no Mês */}
                      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                          <ArrowDownRight className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                            Saídas no Mês
                          </span>
                          <span className="text-xl font-black text-slate-900 tracking-tight">
                            R$ 4.230,00
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Barra Inferior de Navegação Mobile Real (Bottom Bar) */}
                    <div className="bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-between shrink-0">
                      <div className="flex flex-col items-center gap-1 text-blue-600 flex-1">
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-tight truncate max-w-[54px]">Painel De C...</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 flex-1">
                        <Repeat className="w-4 h-4" />
                        <span className="text-[8px] font-bold uppercase tracking-tight truncate max-w-[54px]">Transações</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 flex-1">
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-[8px] font-bold uppercase tracking-tight truncate max-w-[54px]">Assinatur...</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 flex-1">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-[8px] font-bold uppercase tracking-tight truncate max-w-[54px]">Créditos</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 flex-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-[8px] font-bold uppercase tracking-tight truncate max-w-[54px]">Investimen...</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- BENEFITS SECTION --- */}
      <section id="beneficios" className="py-28 bg-[#020617] text-white overflow-hidden relative">
          {/* Luzes de fundo */}
          <div className="absolute top-1/3 left-10 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
              {/* Header da Seção */}
              <div className="text-center max-w-3xl mx-auto mb-16">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    {language === 'pt-BR' ? 'Vantagens Estratégicas' : 'Strategic Advantages'}
                  </div>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                    {language === 'pt-BR' ? (
                      <>Por que escolher o <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Money Dashs?</span></>
                    ) : (
                      <>Why choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Money Dashs?</span></>
                    )}
                  </h2>
                  <p className="text-slate-400 text-base md:text-lg mt-4">
                    {language === 'pt-BR' 
                      ? 'Uma plataforma completa projetada para transformar desordem financeira em previsibilidade, rentabilidade e liberdade.'
                      : 'A comprehensive platform engineered to turn financial clutter into predictability, profitability, and freedom.'}
                  </p>
              </div>

              <div className="flex flex-col lg:flex-row items-stretch gap-12 lg:gap-16">
                  
                  {/* COLUNA ESQUERDA: 6 CARDS DE BENEFÍCIOS */}
                  <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      {/* Benefício 1 */}
                      <div className="p-6 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-blue-500/40 rounded-3xl transition-all duration-300 group flex flex-col justify-between">
                          <div>
                              <div className="w-12 h-12 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                  <RocketLaunchIcon className="w-6 h-6" />
                              </div>
                              <h4 className="text-lg font-bold text-white mb-2">{language === 'pt-BR' ? 'Clareza Mental Total' : 'Total Mental Clarity'}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">
                                {language === 'pt-BR' 
                                  ? 'Tire as datas e contas da cabeça. Projeções automáticas de saldo eliminam o estresse do fim do mês.'
                                  : 'Get due dates out of your head. Automated balance projections eliminate end-of-month stress.'}
                              </p>
                          </div>
                      </div>

                      {/* Benefício 2 */}
                      <div className="p-6 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 rounded-3xl transition-all duration-300 group flex flex-col justify-between">
                          <div>
                              <div className="w-12 h-12 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                  <Globe2 className="w-6 h-6" />
                              </div>
                              <h4 className="text-lg font-bold text-white mb-2">{language === 'pt-BR' ? 'Liberdade & Multimoedas' : 'Global Multi-Currency'}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">
                                {language === 'pt-BR' 
                                  ? 'Opere nativamente em BRL e USD com câmbio integrado. Perfeito para nômades digitais e investidores globais.'
                                  : 'Operate natively in BRL and USD with integrated currency exchange. Tailored for global investors and nomads.'}
                              </p>
                          </div>
                      </div>

                      {/* Benefício 3 */}
                      <div className="p-6 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-500/40 rounded-3xl transition-all duration-300 group flex flex-col justify-between">
                          <div>
                              <div className="w-12 h-12 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                  <TrendingUp className="w-6 h-6" />
                              </div>
                              <h4 className="text-lg font-bold text-white mb-2">{language === 'pt-BR' ? 'Multiplicação de Riqueza' : 'Wealth Compounding'}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">
                                {language === 'pt-BR' 
                                  ? 'Controle carteira de Ações, Renda Fixa e Cripto com cálculo automático de dividendos e rentabilidade.'
                                  : 'Manage Stocks, Fixed Income, and Crypto with automatic dividend calculation and return tracking.'}
                              </p>
                          </div>
                      </div>

                      {/* Benefício 4 */}
                      <div className="p-6 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-amber-500/40 rounded-3xl transition-all duration-300 group flex flex-col justify-between">
                          <div>
                              <div className="w-12 h-12 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                                  <CreditCard className="w-6 h-6" />
                              </div>
                              <h4 className="text-lg font-bold text-white mb-2">{language === 'pt-BR' ? 'Controle de Cartões' : 'Smart Credit Cards'}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">
                                {language === 'pt-BR' 
                                  ? 'Acompanhe múltiplos cartões, faturas em aberto, dias de fechamento e parcelas futuras sem surpresas.'
                                  : 'Track multiple cards, open statements, closing dates, and future installments without surprises.'}
                              </p>
                          </div>
                      </div>

                      {/* Benefício 5 */}
                      <div className="p-6 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-purple-500/40 rounded-3xl transition-all duration-300 group flex flex-col justify-between">
                          <div>
                              <div className="w-12 h-12 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                  <Repeat className="w-6 h-6" />
                              </div>
                              <h4 className="text-lg font-bold text-white mb-2">{language === 'pt-BR' ? 'Gestão de Assinaturas' : 'Subscription Radar'}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">
                                {language === 'pt-BR' 
                                  ? 'Monitore despesas recorrentes (SaaS, Streaming, Cloud) e cancele serviços esquecidos economizando dinheiro.'
                                  : 'Monitor recurring expenses (SaaS, Streaming, Cloud) and cancel forgotten services to save cash.'}
                              </p>
                          </div>
                      </div>

                      {/* Benefício 6 */}
                      <div className="p-6 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-cyan-500/40 rounded-3xl transition-all duration-300 group flex flex-col justify-between">
                          <div>
                              <div className="w-12 h-12 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
                                  <ShieldCheck className="w-6 h-6" />
                              </div>
                              <h4 className="text-lg font-bold text-white mb-2">{language === 'pt-BR' ? 'Segurança Bancária' : 'Bank-Grade Security'}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed">
                                {language === 'pt-BR' 
                                  ? 'Seus dados protegidos por criptografia de alta segurança e sincronizados em nuvem entre celular e PC.'
                                  : 'Your records secured by end-to-end cloud encryption and synchronized between phone and PC.'}
                              </p>
                          </div>
                      </div>

                  </div>

                  {/* COLUNA DIREITA: HUB FINANCEIRO INTERATIVO COMPLETO (CHEIO DE CONTEÚDO) */}
                  <div className="lg:w-1/2 flex flex-col justify-center">
                      <div className="relative p-6 sm:p-8 rounded-[2.5rem] bg-[#0a101f]/90 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6">
                           
                           {/* Barra de Topo do Painel */}
                           <div className="flex items-center justify-between border-b border-white/10 pb-4">
                               <div className="flex items-center gap-3">
                                   <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                                   <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                                     {language === 'pt-BR' ? 'Painel Financeiro em Tempo Real' : 'Real-Time Financial Hub'}
                                   </span>
                               </div>
                               
                               {/* Seletor de Moeda Interativo no Card */}
                               <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10">
                                   <button 
                                     onClick={() => setInteractiveBenefitCurrency('BRL')}
                                     className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${interactiveBenefitCurrency === 'BRL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                   >
                                     BRL (R$)
                                   </button>
                                   <button 
                                     onClick={() => setInteractiveBenefitCurrency('USD')}
                                     className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${interactiveBenefitCurrency === 'USD' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                   >
                                     USD ($)
                                   </button>
                               </div>
                           </div>

                           {/* Card 1: Patrimônio Total Consolidado */}
                           <div className="p-6 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-transparent border border-blue-500/30 rounded-3xl relative overflow-hidden">
                               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                   <div>
                                       <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                                         {language === 'pt-BR' ? 'Patrimônio Total Líquido' : 'Total Net Worth'}
                                       </span>
                                       <div className="flex items-baseline gap-2 mt-1">
                                           <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                             {interactiveBenefitCurrency === 'BRL' ? 'R$ 148.750,00' : '$ 27.546,00'}
                                           </h3>
                                       </div>
                                   </div>
                                   
                                   <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold self-start sm:self-center">
                                       <ArrowUpRight className="w-4 h-4" />
                                       <span>+24.8% {language === 'pt-BR' ? 'este ano' : 'this year'}</span>
                                   </div>
                               </div>

                               {/* Meta Anual Visual */}
                               <div className="mt-4 pt-3 border-t border-white/10">
                                   <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
                                       <span>{language === 'pt-BR' ? 'Meta de Liberdade Financeira (74% atingida)' : 'Financial Freedom Goal (74% achieved)'}</span>
                                       <span className="font-bold text-white">{interactiveBenefitCurrency === 'BRL' ? 'R$ 200.000' : '$ 37.000'}</span>
                                   </div>
                                   <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                       <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: '74%' }}></div>
                                   </div>
                               </div>
                           </div>

                           {/* Grid 2 Subcards: Investimentos & Reserva */}
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {/* Investimentos */}
                               <div className="p-5 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-between">
                                   <div className="flex items-center gap-3.5">
                                       <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-black border border-emerald-500/30">
                                           $$
                                       </div>
                                       <div>
                                           <p className="text-xs text-slate-400 font-bold">{language === 'pt-BR' ? 'Investimentos Ativos' : 'Active Investments'}</p>
                                           <p className="text-lg font-black text-emerald-400">
                                             {interactiveBenefitCurrency === 'BRL' ? 'R$ 85.000,00' : '$ 15.740,00'}
                                           </p>
                                       </div>
                                   </div>
                                   <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                     +R$ 3.420
                                   </span>
                               </div>

                               {/* Reserva */}
                               <div className="p-5 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-between">
                                   <div className="flex items-center gap-3.5">
                                       <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center font-black border border-blue-500/30">
                                           <PiggyBank className="w-5 h-5 text-blue-400" />
                                       </div>
                                       <div>
                                           <p className="text-xs text-slate-400 font-bold">{language === 'pt-BR' ? 'Reserva de Emergência' : 'Emergency Fund'}</p>
                                           <p className="text-lg font-black text-blue-400">
                                             {interactiveBenefitCurrency === 'BRL' ? 'R$ 42.000,00' : '$ 7.770,00'}
                                           </p>
                                       </div>
                                   </div>
                                   <span className="text-[10px] font-extrabold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                     100% CDI
                                   </span>
                               </div>
                           </div>

                           {/* Card de Cartão de Crédito Black & Limites */}
                           <div className="p-5 bg-white/[0.04] border border-white/10 rounded-2xl space-y-3">
                               <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                       <div className="w-10 h-7 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 rounded-lg border border-amber-400/40 flex items-center justify-center shadow">
                                           <div className="w-2.5 h-2 bg-amber-400/80 rounded-sm"></div>
                                       </div>
                                       <div>
                                           <h5 className="text-sm font-bold text-white">Cartão Black Infinite</h5>
                                           <p className="text-[11px] text-slate-400">{language === 'pt-BR' ? 'Fatura atual fecha em 5 dias' : 'Statement closes in 5 days'}</p>
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       <span className="text-xs text-slate-400 font-bold block">{language === 'pt-BR' ? 'Fatura Atual' : 'Current Bill'}</span>
                                       <span className="text-sm font-black text-amber-400">{interactiveBenefitCurrency === 'BRL' ? 'R$ 4.280,00' : '$ 792,00'}</span>
                                   </div>
                               </div>

                               <div>
                                   <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                       <span>{language === 'pt-BR' ? 'Limite Disponível' : 'Available Limit'}: <strong className="text-emerald-400">{interactiveBenefitCurrency === 'BRL' ? 'R$ 18.500,00' : '$ 3.425,00'}</strong></span>
                                       <span>{language === 'pt-BR' ? 'Total' : 'Total'}: {interactiveBenefitCurrency === 'BRL' ? 'R$ 30.000,00' : '$ 5.555,00'}</span>
                                   </div>
                                   <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full" style={{ width: '62%' }}></div>
                                   </div>
                               </div>
                           </div>

                           {/* Card Notificação com IA */}
                           <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-start gap-3.5">
                               <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl shrink-0 mt-0.5">
                                   <Sparkles className="w-4 h-4" />
                               </div>
                               <div className="text-xs">
                                   <p className="font-extrabold text-purple-300 uppercase tracking-wider text-[10px]">
                                     {language === 'pt-BR' ? 'Alerta Inteligente de IA' : 'AI Financial Insight'}
                                   </p>
                                   <p className="text-slate-200 mt-0.5 leading-relaxed font-medium">
                                     {language === 'pt-BR' 
                                       ? 'Identificamos que você economizou R$ 480,00 este mês renegociando 2 assinaturas automáticas.'
                                       : 'We detected you saved $89.00 this month by optimizing 2 automated subscriptions.'}
                                   </p>
                               </div>
                           </div>

                           {/* Mini Feed de Transações Sincronizadas */}
                           <div className="pt-2 border-t border-white/10 space-y-2">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                 {language === 'pt-BR' ? 'Últimas Movimentações Sincronizadas' : 'Recent Synced Transactions'}
                               </p>
                               
                               <div className="flex items-center justify-between text-xs py-1 text-slate-300">
                                   <span className="flex items-center gap-2">
                                       <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                       Faturamento GTS Software
                                   </span>
                                   <span className="font-black text-emerald-400">{interactiveBenefitCurrency === 'BRL' ? '+ R$ 12.500,00' : '+ $ 2.314,00'}</span>
                               </div>

                               <div className="flex items-center justify-between text-xs py-1 text-slate-300">
                                   <span className="flex items-center gap-2">
                                       <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                       Dividendos de Fundos Imobiliários
                                   </span>
                                   <span className="font-black text-blue-400">{interactiveBenefitCurrency === 'BRL' ? '+ R$ 450,00' : '+ $ 83,30'}</span>
                               </div>
                           </div>

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
      <footer className="bg-[#020617] text-slate-400 py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 border-b border-white/10 pb-8">
                  <div className="flex items-center gap-2.5">
                      <img 
                        src="/icon-192.png" 
                        alt="Money Dashs" 
                        className="w-8 h-8 rounded-xl object-cover shadow-md ring-1 ring-white/20" 
                      />
                      <span className="text-xl font-bold text-white">Money Dashs</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                      <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-white transition-colors">{t('features')}</a>
                      <a href="#qualidades" onClick={(e) => scrollToSection(e, 'qualidades')} className="hover:text-white transition-colors">{language === 'pt-BR' ? 'Qualidades' : 'Qualities'}</a>
                      <a href="#app-mobile" onClick={(e) => scrollToSection(e, 'app-mobile')} className="hover:text-white transition-colors flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-blue-400" />
                        <span>{language === 'pt-BR' ? 'App Mobile' : 'Mobile App'}</span>
                      </a>
                      <a href="#beneficios" onClick={(e) => scrollToSection(e, 'beneficios')} className="hover:text-white transition-colors">{t('benefits')}</a>
                      <a href="#planos" onClick={(e) => scrollToSection(e, 'planos')} className="hover:text-white transition-colors">{t('plans')}</a>
                  </div>

                  <button 
                    onClick={handleOpenInstall}
                    className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold border border-blue-500/30 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{language === 'pt-BR' ? 'Baixar App' : 'Get App'}</span>
                  </button>
              </div>
              <p className="text-xs">© 2025 Money Dashs. Powered by <span className="text-blue-500 font-bold">GTS Global Tech Software</span>.</p>
          </div>
      </footer>

      {/* Modal de Instalação do App */}
      <InstallAppModal 
        isOpen={isInstallModalOpen} 
        onClose={() => setIsInstallModalOpen(false)} 
        language={language} 
      />
    </div>
  );
};

export default LandingPage;