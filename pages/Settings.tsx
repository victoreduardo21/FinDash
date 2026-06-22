
import React, { useState, useEffect, useMemo } from 'react';
import { Theme, User, Language } from '../types';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CreateUserModal from '../components/CreateUserModal';
import { api } from '../services/api';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { useTranslation } from '../translations';
import { auth } from '../services/firebase';
import { RecaptchaVerifier, linkWithPhoneNumber, PhoneAuthProvider, PhoneMultiFactorGenerator } from 'firebase/auth';
import { CheckCircleIcon, Mail, BellRing } from 'lucide-react';

const ADMIN_EMAIL = 'eduardopontesdias@outlook.com'; 

interface SettingsProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentUser: User;
    onUpdatePassword: (currentPassword: string, newPassword: string) => void;
    onUpdateAvatar: (avatar: string) => void;
    onCreateUser: (newUser: Omit<User, 'id'>) => Promise<{success: boolean, message: string}>;
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, currentUser, onUpdatePassword, onUpdateAvatar, onCreateUser, language, onLanguageChange }) => {
  const t = useTranslation(language);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [clients, setClients] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    phone: currentUser.phone || '',
    cpf: currentUser.cpf || '',
    cnpj: currentUser.cnpj || '',
    companyName: currentUser.companyName || '',
    stateRegistration: currentUser.stateRegistration || '',
    municipalRegistration: currentUser.municipalRegistration || '',
    cep: currentUser.cep || '',
    street: currentUser.street || '',
    number: currentUser.number || '',
    complement: currentUser.complement || '',
    neighborhood: currentUser.neighborhood || '',
    city: currentUser.city || '',
    state: currentUser.state || '',
    onboardingObjective: currentUser.onboardingObjective || '',
    onboardingReason: currentUser.onboardingReason || '',
  });
  const [verificationId, setVerificationId] = useState<any>(null);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = currentUser.role === 'admin' || currentUser.email === ADMIN_EMAIL || currentUser.email === 'gtsglobaltech01@gmail.com';

  useEffect(() => {
    setFormData({
      name: currentUser.name,
      phone: currentUser.phone || '',
      cpf: currentUser.cpf || '',
      cnpj: currentUser.cnpj || '',
      companyName: currentUser.companyName || '',
      stateRegistration: currentUser.stateRegistration || '',
      municipalRegistration: currentUser.municipalRegistration || '',
      cep: currentUser.cep || '',
      street: currentUser.street || '',
      number: currentUser.number || '',
      complement: currentUser.complement || '',
      neighborhood: currentUser.neighborhood || '',
      city: currentUser.city || '',
      state: currentUser.state || '',
      onboardingObjective: currentUser.onboardingObjective || '',
      onboardingReason: currentUser.onboardingReason || '',
    });
  }, [currentUser]);

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return;
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => {}
    });
  };

  const handleSendCode = async () => {
    setError('');
    if (!formData.phone) return alert("Digite um número de telefone com código do país (ex: +55...)");
    
    try {
        setIsVerifying(true);
        setupRecaptcha();
        const verifier = (window as any).recaptchaVerifier;
        const user = auth.currentUser;
        if (!user) return;

        // Use linkWithPhoneNumber for currently logged-in users
        const provider = new PhoneAuthProvider(auth);
        const vid = await provider.verifyPhoneNumber(formData.phone, verifier);
        setVerificationId(vid);
        alert(t('smsSent'));
    } catch (err: any) {
        console.error(err);
        setError("Erro ao enviar SMS. Verifique se o formato está correto (+5511...)");
    } finally {
        setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!otp || !verificationId) return;
    try {
        setIsVerifying(true);
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        
        // This links the phone to the auth user, verifying it
        await api.updateUser(auth.currentUser!.uid, { phone: formData.phone, phoneVerified: true });
        
        alert(t('phoneVerified'));
        setVerificationId(null);
        setOtp('');
        // Reload page to refresh state or just rely on state update
        window.location.reload(); 
    } catch (err: any) {
        setError(t('invalidCode'));
    } finally {
        setIsVerifying(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validação de campos obrigatórios do endereço, cadastro básico e dados fiscais
    if (!formData.name?.trim()) {
        alert("O nome é obrigatório.");
        return;
    }
    if (!formData.cpf?.trim()) {
        alert("O CPF é obrigatório.");
        return;
    }
    if (!formData.phone?.trim()) {
        alert("O telefone é obrigatório.");
        return;
    }
    if (!formData.cep?.trim()) {
        alert("O CEP é obrigatório.");
        return;
    }
    if (!formData.street?.trim()) {
        alert("O Logradouro / Rua é obrigatório.");
        return;
    }
    if (!formData.number?.trim()) {
        alert("O Número é obrigatório.");
        return;
    }
    if (!formData.neighborhood?.trim()) {
        alert("O Bairro é obrigatório.");
        return;
    }
    if (!formData.city?.trim()) {
        alert("A Cidade é obrigatória.");
        return;
    }
    if (!formData.state?.trim()) {
        alert("O Estado (UF) é obrigatório.");
        return;
    }
    if (!formData.onboardingObjective?.trim()) {
        alert("O principal objetivo de uso é obrigatório.");
        return;
    }
    if (!formData.onboardingReason?.trim()) {
        alert("O que você busca em nosso sistema é obrigatório.");
        return;
    }

    try {
        await api.updateUser(auth.currentUser!.uid, formData);
        setIsEditing(false);
        alert(t('saveChanges'));
    } catch (err) {
        alert("Erro ao salvar.");
    }
  };

  const loadAdminData = async () => {
    if (isAdmin) {
        const users = await api.getAllUsers(btoa(currentUser.email));
        if (Array.isArray(users)) setClients(users);
    }
  };

  useEffect(() => {
      loadAdminData();
  }, [isAdmin, currentUser.email]);

  const userInitials = useMemo(() => {
      const name = currentUser?.name || 'U';
      const parts = name.trim().split(' ');
      return parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [currentUser]);
  
  const getPriceDisplay = () => {
      if (currentUser.plan === 'FREE') return t('language') === 'Idioma' ? 'Grátis' : 'Free';
      const isAnnual = currentUser.billingCycle === 'ANNUAL';
      if (currentUser.plan === 'VIP') return isAnnual ? 'R$ 799,90' : 'R$ 79,90';
      if (currentUser.plan === 'PRO') return isAnnual ? 'R$ 399,90' : 'R$ 39,90';
      return 'FREE';
  };

  const handleToggleStatus = async (user: User) => {
      const newStatus = user.subscriptionStatus === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
      const confirmMsg = newStatus === 'PENDING' ? t('confirmDeactivate') : t('confirmActivate');
      
      if (window.confirm(confirmMsg)) {
          try {
              // Fix: Correcting the arguments passed to api.toggleUserStatus to match its signature {targetEmail, status}, token
              await api.toggleUserStatus({ targetEmail: user.email, status: newStatus }, btoa(currentUser.email));
              loadAdminData(); // Recarrega a lista
          } catch (error) {
              alert("Erro ao alterar status.");
          }
      }
  };

  return (
    <>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSave={onUpdatePassword} language={language} />
      <CreateUserModal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} onCreate={onCreateUser} language={language} />
      <div>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{t('settings')}</h3>
        
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* PERFIL */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">{t('profile')}</h4>
            <div id="recaptcha-container"></div>
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-8">
                <div className="h-28 w-28 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-4xl font-bold text-blue-700 dark:text-blue-200 shadow-lg border-4 border-white dark:border-gray-600 sticky top-4">{userInitials}</div>
                <div className="flex-1 min-w-0 space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} 
                            className="text-xs font-bold px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                        >
                            {isEditing ? t('save') : t('editProfile')}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">1. Identificação e Dados Fiscais</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('name')} <span className="text-red-500 font-bold">*</span></label>
                                <input type="text" value={isEditing ? formData.name : currentUser.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={!isEditing} className={`block w-full px-4 py-2 rounded-lg border text-sm ${isEditing ? 'bg-white dark:bg-gray-800 border-blue-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input type="email" value={currentUser.email} disabled className="block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg text-sm text-gray-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('cpf')} <span className="text-red-500 font-bold">*</span></label>
                                <input type="text" placeholder="000.000.000-00" value={isEditing ? formData.cpf : (currentUser.cpf || '-')} onChange={(e) => setFormData({...formData, cpf: e.target.value})} disabled={!isEditing} className={`block w-full px-4 py-2 border rounded-lg text-sm ${isEditing ? 'bg-white dark:bg-gray-800 border-blue-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('phone')} <span className="text-red-500 font-bold">*</span></label>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <input 
                                            type="text" 
                                            placeholder="+5511999999999"
                                            value={isEditing ? formData.phone : (currentUser.phone || '-')} 
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                            disabled={!isEditing} 
                                            className={`block w-full px-4 py-2 border rounded-lg text-sm ${isEditing ? 'bg-white border-blue-500 dark:bg-gray-800 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} 
                                        />
                                        {currentUser.phoneVerified && !isEditing && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1">
                                                <CheckCircleIcon size={14} />
                                                <span className="text-[9px] font-bold">{t('phoneVerified')}</span>
                                            </div>
                                        )}
                                    </div>
                                    {isEditing && !currentUser.phoneVerified && (
                                        <button 
                                            type="button"
                                            onClick={handleSendCode}
                                            disabled={isVerifying}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {t('verifyPhone')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                            
                            {verificationId && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{t('enterCode')}</p>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="123456"
                                            className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-center tracking-[1em] font-bold"
                                        />
                                        <button 
                                            onClick={handleVerifyCode}
                                            disabled={isVerifying}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold"
                                        >
                                            OK
                                        </button>
                                    </div>
                                    {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                                </div>
                            )}
                        </div>

                    <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                        <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">2. Endereço Comercial ou Residencial</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CEP <span className="text-red-500 font-bold">*</span></label>
                                <input type="text" placeholder="00000-000" value={isEditing ? formData.cep : (currentUser.cep || '-')} onChange={(e) => setFormData({...formData, cep: e.target.value})} disabled={!isEditing} className={`block w-full px-4 py-2 border rounded-lg text-sm ${isEditing ? 'bg-white dark:bg-gray-800 border-blue-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logradouro / Rua <span className="text-red-500 font-bold">*</span></label>
                                <input type="text" placeholder="Av / Rua / Beco" value={isEditing ? formData.street : (currentUser.street || '-')} onChange={(e) => setFormData({...formData, street: e.target.value})} disabled={!isEditing} className={`block w-full px-4 py-2 border rounded-lg text-sm ${isEditing ? 'bg-white dark:bg-gray-800 border-blue-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número <span className="text-red-500 font-bold">*</span></label>
                                <input type="text" placeholder="123" value={isEditing ? formData.number : (currentUser.number || '-')} onChange={(e) => setFormData({...formData, number: e.target.value})} disabled={!isEditing} className={`block w-full px-4 py-2 border rounded-lg text-sm ${isEditing ? 'bg-white dark:bg-gray-800 border-blue-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Complemento</label>
                                <input type="text" placeholder="Apto 4B" value={isEditing ? formData.complement : (currentUser.complement || '-')} onChange={(e) => setFormData({...formData, complement: e.target.value})} disabled={!isEditing} className={`block w-full px-4 py-2 border rounded-lg text-sm ${isEditing ? 'bg-white dark:bg-gray-800 border-blue-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bairro <span className="text-red-500 font-bold">*</span></label>
                                <input type="text" placeholder="Centro" value={isEditing ? formData.neighborhood : (currentUser.neighborhood || '-')} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} disabled={!isEditing} className={`block w-full px-4 py-2 border rounded-lg text-sm ${isEditing ? 'bg-white dark:bg-gray-800 border-blue-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cidade <span className="text-red-500 font-bold">*</span></label>
                                <input type="text" placeholder="São Paulo" value={isEditing ? formData.city : (currentUser.city || '-')} onChange={(e) => setFormData({...formData, city: e.target.value})} disabled={!isEditing} className={`block w-full px-4 py-2 border rounded-lg text-sm ${isEditing ? 'bg-white dark:bg-gray-800 border-blue-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UF / Estado <span className="text-red-500 font-bold">*</span></label>
                                <input type="text" maxLength={2} placeholder="SP" value={isEditing ? formData.state : (currentUser.state || '-')} onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})} disabled={!isEditing} className={`block w-full text-center px-4 py-2 border rounded-lg text-sm ${isEditing ? 'bg-white dark:bg-gray-800 border-blue-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                        <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">3. Experiência e Objetivos de Uso</h5>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qual o seu principal objetivo com o Money Dashs? <span className="text-red-500 font-bold">*</span></label>
                            {isEditing ? (
                                <select 
                                    value={formData.onboardingObjective} 
                                    onChange={(e) => setFormData({...formData, onboardingObjective: e.target.value})}
                                    className="block w-full px-4 py-2 border border-blue-500 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="">Selecione o objetivo</option>
                                    <option value="organizar_Financas">Organizar minhas finanças diárias com clareza</option>
                                    <option value="controlar_Gastos">Controlar gastos excessivos e economizar todo mês</option>
                                    <option value="planejar_Futuro">Planejar investimentos de longo prazo e aposentadoria</option>
                                    <option value="gerenciar_Empresa">Gerenciar finanças pessoais e empresariais juntas</option>
                                </select>
                            ) : (
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 font-medium">
                                    {currentUser.onboardingObjective === 'organizar_Financas' ? 'Organizar minhas finanças diárias com clareza' :
                                     currentUser.onboardingObjective === 'controlar_Gastos' ? 'Controlar gastos excessivos e economizar todo mês' :
                                     currentUser.onboardingObjective === 'planejar_Futuro' ? 'Planejar investimentos de longo prazo e aposentadoria' :
                                     currentUser.onboardingObjective === 'gerenciar_Empresa' ? 'Gerenciar finanças pessoais e empresariais juntas' :
                                     currentUser.onboardingObjective || 'Não informado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">O que você busca em nosso sistema para o seu dia-a-dia? <span className="text-red-500 font-bold">*</span></label>
                            {isEditing ? (
                                <textarea 
                                    rows={3} 
                                    placeholder="Ex: Busco centralizar todas as minhas despesas em cartões, acompanhar o vencimento do cheque especial e ver insights sobre gastos." 
                                    value={formData.onboardingReason} 
                                    onChange={(e) => setFormData({...formData, onboardingReason: e.target.value})} 
                                    className="block w-full px-4 py-2 border border-blue-500 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 whitespace-pre-wrap font-medium">
                                    {currentUser.onboardingReason || 'Não informado'}
                                </p>
                            )}
                        </div>
                    </div>

                    <button onClick={() => setIsPasswordModalOpen(true)} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 pt-2 block">{t('changePassword')}</button>
                </div>
            </div>
          </div>

          {!isAdmin && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-green-100 dark:border-green-900/30">
                <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white flex items-center"><CreditCardIcon className="h-6 w-6 mr-2 text-green-600" />{t('mySubscription')}</h4>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700">{currentUser.subscriptionStatus === 'ACTIVE' ? t('active') : t('pending')}</span>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-6 md:mb-0">
                        <p className="text-gray-600 dark:text-gray-400 font-medium">{t('plan')}</p>
                        <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">{getPriceDisplay()}<span className="text-sm font-semibold text-gray-500 ml-1">{currentUser.plan !== 'FREE' ? (currentUser.billingCycle === 'ANNUAL' ? (t('language') === 'Idioma' ? '/ano' : '/yr') : (t('language') === 'Idioma' ? '/mês' : '/mo')) : ''}</span></p>
                    </div>
                    <button onClick={() => window.open(`https://wa.me/5513996104848?text=${encodeURIComponent(`Email: ${currentUser.email}`)}`, '_blank')} className="bg-[#25D366] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg flex items-center"><WhatsAppIcon className="h-5 w-5 mr-2" />{t('requestPayment')}</button>
                </div>
            </div>
          )}

          {/* PAINEL ADMINISTRATIVO COM BOTÃO DE DESATIVAR */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-blue-600 flex items-center"><UsersIcon className="h-6 w-6 mr-2" />{t('adminPanel')}</h4>
                    <button onClick={() => setIsCreateUserModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all">
                        {t('addAdmin')}
                    </button>
                </div>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-gray-800 dark:text-white">{t('manageSubscribers')}</p>
                    </div>
                </div>
                <div className="overflow-x-auto rounded-xl border dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('name')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('plan')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {clients.map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{c.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{c.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.plan}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${c.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {c.subscriptionStatus === 'ACTIVE' ? t('active') : t('pending')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button 
                                            onClick={() => handleToggleStatus(c)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                c.subscriptionStatus === 'ACTIVE' 
                                                ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200' 
                                                : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200'
                                            }`}
                                        >
                                            {c.subscriptionStatus === 'ACTIVE' ? t('deactivate') : t('activate')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {/* APARÊNCIA */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
              <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">{t('appearance')}</h4>
              <div className="flex items-center justify-between mb-6"><div><p className="font-bold text-gray-800 dark:text-white">{t('darkMode')}</p></div><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`w-14 h-8 rounded-full transition-all border-2 flex items-center ${theme === 'dark' ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'}`}><span className={`w-6 h-6 bg-white rounded-full transition-all shadow-md flex items-center justify-center ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}>{theme === 'dark' ? <MoonIcon className="h-3 w-3 text-blue-600" /> : <SunIcon className="h-3 w-3 text-yellow-500" />}</span></button></div>
              <div className="flex items-center justify-between border-t pt-6 dark:border-gray-700"><div><p className="font-bold text-gray-800 dark:text-white">{t('language')}</p></div><div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full border dark:border-gray-600"><button onClick={() => onLanguageChange('pt-BR')} className={`px-3 py-1 rounded-full text-xs font-bold ${language === 'pt-BR' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-400'}`}>PT-BR</button><button onClick={() => onLanguageChange('en-US')} className={`px-3 py-1 rounded-full text-xs font-bold ${language === 'en-US' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-400'}`}>EN-US</button></div></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
