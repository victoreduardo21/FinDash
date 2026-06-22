
import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { XIcon } from './icons/XIcon';
import { SwitchHorizontalIcon } from './icons/SwitchHorizontalIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { Sparkles, CreditCard, RefreshCw } from 'lucide-react';
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activePage, setActivePage, currentUser, onUpgrade, language }) => {
    const t = useTranslation(language);
    
    // Mudança crítica: lg:relative em vez de md:relative para garantir que em telas médias (tablets) ela ainda seja overlay
    const sidebarClasses = `fixed inset-y-0 left-0 z-[60] w-64 bg-[#020617] border-r border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    
    const isFreePlan = currentUser?.plan === 'FREE';

    const handleNavClick = (page: Page) => {
        setActivePage(page);
        if (isOpen) {
            setIsOpen(false);
        }
    }

    return (
    <>
        <div className={sidebarClasses}>
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1 rounded-lg shadow-lg shadow-blue-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                            Money <span className="text-blue-500">Dashs</span>
                        </h1>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">
                            {currentUser?.plan === 'VIP' ? 'VIP MEMBER' : currentUser?.plan || 'FREE'}
                        </span>
                    </div>
                </div>
                 <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            
            <div className="px-3 py-4">
                <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('summary')}</p>
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

                {isFreePlan && (
                    <div className="mx-4 mt-6 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
                        <p className="text-xs text-blue-400 font-bold uppercase mb-2">PRO ACCESS</p>
                        <p className="text-[10px] text-gray-400 mb-3">{language === 'pt-BR' ? 'Libere investimentos e agenda.' : 'Unlock investments and agenda.'}</p>
                        <button onClick={onUpgrade} className="w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">{t('upgrade')}</button>
                    </div>
                )}

                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-8 mb-4">{t('settings')}</p>
                <nav className="space-y-1">
                    <NavLink icon={<SettingsIcon className="h-5 w-5" />} active={activePage === 'Configurações'} onClick={() => handleNavClick('Configurações')}>{t('settings')}</NavLink>
                    {(currentUser?.role === 'admin' || currentUser?.email === 'eduardopontesdias@outlook.com' || currentUser?.email === 'gtsglobaltech01@gmail.com') && (
                        <NavLink icon={<ChartPieIcon className="h-5 w-5" />} active={activePage === 'Admin'} onClick={() => handleNavClick('Admin')}>Painel Admin</NavLink>
                    )}
                </nav>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-[#020617]">
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
