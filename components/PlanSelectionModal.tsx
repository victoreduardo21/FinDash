
import React, { useState } from 'react';
import { Plan, BillingCycle } from '../types';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface PlanSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmUpgrade: (plan: Plan, cycle: BillingCycle) => void;
    currentPlan: Plan;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ isOpen, onClose, onConfirmUpgrade, currentPlan }) => {
    const [selectedPlan, setSelectedPlan] = useState<Plan>('PRO');
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedPlan === currentPlan) {
            alert("Você já possui este plano.");
            return;
        }
        const cycleText = billingCycle === 'MONTHLY' ? 'Mensal' : 'Anual';
        if (window.confirm(`Tem certeza que deseja mudar seu plano para ${selectedPlan} (${cycleText})? O acesso será liberado imediatamente.`)) {
            onConfirmUpgrade(selectedPlan, billingCycle);
        }
    };

    // TABELA DE PREÇOS
    const prices = {
        PRO: {
            MONTHLY: 39.90,
            ANNUAL: 399.90 // Equivalente a 33,32/mês
        },
        VIP: {
            MONTHLY: 79.90,
            ANNUAL: 799.90 // Equivalente a 66,66/mês
        }
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-2xl font-extrabold text-gray-800">Atualize seu Plano</h3>
                        <p className="text-sm text-gray-500">Escolha o nível de controle que você deseja.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Seletor de Ciclo */}
                <div className="flex justify-center pt-6 bg-gray-50 pb-2">
                    <div className="bg-gray-200 p-1.5 rounded-xl flex relative shadow-inner">
                        <button 
                            onClick={() => setBillingCycle('MONTHLY')}
                            className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${billingCycle === 'MONTHLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Mensal
                        </button>
                        <button 
                            onClick={() => setBillingCycle('ANNUAL')}
                            className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center ${billingCycle === 'ANNUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Anual
                            <span className="ml-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm animate-pulse">
                                -16% OFF
                            </span>
                        </button>
                    </div>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto bg-gray-50">
                    <div className="grid md:grid-cols-2 gap-6">
                        
                        {/* PLANO PRO */}
                        <div 
                            onClick={() => setSelectedPlan('PRO')}
                            className={`cursor-pointer relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 flex flex-col ${selectedPlan === 'PRO' ? 'border-blue-600 shadow-xl scale-[1.02] z-10' : 'border-gray-200 hover:border-blue-300 hover:shadow-lg opacity-80 hover:opacity-100'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-blue-600 font-bold tracking-wider text-xs uppercase bg-blue-50 px-2 py-1 rounded-md">Recomendado</span>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-2">Plano PRO</h4>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'PRO' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                    {selectedPlan === 'PRO' && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                            
                            <div className="mb-2">
                                <span className="text-4xl font-extrabold text-gray-900">
                                    {formatCurrency(prices.PRO[billingCycle])}
                                </span>
                                <span className="text-gray-500 text-sm font-medium">/{billingCycle === 'MONTHLY' ? 'mês' : 'ano'}</span>
                            </div>
                            {billingCycle === 'ANNUAL' && (
                                <p className="text-xs text-green-600 font-bold mb-4 bg-green-50 inline-block px-2 py-1 rounded">
                                    Equivale a {formatCurrency(prices.PRO.ANNUAL / 12)}/mês
                                </p>
                            )}

                            <ul className="space-y-3 text-sm text-gray-600 mt-4 flex-grow">
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" /> <span>Tudo do plano Grátis</span></li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" /> <span>Gestão de Investimentos</span></li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" /> <span>Agenda Financeira</span></li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" /> <span>Relatórios Avançados</span></li>
                            </ul>
                        </div>

                        {/* PLANO VIP */}
                        <div 
                            onClick={() => setSelectedPlan('VIP')}
                            className={`cursor-pointer relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 flex flex-col ${selectedPlan === 'VIP' ? 'border-purple-600 shadow-xl scale-[1.02] z-10' : 'border-gray-200 hover:border-purple-300 hover:shadow-lg opacity-80 hover:opacity-100'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-purple-600 font-bold tracking-wider text-xs uppercase bg-purple-50 px-2 py-1 rounded-md">Exclusivo</span>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-2">Plano VIP</h4>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'VIP' ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                    {selectedPlan === 'VIP' && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                            
                            <div className="mb-2">
                                <span className="text-4xl font-extrabold text-gray-900">
                                    {formatCurrency(prices.VIP[billingCycle])}
                                </span>
                                <span className="text-gray-500 text-sm font-medium">/{billingCycle === 'MONTHLY' ? 'mês' : 'ano'}</span>
                            </div>
                             {billingCycle === 'ANNUAL' && (
                                <p className="text-xs text-green-600 font-bold mb-4 bg-green-50 inline-block px-2 py-1 rounded">
                                    Equivale a {formatCurrency(prices.VIP.ANNUAL / 12)}/mês
                                </p>
                            )}

                            <ul className="space-y-3 text-sm text-gray-600 mt-4 flex-grow">
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600 flex-shrink-0" /> <span>Tudo do plano PRO</span></li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600 flex-shrink-0" /> <span>Prioridade no Suporte</span></li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600 flex-shrink-0" /> <span className="font-bold">Insights com IA avançado</span></li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600 flex-shrink-0" /> <span>Assistente Financeiro IA</span></li>
                            </ul>
                        </div>

                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-transform transform active:scale-95 ${
                            selectedPlan === 'VIP' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        }`}
                    >
                        Confirmar Upgrade para {selectedPlan} {billingCycle === 'MONTHLY' ? '(Mensal)' : '(Anual)'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanSelectionModal;
