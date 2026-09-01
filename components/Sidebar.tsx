
import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { XIcon } from './icons/XIcon';
import { SwitchHorizontalIcon } from './icons/SwitchHorizontalIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { Sparkles, CreditCard, RefreshCw, Smartphone, Download, MessageCircle } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Page, User, Language } from '../types';
import { useTranslation } from '../translations';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    activePage: Page;
    setActivePage: (page: Page) => void;
    currentUser: User | null;
    onUpgrade?: () => void;
    language: Language;
    onOpenWhatsApp?: () => void;
    onOpenInstallApp?: () => void;
}

const NavLink: React.FC<{ 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    active?: boolean;
    onClick: () => void;
}> = ({ icon, children, active = false, onClick }) => (
    <button
    onClick={onClick}
    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-left mb-0.5 ${
      active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-2.5">{children}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, 
    setIsOpen, 
    activePage, 
    setActivePage, 
    currentUser, 
    onUpgrade, 
    language,
    onOpenWhatsApp,
    onOpenInstallApp
}) => {
    const t = useTranslation(language);
    const isPT = language === 'pt-BR';
    
    // Mudança crítica: lg:relative em vez de md:relative para garantir que em telas médias (tablets) ela ainda seja overlay
    const sidebarClasses = `fixed inset-y-0 left-0 z-[60] w-64 bg-[#020617] border-r border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    
    const isFreePlan = currentUser?.plan === 'FREE';

    const handleNavClick = (page: Page) => {
        setActivePage(page);
        if (isOpen) {
            setIsOpen(false);
        }
    }

    return (
    <>
        <div id="tour-sidebar-menu" className={sidebarClasses}>
            {/* LOGO & CLOSE */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-2.5">
                    <img 
                        src="/icon-192.png" 
                        alt="Money Dashs" 
                        className="w-9 h-9 rounded-xl object-cover shadow-lg ring-1 ring-white/20 shrink-0" 
                    />
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                            Money <span className="text-blue-500">Dashs</span>
                        </h1>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">
                            {currentUser?.plan === 'VIP' ? 'VIP MEMBER' : currentUser?.plan || 'FREE'}
                        </span>
                    </div>
                </div>
                 <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-1">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            
            {/* SCROLLABLE NAV CONTENT */}
            <div className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-6">
                <div>
                    <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('summary')}</p>
                    <nav className="space-y-1">
                        <NavLink icon={<DashboardIcon className="h-5 w-5" />} active={activePage === 'Dashboard'} onClick={() => handleNavClick('Dashboard')}>{t('dashboard')}</NavLink>
                        <NavLink icon={<SwitchHorizontalIcon className="h-5 w-5" />} active={activePage === 'Transações'} onClick={() => handleNavClick('Transações')}>{t('transactions')}</NavLink>
                        <NavLink icon={<CreditCard className="h-5 w-5" />} active={activePage === 'Créditos'} onClick={() => handleNavClick('Créditos')}>{t('credits')}</NavLink>
                        <NavLink icon={<RefreshCw className="h-5 w-5" />} active={activePage === 'Assinaturas'} onClick={() => handleNavClick('Assinaturas')}>{t('subscriptions')}</NavLink>
                        
                        {!isFreePlan && (
                            <>
                                <NavLink icon={<CalendarIcon className="h-5 w-5" />} active={activePage === 'Agenda'} onClick={() => handleNavClick('Agenda')}>{t('agenda')}</NavLink>
                                <NavLink icon={<TrendingUpIcon className="h-5 w-5" />} active={activePage === 'Investimentos'} onClick={() => handleNavClick('Investimentos')}>{t('investments')}</NavLink>
                                <NavLink icon={<Sparkles className="h-5 w-5" />} active={activePage === 'Insights'} onClick={() => handleNavClick('Insights')}>{t('insightsIA')}</NavLink>
                                <NavLink icon={<ChartPieIcon className="h-5 w-5" />} active={activePage === 'Relatórios'} onClick={() => handleNavClick('Relatórios')}>{t('reports')}</NavLink>
                            </>
                        )}
                    </nav>
                </div>

                {isFreePlan && (
                    <div className="mx-1 p-3.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
                        <p className="text-xs text-blue-400 font-bold uppercase mb-1">PRO ACCESS</p>
                        <p className="text-[10px] text-gray-400 mb-2.5">{language === 'pt-BR' ? 'Libere investimentos e agenda.' : 'Unlock investments and agenda.'}</p>
                        <button onClick={onUpgrade} className="w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">{t('upgrade')}</button>
                    </div>
                )}

                <div>
                    <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('settings')}</p>
                    <nav className="space-y-1">
                        <NavLink icon={<SettingsIcon className="h-5 w-5" />} active={activePage === 'Configurações'} onClick={() => handleNavClick('Configurações')}>{t('settings')}</NavLink>
                        {(currentUser?.role === 'admin' || currentUser?.email === 'eduardopontesdias@outlook.com' || currentUser?.email === 'gtsglobaltech01@gmail.com') && (
                            <NavLink icon={<ChartPieIcon className="h-5 w-5" />} active={activePage === 'Admin'} onClick={() => handleNavClick('Admin')}>Painel Admin</NavLink>
                        )}
                    </nav>
                </div>

                {/* SPECIAL ACTIONS: WHATSAPP & PWA MOBILE APP */}
                <div className="space-y-2 pt-2 border-t border-gray-800/80">
                    <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {isPT ? 'Canais & Aplicativo' : 'Channels & App'}
                    </p>

                    {/* WHATSAPP SUPPORT BUTTON */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onOpenWhatsApp) onOpenWhatsApp();
                            if (isOpen) setIsOpen(false);
                        }}
                        className="w-full group flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 hover:border-emerald-600 text-emerald-300 hover:text-white transition-all shadow-sm active:scale-98 cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                                <WhatsAppIcon className="w-5 h-5 fill-white" />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-bold leading-tight truncate">
                                    {isPT ? 'Falar no WhatsApp' : 'WhatsApp Support'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-[10px] text-emerald-400/90 font-medium">
                                        {isPT ? 'Atendimento Online' : 'Online Support'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* INSTALL MOBILE APP (PWA) BUTTON */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onOpenInstallApp) onOpenInstallApp();
                            if (isOpen) setIsOpen(false);
                        }}
                        className="w-full group flex items-center justify-between p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/50 hover:border-blue-600 text-blue-300 hover:text-white transition-all shadow-sm active:scale-98 cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                                <Smartphone className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-bold leading-tight truncate">
                                    {isPT ? 'Baixar no Celular' : 'Install Mobile App'}
                                </p>
                                <p className="text-[10px] text-blue-400/90 font-medium truncate">
                                    {isPT ? 'Usar como App PWA' : 'Native Web App'}
                                </p>
                            </div>
                        </div>
                        <Download className="w-4 h-4 text-blue-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
                    </button>
                </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-gray-800 bg-[#020617] shrink-0">
                <div className="flex flex-col">
                    <p className="text-[10px] font-medium text-gray-500">{t('version')} 2.5.0</p>
                    <p className="text-[9px] text-gray-600 mt-1">{t('developedBy')} <span className="text-blue-500 font-bold">GTS Global Tech Software</span></p>
                </div>
            </div>
        </div>
        {isOpen && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)}></div>}
    </>
    );
};

export default Sidebar;
