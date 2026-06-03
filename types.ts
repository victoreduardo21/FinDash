
export type Page = 'Dashboard' | 'Transações' | 'Investimentos' | 'Agenda' | 'Insights' | 'Configurações' | 'Relatórios' | 'Admin' | 'Créditos' | 'Assinaturas';
export type Theme = 'light' | 'dark';
export type Plan = 'FREE' | 'PRO' | 'VIP';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type Currency = 'BRL' | 'USD';
// Added Language type to fix missing export errors
export type Language = 'pt-BR' | 'en-US';

export enum TransactionType {
  Receita = 'Receita',
  Despesa = 'Despesa',
}

export interface PersonalTransaction {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  type: TransactionType;
  category: string;
  userId?: string;
  createdAt?: string;
}

export interface Investment {
    id: string;
    name: string;
    initialAmount: number;
    currentValue: number;
    yieldRate: number; // Percentage
    currency: Currency;
    userId?: string;
}

export interface CalendarEvent {
    id: string;
    description: string;
    date: string;
    done: boolean;
    userId?: string;
}

export interface Subscription {
    id: string;
    description: string;
    amount: number;
    currency: Currency;
    dueDay: number;
    category: string;
    status: 'ACTIVE' | 'PAUSED';
    userId?: string;
}

export interface CreditCard {
    id: string;
    name: string;
    limit: number;
    closingDay: number;
    dueDay: number;
    currency: Currency;
    userId?: string;
}

export interface CreditTransaction {
    id: string;
    cardId: string; // "cheque_especial" as a special ID or a separate flag
    description: string;
    amount: number;
    installments: number; // Current installment / Total installments (e.g., 1/12)
    totalInstallments: number;
    date: string;
    category: string;
    userId?: string;
    isOverdraft?: boolean;
    status?: 'PENDING' | 'PAID';
    paymentDate?: string;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  messages: AiMessage[];
  lastUpdate: string;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string; // base64 encoded image
  phone?: string;
  cpf?: string;
  subscriptionStatus?: 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'INACTIVE';
  plan: Plan;
  billingCycle?: BillingCycle;
  // Added language property to User interface
  language?: Language;
  role?: 'admin' | 'user';
  phoneVerified?: boolean;
  overdraftLimit?: number;
  createdAt?: string;
}
