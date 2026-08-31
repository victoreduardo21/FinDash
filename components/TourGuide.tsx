import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, X, Sparkles, HelpCircle } from 'lucide-react';
import { Language } from '../types';

interface Step {
    title: string;
    description: string;
    selector?: string;
    position?: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

interface TourGuideProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

export const TourGuide: React.FC<TourGuideProps> = ({ isOpen, onClose, language }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});

    const steps: Step[] = [
        {
            title: language === 'pt-BR' ? "Bem-vindo ao Money Dashs! 🚀" : "Welcome to Money Dashs! 🚀",
            description: language === 'pt-BR' 
                ? "Este é o seu painel financeiro definitivo. Vamos fazer um rápido tour de 1 minuto para você aprender a usar todas as funcionalidades disponíveis e organizar sua vida financeira com maestria!"
                : "This is your ultimate financial dashboard. Let's take a quick 1-minute tour to show you how to leverage all the features to organize and master your financial life!",
            position: 'center'
        },
        {
            title: language === 'pt-BR' ? "Lançar Nova Transação ➕" : "New Transaction ➕",
            description: language === 'pt-BR'
                ? "Sempre que receber um valor ou fizer um pagamento, clique aqui para registrar. É super rápido e todos os seus relatórios e saldos são recalculados no mesmo instante!"
                : "Whenever you receive money or make a payment, click here to log it. It is super fast and all your charts and balances update immediately!",
            selector: '#tour-btn-new-transaction',
            position: 'bottom'
        },
        {
            title: language === 'pt-BR' ? "Seleção de Moeda & Câmbio 💵" : "Multi-Currency & Exchange 💵",
            description: language === 'pt-BR'
                ? "Acompanhe todo o seu dinheiro na sua moeda favorita (Real ou Dólar) com conversão em tempo real. No botão de setas ao lado, você pode transferir valores de uma carteira para a outra fazendo câmbio!"
                : "Track all your money in your preferred currency (BRL or USD) with live conversions. Click the double arrows next to it to easily exchange/transfer values between wallets!",
            selector: '#tour-currency-selector',
            position: 'bottom'
        },
        {
            title: language === 'pt-BR' ? "Resumo Financeiro Mensal 📊" : "Monthly Financial Summary 📊",
            description: language === 'pt-BR'
                ? "Visualização clara do seu Saldo Disponível geral, total investido até o momento, além do recebido e gasto dentro do mês selecionado acima."
                : "A clear view of your overall Available Balance, total invested to date, and incomes / expenses recorded during the selected month.",
            selector: '#tour-metrics-cards',
            position: 'bottom'
        },
        {
            title: language === 'pt-BR' ? "Patrimônio Total & Margem 🎯" : "Net Worth & Margin 🎯",
            description: language === 'pt-BR'
                ? "Aqui você vê o seu patrimônio real líquido (saldo + investimentos). A 'Margem de Investimento' mostra qual fatia dos seus rendimentos sobrou neste mês para construir o seu futuro."
                : "Here you can see your real net worth (wallets balance + investments values combined). The 'Investment Margin' shows what slice of your monthly income was left to build your future.",
            selector: '#tour-net-worth',
            position: 'left'
        },
        {
            title: language === 'pt-BR' ? "Navegação Principal 🧭" : "Main Navigation 🧭",
            description: language === 'pt-BR'
                ? "Use o menu lateral para conferir o extrato completo de 'Transações', gerenciar contas de 'Crédito' de seus cartões, planejar as contas em 'Assinaturas' e usufruir da Agenda Financeira, Investimentos e Inteligência Artificial!"
                : "Use the sidebar menu to view detailed statements in 'Transactions', manage credit card limits and bills in 'Credits', plan recurring costs in 'Subscriptions', or use the financial Agenda, Investments and custom AI tools!",
            selector: '#tour-sidebar-menu',
            position: 'right'
        }
    ];

    useEffect(() => {
        if (!isOpen) return;

        const updateCoordinates = () => {
            const step = steps[currentStep];
            if (!step.selector) {
                setCoords(null);
                setCardStyle({
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100,
                });
                return;
            }

            const element = document.querySelector(step.selector);
            if (element) {
                // Scroll target into view gently if needed
                element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
                
                // Get bounds after a tiny delay for scroll/layout stability
                setTimeout(() => {
                    const rect = element.getBoundingClientRect();
                    setCoords({
                        top: rect.top + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width,
                        height: rect.height
                    });

                    // Calculate card position right next to the target
                    const space = 18;
                    let top = rect.bottom + window.scrollY + space;
                    let left = rect.left + window.scrollX + rect.width / 2 - 160; // center it horizontally relative to element

                    // Adjust if left gets too offscreen
                    if (left < 16) left = 16;
                    if (left + 320 > window.innerWidth) left = window.innerWidth - 336;

                    // Support positions
                    if (step.position === 'top') {
                        top = rect.top + window.scrollY - 200; // estimated card height
                    } else if (step.position === 'left') {
                        left = rect.left + window.scrollX - 338;
                        top = rect.top + window.scrollY + rect.height / 2 - 80;
                    } else if (step.position === 'right') {
                        left = rect.right + window.scrollX + space;
                        top = rect.top + window.scrollY + rect.height / 2 - 80;
                    }

                    // Mobile fallback
                    if (window.innerWidth < 768) {
                        top = rect.bottom + window.scrollY + space;
                        left = window.innerWidth / 2 - 160;
                        if (left < 12) left = 12;
                    }

                    setCardStyle({
                        position: 'absolute',
                        top: `${top}px`,
                        left: `${left}px`,
                        zIndex: 100,
                    });
                }, 100);
            } else {
                // Fallback to center if element is not found
                setCoords(null);
                setCardStyle({
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100,
                });
            }
        };

        updateCoordinates();
        window.addEventListener('resize', updateCoordinates);
        return () => window.removeEventListener('resize', updateCoordinates);
    }, [isOpen, currentStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('tour_completed_v1', 'true');
        setCurrentStep(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] overflow-y-auto" style={{ pointerEvents: 'auto' }}>
            {/* Spotlight/Mask overlay background */}
            <div className="absolute inset-0 bg-[#020617]/70 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto" onClick={handleComplete} />

            {/* Simulated punch hole with clean SVG mask overlay */}
            {coords && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-[85]" style={{ height: document.documentElement.scrollHeight }}>
                    <defs>
                        <mask id="spotlight-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {/* Round spotlight */}
                            <rect 
                                x={coords.left - 8} 
                                y={coords.top - 8} 
                                width={coords.width + 16} 
                                height={coords.height + 16} 
                                rx="12" 
                                fill="black" 
                            />
                        </mask>
                    </defs>
                    <rect x="0" y="0" width="100%" height="100%" fill="#020617" opacity="0.65" mask="url(#spotlight-mask)" />
                    {/* Outline glow to highlight */}
                    <rect 
                        x={coords.left - 8} 
                        y={coords.top - 8} 
                        width={coords.width + 16} 
                        height={coords.height + 16} 
                        rx="12" 
                        fill="none" 
                        stroke="#10B981" 
                        strokeWidth="2.5" 
                        strokeDasharray="4 4"
                        className="animate-[pulse_2s_infinite]"
                    />
                </svg>
            )}

            {/* Floating Popover Dialogue Box */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`tour-step-${currentStep}`}
                    style={cardStyle}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-5 z-[90] flex flex-col pointer-events-auto"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                            <Sparkles size={14} className="animate-pulse" />
                            Tour {currentStep + 1} de {steps.length}
                        </div>
                        <button onClick={handleComplete} className="p-1 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight mb-2">
                        {steps[currentStep].title}
                    </h4>
                    
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
                        {steps[currentStep].description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                        {/* Skip button template styling */}
                        <button 
                            onClick={handleComplete}
                            className="text-[11px] font-bold text-slate-400 hover:text-red-500 dark:hover:text-red-400 uppercase tracking-wider transition-colors"
                        >
                            {language === 'pt-BR' ? 'Pular' : 'Skip'}
                        </button>

                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                                >
                                    <ArrowLeft size={14} />
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-blue-500/10 transition-all active:scale-95"
                            >
                                <span>{currentStep === steps.length - 1 ? (language === 'pt-BR' ? 'Concluir' : 'Finish') : (language === 'pt-BR' ? 'Avançar' : 'Next')}</span>
                                <ArrowRight size={13} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
