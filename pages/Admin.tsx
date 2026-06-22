
import React, { useState, useEffect, useMemo } from 'react';
import { User, Plan } from '../types';
import { api } from '../services/api';
import { db } from '../services/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import MetricCard from '../components/MetricCard';
import { UsersIcon } from '../components/icons/UsersIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { DollarSignIcon } from '../components/icons/DollarSignIcon';
import { Download, X, Info, Briefcase, MapPin, HelpCircle, CreditCard as CreditCardIcon, Calendar } from 'lucide-react';

const PLAN_PRICES = {
    FREE: { MONTHLY: 0, ANNUAL: 0 },
    PRO: { MONTHLY: 39.90, ANNUAL: 399.90 },
    VIP: { MONTHLY: 79.90, ANNUAL: 799.90 }
};

const Admin: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const stats = useMemo(() => {
        const activeUsers = users.filter(u => u.subscriptionStatus === 'ACTIVE');
        const revenue = activeUsers.reduce((acc, u) => {
            const plan = u.plan || 'FREE';
            const cycle = u.billingCycle || 'MONTHLY';
            const price = PLAN_PRICES[plan][cycle];
            return acc + (cycle === 'ANNUAL' ? price / 12 : price);
        }, 0);

        return {
            total: users.length,
            active: activeUsers.length,
            pending: users.filter(u => u.subscriptionStatus === 'PENDING').length,
            revenue
        };
    }, [users]);

    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const fetchedUsers = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
            // Ensure all users have a createdAt date for the table, fallback to a reasonable date if missing
            const processedUsers = fetchedUsers.map(u => ({
                ...u,
                createdAt: u.createdAt || new Date('2024-01-01').toISOString()
            }));
            setUsers(processedUsers);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao carregar usuários:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUpdatePlan = async (userId: string, newPlan: Plan) => {
        setUpdatingUserId(userId);
        try {
            await api.updatePlan(newPlan, 'MONTHLY', userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
        } catch (error) {
            console.error("Erro ao atualizar plano:", error);
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleToggleStatus = async (email: string, currentStatus: string) => {
        const newStatus = (currentStatus === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
        try {
            await api.toggleUserStatus({ targetEmail: email, status: newStatus }, '');
        } catch (error) {
            console.error("Erro ao alternar status:", error);
        }
    };

    const handleExportCSV = () => {
        const headers = [
            "Nome",
            "Email",
            "Telefone",
            "CPF",
            "CNPJ",
            "Razao Social",
            "Inscricao Estadual",
            "Inscricao Municipal",
            "CEP",
            "Rua",
            "Numero",
            "Complemento",
            "Bairro",
            "Cidade",
            "Estado",
            "Plano",
            "Ciclo",
            "Status",
            "Permissao",
            "Data Cadastro",
            "Telefone Verificado",
            "Objetivo Onboarding",
            "O que busca no sistema"
        ];

        const clean = (val: any) => {
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""').replace(/;/g, ' ');
            if (str.includes("\n") || str.includes(",")) {
                return `"${str}"`;
            }
            return str;
        };

        const rows = users.map(u => [
            u.name || "Sem nome",
            u.email,
            u.phone || "",
            u.cpf || "",
            u.cnpj || "",
            u.companyName || "",
            u.stateRegistration || "",
            u.municipalRegistration || "",
            u.cep || "",
            u.street || "",
            u.number || "",
            u.complement || "",
            u.neighborhood || "",
            u.city || "",
            u.state || "",
            u.plan || "FREE",
            u.billingCycle || "MONTHLY",
            u.subscriptionStatus || "INACTIVE",
            u.role || "user",
            u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : "",
            u.phoneVerified ? "Sim" : "Nao",
            u.onboardingObjective || "",
            u.onboardingReason || ""
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(row => row.map(clean).join(";"))
        ].join("\n");

        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `relatorio_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
                    <p className="text-sm text-gray-500">Gerenciamento de {users.length} usuários cadastrados</p>
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95"
                >
                    <Download size={15} />
                    Exportar Relatório (Excel/CSV)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    title="Total de Usuários" 
                    value={stats.total.toString()} 
                    icon={<div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl"><UsersIcon className="h-6 w-6 text-blue-600" /></div>} 
                />
                <MetricCard 
                    title="Assinaturas Ativas" 
                    value={stats.active.toString()} 
                    icon={<div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl"><CheckCircleIcon className="h-6 w-6 text-emerald-600" /></div>} 
                    valueClassName="text-emerald-600 font-black"
                />
                <MetricCard 
                    title="Aguardando Aprovação" 
                    value={stats.pending.toString()} 
                    icon={<div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl"><ClockIcon className="h-6 w-6 text-amber-600" /></div>} 
                    valueClassName="text-amber-600 font-black"
                />
                <MetricCard 
                    title="Faturamento (MRR)" 
                    value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                    icon={<div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl"><DollarSignIcon className="h-6 w-6 text-indigo-600" /></div>} 
                    valueClassName="text-indigo-600 font-black"
                />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Permissão</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Abertura</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plano</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => (
                                <tr 
                                    key={user.id} 
                                    onClick={() => setSelectedUser(user)}
                                    className="hover:bg-blue-50/40 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs mr-3">
                                                {user.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name || 'Sem nome'}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium ${user.role === 'admin' ? 'text-purple-600' : 'text-gray-600'}`}>
                                            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        {user.phone ? (
                                            <a 
                                                href={`https://wa.me/${user.phone.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs font-medium text-green-600 hover:text-green-500 flex items-center gap-1"
                                            >
                                                {user.phone}
                                                {user.phoneVerified && (
                                                    <span className="bg-green-100 text-green-700 px-1 rounded-sm text-[8px] font-black uppercase">Ok</span>
                                                )}
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Não informado</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '--/--/----'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={user.plan} 
                                                onChange={(e) => handleUpdatePlan(user.id!, e.target.value as Plan)}
                                                disabled={updatingUserId === user.id}
                                                className="text-xs font-bold bg-gray-100 dark:bg-slate-700 border-none rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="FREE">FREE</option>
                                                <option value="PRO">PRO</option>
                                                <option value="VIP">VIP</option>
                                            </select>
                                            <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
                                                R$ {PLAN_PRICES[user.plan || 'FREE'][user.billingCycle || 'MONTHLY'].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            user.subscriptionStatus === 'ACTIVE' 
                                            ? 'bg-green-100 text-green-700' 
                                            : user.subscriptionStatus === 'PENDING'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                            {user.subscriptionStatus || 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => handleToggleStatus(user.email, user.subscriptionStatus || 'INACTIVE')}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors"
                                        >
                                            {user.subscriptionStatus === 'PENDING' ? 'Aprovar' : (user.subscriptionStatus === 'ACTIVE' ? 'Desativar' : 'Ativar')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalhes completos do Usuário */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-850">
                        {/* Header */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-gray-805 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                                    {selectedUser.name?.charAt(0) || '?'}
                                </div>
                                <div className="text-left">
                                    <h3 className="text-base font-bold text-gray-950 dark:text-white leading-tight">Perfil de {selectedUser.name || 'Sem Nome'}</h3>
                                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-105 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-6 overflow-y-auto space-y-5 text-left">
                            {/* Sessão 1: Informações de Cadastro */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Info size={13} /> Dados Cadastrais básicos
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Nome Completo</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.name || 'Sem nome'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Email</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white break-all">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">CPF</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.cpf || 'Não cadastrado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Telefone / WhatsApp</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                            {selectedUser.phone || 'Não cadastrado'}
                                            {selectedUser.phoneVerified && (
                                                <span className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-[8px] font-bold uppercase px-1 rounded-sm">Verificado</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sessão 2: Dados Corporativos e Fiscais */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Briefcase size={13} /> Dados Fiscais da Empresa (NF-e)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="md:col-span-2">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Razão Social / Nome da Empresa</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.companyName || 'Pessoa Física'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">CNPJ</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.cnpj || 'Não cadastrado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Inscrição Estadual (IE)</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.stateRegistration || 'Não informado'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Inscrição Municipal (IM)</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.municipalRegistration || 'Não informado'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sessão 3: Endereço */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <MapPin size={13} /> Endereço Comercial ou Residencial
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">CEP</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.cep || 'Não cadastrado'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Logradouro / Rua</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.street || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Número</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.number || 'S/N'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Complemento</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.complement || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Bairro</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.neighborhood || 'Não informado'}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-3">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Cidade / Estado</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                            {selectedUser.city ? `${selectedUser.city} - ${selectedUser.state || ''}` : 'Não informado'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sessão 4: Onboarding */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <HelpCircle size={13} /> Pesquisa de Boas-vindas
                                </h4>
                                <div className="space-y-3 bg-gray-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Qual o seu principal objetivo com o Money Dashs?</p>
                                        <p className="text-xs font-semibold text-gray-800 dark:text-white mt-0.5 border-l-2 border-blue-500 pl-2">
                                            {selectedUser.onboardingObjective === 'organizar_Financas' ? 'Organizar minhas finanças diárias com clareza' :
                                             selectedUser.onboardingObjective === 'controlar_Gastos' ? 'Controlar gastos excessivos e economizar todo mês' :
                                             selectedUser.onboardingObjective === 'planejar_Futuro' ? 'Planejar investimentos de longo prazo e aposentadoria' :
                                             selectedUser.onboardingObjective === 'gerenciar_Empresa' ? 'Gerenciar finanças pessoais e empresariais juntas' :
                                             selectedUser.onboardingObjective || 'Não informado'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">O que você busca em nosso sistema no dia-a-dia?</p>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap bg-white dark:bg-slate-900 p-2 border dark:border-gray-805 leading-relaxed font-medium">
                                            {selectedUser.onboardingReason || 'Não informado'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sessão 5: assinatura */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <CreditCardIcon size={13} /> Detalhes da Cobrança & Plano
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Plano Atual</p>
                                        <p className="font-bold text-blue-600 dark:text-blue-400">{selectedUser.plan || 'FREE'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Faturamento (MRR)</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            R$ {PLAN_PRICES[selectedUser.plan || 'FREE'][selectedUser.billingCycle || 'MONTHLY'].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Frequência</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.billingCycle === 'ANNUAL' ? 'Anual' : 'Mensal'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Data de Criação</p>
                                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                            <Calendar size={11} />
                                            {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('pt-BR') : '--/--/----'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Status</p>
                                        <span className={`inline-block px-1.5 py-0.5 mt-0.5 rounded-full text-[8px] font-bold ${
                                            selectedUser.subscriptionStatus === 'ACTIVE' 
                                            ? 'bg-green-100 text-green-700' 
                                            : selectedUser.subscriptionStatus === 'PENDING'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                            {selectedUser.subscriptionStatus || 'INACTIVE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3.5 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-gray-805 flex justify-end gap-2 text-xs">
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="px-5 py-2 bg-gray-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl transition-all"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
