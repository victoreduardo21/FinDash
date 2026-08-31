
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { TourGuide } from './components/TourGuide';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investments from './pages/Investments';
import Agenda from './pages/Agenda';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AIInsights from './pages/AIInsights';
import Admin from './pages/Admin';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import TransactionModal from './components/TransactionModal';
import TransferModal from './components/TransferModal';
import PlanSelectionModal from './components/PlanSelectionModal';
import { PersonalTransaction, Investment, User, Page, Theme, CalendarEvent, Plan, BillingCycle, TransactionType, Language, Currency, CreditCard, CreditTransaction, AiConversation, Subscription, SystemNotification } from './types';
import { api } from './services/api';
import { auth, db, handleFirestoreError, OperationType } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDocFromServer, doc, getDoc } from 'firebase/firestore';
import WhatsAppButton from './components/WhatsAppButton';
import Toast, { ToastMessage } from './components/Toast';
import { CheckCircleIcon } from 'lucide-react';
import { translations } from './translations';
import Credits from './pages/Credits';
import Subscriptions from './pages/Subscriptions';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [tasks, setTasks] = useState<CalendarEvent[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [aiConversation, setAiConversation] = useState<AiConversation | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'pt-BR');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => (localStorage.getItem('selected_currency') as Currency) || 'BRL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginScreen, setIsLoginScreen] = useState(false);
  const [preSelectRegister, setPreSelectRegister] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('FREE');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Auto-start onboarding tour for new users on log in
  useEffect(() => {
    if (token && isAuthReady) {
        const completed = localStorage.getItem('tour_completed_v1');
        if (!completed) {
            const timer = setTimeout(() => {
                setActivePage('Dashboard');
                setIsTourOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }
  }, [token, isAuthReady]);

  const handleStartTour = () => {
    setActivePage('Dashboard');
    setIsTourOpen(true);
  };

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Test connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setToken(user.uid);
        
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            const newUser: User = {
                name: user.displayName || 'Usuário',
                email: user.email || '',
                plan: 'FREE',
                subscriptionStatus: 'ACTIVE', // Default to active for trial/demo purposes
                role: 'user',
                billingCycle: 'MONTHLY',
                language: 'pt-BR',
                createdAt: new Date().toISOString()
            };
            await api.createUser(newUser, user.uid);
        }

        // Use onSnapshot for real-time profile updates (approval/deactivation)
        unsubProfile = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = { ...docSnap.data(), id: docSnap.id } as User;
                setCurrentUser(userData);
                if (userData.language) setLanguage(userData.language);
            }
        });
      } else {
        if (unsubProfile) unsubProfile();
        setToken(null);
        setCurrentUser(null);
        setTransactions([]);
        setInvestments([]);
        setTasks([]);
        setCreditCards([]);
        setCreditTransactions([]);
        setSubscriptions([]);
        setSystemNotifications([]);
      }
      setIsAuthReady(true);
    });
    return () => {
        unsubscribe();
        if (unsubProfile) unsubProfile();
    };
  }, []);

  useEffect(() => {
    if (!token || !isAuthReady) {
        // Reset data if token is lost
        if (isAuthReady && !token) {
            setTransactions([]);
            setInvestments([]);
            setTasks([]);
            setCreditCards([]);
            setCreditTransactions([]);
            setSystemNotifications([]);
        }
        return;
    };

    const qT = query(collection(db, 'transactions'), where('userId', '==', token));
    const unsubT = onSnapshot(qT, (snap) => {
      const fetched = snap.docs.map(d => ({ ...d.data(), id: d.id } as PersonalTransaction));
      // Sort by date descending, then by document id for stability
      const sorted = fetched.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return b.id.localeCompare(a.id);
      });
      setTransactions(sorted);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    const qI = query(collection(db, 'investments'), where('userId', '==', token));
    const unsubI = onSnapshot(qI, (snap) => {
      setInvestments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Investment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'investments');
    });

    const qC = query(collection(db, 'calendar'), where('userId', '==', token));
    const unsubC = onSnapshot(qC, (snap) => {
      setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id } as CalendarEvent)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'calendar');
    });

    const qCC = query(collection(db, 'credit_cards'), where('userId', '==', token));
    const unsubCC = onSnapshot(qCC, (snap) => {
      setCreditCards(snap.docs.map(d => ({ ...d.data(), id: d.id } as CreditCard)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'credit_cards');
    });

    const qCT = query(collection(db, 'credit_transactions'), where('userId', '==', token));
    const unsubCT = onSnapshot(qCT, (snap) => {
      setCreditTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id } as CreditTransaction)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'credit_transactions');
    });

    const qSub = query(collection(db, 'subscriptions'), where('userId', '==', token));
    const unsubSub = onSnapshot(qSub, (snap) => {
      setSubscriptions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Subscription)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'subscriptions');
    });

    let isInitialNotifLoad = true;
    const qNotif = query(collection(db, 'notifications'), where('userId', 'in', ['all', token]));
    const unsubNotif = onSnapshot(qNotif, (snap) => {
      const loadedNotifs = snap.docs.map(d => ({ ...d.data(), id: d.id } as SystemNotification));
      setSystemNotifications(loadedNotifs);
      
      if (!isInitialNotifLoad) {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const isPushEnabled = localStorage.getItem('gts_device_notifications') === 'true';
            if (isPushEnabled && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(data.title || 'Novo Alerta do Sistema', {
                  body: data.message || '',
                });
              } catch (e) {
                console.error("Erro ao disparar notificação local:", e);
              }
            }
          }
        });
      }
      isInitialNotifLoad = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    const unsubAI = onSnapshot(doc(db, 'ai_conversations', token), (snap) => {
      if (snap.exists()) {
        setAiConversation({ ...snap.data(), id: snap.id } as AiConversation);
      } else {
        setAiConversation(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `ai_conversations/${token}`);
    });

    return () => {
      unsubT();
      unsubI();
      unsubC();
      unsubCC();
      unsubCT();
      unsubSub();
      unsubAI();
      unsubNotif();
    };
  }, [token, isAuthReady]);

  const handleLogin = (user: User, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    setIsLoginScreen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // State cleanup will be handled by onAuthStateChanged
      setIsLoginScreen(false);
      setActivePage('Dashboard');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleSaveTransfer = async (data: { fromCurrency: Currency, toCurrency: Currency, amountFrom: number, amountTo: number, rate: number }) => {
    if (!token) return;
    try {
        const date = new Date().toISOString().split('T')[0];
        
        // 1. Débito da conta de origem
        await api.createTransaction({
            description: `Transferência (Saída) p/ ${data.toCurrency}`,
            amount: data.amountFrom,
            currency: data.fromCurrency,
            date,
            type: TransactionType.Despesa,
            category: 'Câmbio/Transferência'
        }, token);

        // 2. Crédito na conta de destino
        await api.createTransaction({
            description: `Transferência (Entrada) de ${data.fromCurrency}`,
            amount: data.amountTo,
            currency: data.toCurrency,
            date,
            type: TransactionType.Receita,
            category: 'Câmbio/Transferência'
        }, token);

        setToast({ id: Date.now().toString(), message: "Transferência realizada com sucesso!", type: 'success' });
    } catch (error) {
        setToast({ id: Date.now().toString(), message: "Erro ao realizar transferência.", type: 'error' });
    }
  };

  const handleUpdatePlan = async (plan: Plan, billing: BillingCycle) => {
    if (!token) return;
    try {
        await api.updateUser(token, { plan, billingCycle: billing });
        setCurrentUser(prev => prev ? { ...prev, plan, billingCycle: billing } : null);
        setToast({ id: Date.now().toString(), message: `Plano atualizado para ${plan}!`, type: 'success' });
        setIsPlanModalOpen(false);
    } catch (error) {
        setToast({ id: Date.now().toString(), message: "Erro ao atualizar plano.", type: 'error' });
    }
  };

  if (!isAuthReady) return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
  );

  if (!token) {
      if (isLoginScreen) return <LoginPage onLogin={handleLogin} onBack={() => setIsLoginScreen(false)} initialMode={preSelectRegister ? 'register' : 'login'} selectedPlan={selectedPlan} selectedBillingCycle={selectedBillingCycle} />;
      return <LandingPage onLogin={() => setIsLoginScreen(true)} onRegister={(p, c) => { setSelectedPlan(p); setSelectedBillingCycle(c); setPreSelectRegister(true); setIsLoginScreen(true); }} />;
  }

  return (
    <div className="flex h-screen w-full max-w-[100vw] bg-[#f8fafc] dark:bg-slate-900 relative overflow-hidden">
       {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
       
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} language={language} onUpgrade={() => setIsPlanModalOpen(true)} />

      <div className="flex-1 flex flex-col w-full min-w-0 h-full max-w-full overflow-hidden">
        <Header 
            onLogout={handleLogout} 
            onNewTransaction={() => { setEditingTransaction(null); setIsTransactionModalOpen(true); }} 
            currentUser={currentUser} 
            setActivePage={setActivePage} 
            onSearch={setSearchQuery} 
            tasks={tasks} 
            language={language} 
            onLanguageChange={setLanguage}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            subscriptions={subscriptions}
            creditCards={creditCards}
            creditTransactions={creditTransactions}
            onStartTour={handleStartTour}
            systemNotifications={systemNotifications}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 md:p-6 lg:p-8 pb-28 md:pb-8 no-scrollbar max-w-full">
            {activePage === 'Dashboard' && <Dashboard transactions={transactions} creditTransactions={creditTransactions} subscriptions={subscriptions} investments={investments} setActivePage={setActivePage} onEditTransaction={(t) => { setEditingTransaction(t); setIsTransactionModalOpen(true); }} onDeleteTransaction={async (id) => { await api.deleteTransaction(id, token); }} onNewTransaction={() => setIsTransactionModalOpen(true)} onOpenTransfer={() => setIsTransferModalOpen(true)} searchQuery={searchQuery} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} currentUser={currentUser} />}
            {activePage === 'Transações' && <Transactions transactions={transactions} onOpenModal={(t) => { setEditingTransaction(t); setIsTransactionModalOpen(true); }} onDeleteTransaction={async (id) => { await api.deleteTransaction(id, token); }} searchQuery={searchQuery} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} currentUser={currentUser} />}
            {activePage === 'Investimentos' && <Investments 
                investments={investments} 
                setInvestments={setInvestments} 
                onSaveInvestment={async (inv) => { 
                    try {
                        const isNew = !inv.id;
                        await api.createInvestment(inv, token || ''); 
                        
                        // User Rule: Investment exits account balance
                        if (isNew) {
                            await api.createTransaction({
                                description: `Aporte: ${inv.name}`,
                                amount: inv.initialAmount,
                                type: 'Despesa' as any,
                                category: 'Investimento',
                                currency: inv.currency,
                                date: new Date().toISOString().slice(0, 10),
                            }, token || '');
                        }

                        setToast({ id: Date.now().toString(), message: "Investimento salvo!", type: 'success' });
                    } catch (err: any) {
                        setToast({ id: Date.now().toString(), message: "Erro ao salvar investimento.", type: 'error' });
                    }
                }} 
                onDeleteInvestment={async (id) => { await api.deleteInvestment(id, token || ''); }} 
                onWithdrawInvestment={async (id) => { 
                    const inv = investments.find(i => i.id === id);
                    if (!inv) return;
                    try {
                        await api.withdrawInvestment(id, token || ''); 
                        
                        // User Rule: Return to account balance
                        await api.createTransaction({
                            description: `Resgate: ${inv.name}`,
                            amount: inv.currentValue,
                            type: 'Receita' as any,
                            category: 'Resgate',
                            currency: inv.currency,
                            date: new Date().toISOString().slice(0, 10),
                        }, token || '');

                        setToast({ id: Date.now().toString(), message: "Resgate realizado com sucesso!", type: 'success' });
                    } catch (err: any) {
                        setToast({ id: Date.now().toString(), message: "Erro ao realizar resgate.", type: 'error' });
                    }
                }} 
                language={language} 
            />}
            {activePage === 'Agenda' && (
                <Agenda 
                    tasks={tasks} 
                    subscriptions={subscriptions}
                    creditCards={creditCards}
                    creditTransactions={creditTransactions}
                    onAddTask={async (t) => { await api.createCalendarEvent(t, token); }} 
                    onToggleTask={async (id, d) => { await api.toggleCalendarEvent(id, d, token); }} 
                    onDeleteTask={async (id) => { await api.deleteCalendarEvent(id, token); }} 
                    language={language} 
                />
            )}
            {activePage === 'Relatórios' && <Reports transactions={transactions} creditTransactions={creditTransactions} investments={investments} subscriptions={subscriptions} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} currentUser={currentUser} />}
            {activePage === 'Insights' && <AIInsights transactions={transactions} investments={investments} creditCards={creditCards} creditTransactions={creditTransactions} currentUser={currentUser} aiConversation={aiConversation} token={token || ''} />}
            {activePage === 'Créditos' && <Credits creditCards={creditCards} creditTransactions={creditTransactions} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} token={token || ''} currentUser={currentUser} />}
            {activePage === 'Assinaturas' && <Subscriptions subscriptions={subscriptions} language={language} selectedCurrency={selectedCurrency} token={token || ''} />}
            {activePage === 'Configurações' && currentUser && <Settings theme={theme} setTheme={setTheme} currentUser={currentUser} onUpdatePassword={async (c, n) => { await api.updatePassword({currentPassword: c, newPassword: n}, token); }} onUpdateAvatar={async (a) => { await api.updateAvatar({avatar: a}, token); }} onCreateUser={async (u) => { const r = await api.createUser(u); return r; }} language={language} onLanguageChange={setLanguage} />}
            {activePage === 'Admin' && (currentUser?.role === 'admin' || currentUser?.email === 'eduardopontesdias@outlook.com' || currentUser?.email === 'gtsglobaltech01@gmail.com') && <Admin token={token || ''} />}
        </main>
      </div>

      {(currentUser?.subscriptionStatus === 'INACTIVE') && (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
              <div className="max-w-md space-y-6">
                  <div className="flex justify-center">
                      <div className="p-6 rounded-full dark:bg-opacity-20 bg-red-100 dark:bg-red-900/30">
                          <CheckCircleIcon size={64} className="text-red-600 dark:text-red-400" />
                      </div>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    {translations[language].inactiveAccount}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    {translations[language].inactiveAccountDesc}
                  </p>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {translations[language].contactSupport}
                      </p>
                  </div>
                  <button onClick={handleLogout} className="w-full py-4 bg-[#020617] dark:bg-white dark:text-[#020617] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-xl">
                      {translations[language].logout.toUpperCase()}
                  </button>
              </div>
          </div>
      )}

      <BottomNav activePage={activePage} setActivePage={setActivePage} language={language} isFreePlan={currentUser?.plan === 'FREE'} />
      <TransactionModal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)} 
        onSave={async (t) => { 
            try {
                await api.createTransaction(t, token || ''); 
                setIsTransactionModalOpen(false);
                setToast({ id: Date.now().toString(), message: "Transação salva com sucesso!", type: 'success' });
            } catch (err: any) {
                console.error("Erro ao salvar transação:", err);
                setToast({ id: Date.now().toString(), message: "Erro ao salvar transação. Verifique sua permissão.", type: 'error' });
            }
        }} 
        transaction={editingTransaction} 
        language={language} 
      />
      <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onSaveTransfer={handleSaveTransfer} />
      <PlanSelectionModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} onConfirmUpgrade={handleUpdatePlan} currentPlan={currentUser?.plan || 'FREE'} />
      <WhatsAppButton />
      <TourGuide isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} language={language} />
    </div>
  );
};

export default App;