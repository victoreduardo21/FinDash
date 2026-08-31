import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { 
  PersonalTransaction, 
  TransactionType, 
  Investment, 
  CreditTransaction, 
  Subscription, 
  Currency, 
  Language, 
  User 
} from '../types';
import { sharePdfToWhatsApp } from '../utils/pdfShare';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  ShieldCheck, 
  Printer,
  Building2,
  PieChart as PieChartIcon,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';

interface AnnualIncomeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: PersonalTransaction[];
  investments: Investment[];
  creditTransactions?: CreditTransaction[];
  subscriptions?: Subscription[];
  language?: Language;
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  currentUser?: User | null;
}

export const AnnualIncomeReportModal: React.FC<AnnualIncomeReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  investments,
  creditTransactions = [],
  subscriptions = [],
  language = 'pt-BR',
  selectedCurrency,
  onCurrencyChange,
  currentUser
}) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  // Extract available years from transactions, default to current and previous years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(currentYear);
    yearsSet.add((Number(currentYear) - 1).toString());
    yearsSet.add((Number(currentYear) - 2).toString());

    transactions.forEach(t => {
      if (t.date && t.date.length >= 4) {
        const y = t.date.substring(0, 4);
        if (/^\d{4}$/.test(y)) yearsSet.add(y);
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [transactions, currentYear]);

  const isPT = language === 'pt-BR';
  const currencySymbol = selectedCurrency === 'USD' ? '$' : 'R$';

  const formatCurrency = (value: number) => {
    const normalized = Math.abs(value) < 0.009 ? 0 : value;
    return `${currencySymbol} ${normalized.toLocaleString(isPT ? 'pt-BR' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const isInternalTransfer = (category: string) => {
    if (!category) return false;
    const cat = category.toLowerCase().trim();
    const internalKeywords = [
      'investimento', 'investimentos', 'investment', 'investments',
      'aporte', 'aportes', 'contribution', 'contributions',
      'câmbio', 'cambio', 'exchange', 'transferência', 'transferencia', 'transfer', 'resgate'
    ];
    return internalKeywords.some(k => cat.includes(k));
  };

  // Calculate annual metrics for the selected year and currency
  const reportData = useMemo(() => {
    const yearTxs = transactions.filter(t => 
      (t.currency || 'BRL') === selectedCurrency && 
      t.date && 
      t.date.startsWith(selectedYear)
    );

    // Initial Balance (everything before this year)
    const initialBalance = transactions.reduce((acc, t) => {
      const txCurrency = t.currency || 'BRL';
      if (txCurrency === selectedCurrency && t.date < `${selectedYear}-01-01`) {
        const amount = Number(t.amount) || 0;
        return acc + (t.type === TransactionType.Receita ? amount : -amount);
      }
      return acc;
    }, 0);

    // Incomes breakdown
    let totalIncome = 0;
    const incomeCategories: Record<string, { total: number; count: number }> = {};

    // Expenses breakdown
    let totalRealExpense = 0;
    const expenseCategories: Record<string, { total: number; count: number }> = {};

    // Contributions / Investments movement
    let totalContributions = 0;
    let totalRedemptions = 0;

    // Monthly breakdown (Jan - Dec)
    const monthNames = isPT 
      ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyList = monthNames.map((name, index) => ({
      index,
      name,
      monthKey: `${selectedYear}-${String(index + 1).padStart(2, '0')}`,
      income: 0,
      expense: 0,
      contributions: 0,
      balance: 0
    }));

    yearTxs.forEach(t => {
      const amount = Number(t.amount) || 0;
      const cat = t.category || (isPT ? 'Geral' : 'General');
      const monthIdx = parseInt(t.date.split('-')[1], 10) - 1;

      if (t.type === TransactionType.Receita) {
        totalIncome += amount;
        if (!incomeCategories[cat]) incomeCategories[cat] = { total: 0, count: 0 };
        incomeCategories[cat].total += amount;
        incomeCategories[cat].count += 1;

        if (monthIdx >= 0 && monthIdx < 12) {
          monthlyList[monthIdx].income += amount;
        }
      } else {
        // Despesa
        const isInternal = isInternalTransfer(cat);
        const catLower = cat.toLowerCase();
        if (catLower.includes('aporte') || catLower.includes('invest')) {
          totalContributions += amount;
          if (monthIdx >= 0 && monthIdx < 12) {
            monthlyList[monthIdx].contributions += amount;
          }
        } else if (!isInternal) {
          totalRealExpense += amount;
          if (!expenseCategories[cat]) expenseCategories[cat] = { total: 0, count: 0 };
          expenseCategories[cat].total += amount;
          expenseCategories[cat].count += 1;

          if (monthIdx >= 0 && monthIdx < 12) {
            monthlyList[monthIdx].expense += amount;
          }
        }
      }
    });

    // Credit cards expenses in this year (if any pending/registered)
    const yearCreditTotal = (creditTransactions || [])
      .filter(ctx => ctx.date && ctx.date.startsWith(selectedYear))
      .reduce((acc, ctx) => acc + (Number(ctx.amount) || 0), 0);

    // Active subscriptions in this year
    let yearSubscriptionsTotal = 0;
    monthlyList.forEach(m => {
      const subsMonth = (subscriptions || [])
        .filter(s => {
          if (s.status !== 'ACTIVE' || s.currency !== selectedCurrency) return false;
          if (s.startDate) {
            const startMonth = s.startDate.slice(0, 7);
            return m.monthKey >= startMonth;
          }
          return true;
        })
        .reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
      
      yearSubscriptionsTotal += subsMonth;
    });

    // Calculate rolling balances for the year
    let runningBalance = initialBalance;
    monthlyList.forEach(m => {
      const netMonth = m.income - m.expense - m.contributions;
      runningBalance += netMonth;
      m.balance = runningBalance;
    });

    const finalBalance = runningBalance;
    const netAnnualSavings = totalIncome - totalRealExpense - totalContributions;

    // Assets & Investments position
    const userInvestments = (investments || []).filter(i => (i.currency || 'BRL') === selectedCurrency);
    const totalInvestedInitial = userInvestments.reduce((acc, i) => acc + (Number(i.initialAmount) || 0), 0);
    const totalInvestedCurrent = userInvestments.reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);
    const totalInvestedYield = totalInvestedCurrent - totalInvestedInitial;

    // Sorted categories arrays
    const sortedIncomeCategories = Object.entries(incomeCategories)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total);

    const sortedExpenseCategories = Object.entries(expenseCategories)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total);

    return {
      initialBalance,
      finalBalance,
      totalIncome,
      totalRealExpense,
      totalContributions,
      totalRedemptions,
      yearCreditTotal,
      yearSubscriptionsTotal,
      netAnnualSavings,
      sortedIncomeCategories,
      sortedExpenseCategories,
      monthlyList,
      userInvestments,
      totalInvestedInitial,
      totalInvestedCurrent,
      totalInvestedYield,
      transactionCount: yearTxs.length
    };
  }, [transactions, investments, creditTransactions, subscriptions, selectedYear, selectedCurrency, isPT]);

  if (!isOpen) return null;

  const userName = currentUser?.name || (isPT ? 'Usuário Registrado' : 'Registered User');
  const userEmail = currentUser?.email || 'contato@gtsglobaltech.com';
  const exerciseYear = (Number(selectedYear) + 1).toString();
  const authCode = `GTS-INF-${selectedYear}-${Math.abs(reportData.totalIncome).toString(36).toUpperCase()}-${Math.abs(reportData.totalRealExpense).toString(36).toUpperCase()}`;

  // Generate text for WhatsApp and Clipboard
  const generateReportText = () => {
    const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    if (isPT) {
      return `📄 *INFORME DE RENDIMENTOS ANUAL - ${selectedYear}*\n*Exercício: ${exerciseYear} | GTS Global Tech Software*\n${divider}\n👤 *Titular:* ${userName}\n📧 *E-mail:* ${userEmail}\n💱 *Moeda Base:* ${selectedCurrency}\n🔒 *Autenticação:* ${authCode}\n${divider}\n📊 *RESUMO GERAL DO ANO:*\n💰 *Rendimentos Totais (Receitas):* ${formatCurrency(reportData.totalIncome)}\n📉 *Custo de Vida Total (Despesas):* ${formatCurrency(reportData.totalRealExpense)}\n📈 *Total Aportado em Investimentos:* ${formatCurrency(reportData.totalContributions)}\n💵 *Resultado Líquido do Ano:* ${formatCurrency(reportData.netAnnualSavings)}\n${divider}\n💼 *PATRIMÔNIO & ATIVOS EM 31/12/${selectedYear}:*\n🏦 *Saldo em Contas:* ${formatCurrency(reportData.finalBalance)}\n📊 *Posição em Investimentos:* ${formatCurrency(reportData.totalInvestedCurrent)}\n📈 *Rendimento Total Acumulado:* ${formatCurrency(reportData.totalInvestedYield)}\n${divider}\n_Informe gerado automaticamente pelo Money Dashs em ${new Date().toLocaleDateString('pt-BR')}._`;
    } else {
      return `📄 *ANNUAL FINANCIAL & INCOME REPORT - ${selectedYear}*\n*Tax Year: ${exerciseYear} | GTS Global Tech Software*\n${divider}\n👤 *Holder:* ${userName}\n📧 *Email:* ${userEmail}\n💱 *Base Currency:* ${selectedCurrency}\n🔒 *Auth Code:* ${authCode}\n${divider}\n📊 *ANNUAL SUMMARY:*\n💰 *Total Gross Income:* ${formatCurrency(reportData.totalIncome)}\n📉 *Total Real Expenses:* ${formatCurrency(reportData.totalRealExpense)}\n📈 *Total Contributions/Invested:* ${formatCurrency(reportData.totalContributions)}\n💵 *Net Annual Balance:* ${formatCurrency(reportData.netAnnualSavings)}\n${divider}\n💼 *ASSETS & INVESTMENTS (DEC 31, ${selectedYear}):*\n🏦 *Cash/Account Balance:* ${formatCurrency(reportData.finalBalance)}\n📊 *Investment Assets Value:* ${formatCurrency(reportData.totalInvestedCurrent)}\n📈 *Total Capital Gains/Yield:* ${formatCurrency(reportData.totalInvestedYield)}\n${divider}\n_Generated automatically via Money Dashs on ${new Date().toLocaleDateString('en-US')}._`;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Error copying:', e);
    }
  };

  const buildAnnualReportPdfDoc = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

        const pageWidth = 210;
        const margin = 14;
        const contentWidth = pageWidth - margin * 2;

        // Colors
        const primaryColor = [15, 23, 42]; // Slate 900
        const accentColor = [79, 70, 229]; // Indigo 600
        const lightBg = [248, 250, 252];
        const textColor = [30, 41, 59];
        const mutedTextColor = [100, 116, 139];

        // 1. TOP HEADER BANNER
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(margin, 12, contentWidth, 24, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text("GTS GLOBAL TECH SOFTWARE | MONEY DASHS", margin + 6, 21);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(
          isPT 
            ? `INFORME ANUAL DE RENDIMENTOS E PATRIMÔNIO — ANO-CALENDÁRIO ${selectedYear}`
            : `ANNUAL FINANCIAL STATEMENT & TAX INCOME REPORT — TAX YEAR ${selectedYear}`,
          margin + 6, 
          28
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(
          isPT ? `EXERCÍCIO: ${exerciseYear}` : `EXERCISE: ${exerciseYear}`,
          margin + contentWidth - 30,
          21
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(
          new Date().toLocaleDateString(isPT ? 'pt-BR' : 'en-US'),
          margin + contentWidth - 30,
          28
        );

        // 2. IDENTIFICAÇÃO DO TITULAR
        let currentY = 41;
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(margin, currentY, contentWidth, 20, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, currentY, contentWidth, 20, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text(isPT ? "QUADRO 1: IDENTIFICAÇÃO DO TITULAR" : "SECTION 1: HOLDER IDENTIFICATION", margin + 4, currentY + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text(isPT ? "NOME DO TITULAR:" : "HOLDER NAME:", margin + 4, currentY + 11);
        doc.text(isPT ? "E-MAIL DE CADASTRO:" : "EMAIL ADDRESS:", margin + 70, currentY + 11);
        doc.text(isPT ? "MOEDA BASE:" : "BASE CURRENCY:", margin + 140, currentY + 11);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(userName.substring(0, 32), margin + 4, currentY + 16);
        doc.text(userEmail.substring(0, 32), margin + 70, currentY + 16);
        doc.text(selectedCurrency, margin + 140, currentY + 16);

        // 3. QUADRO 2: RESUMO EXECUTIVO ANUAL
        currentY = 66;
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(margin, currentY, contentWidth, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(isPT ? "QUADRO 2: RESUMO ANUAL CONSOLIDADO" : "SECTION 2: CONSOLIDATED ANNUAL SUMMARY", margin + 4, currentY + 4.5);

        currentY += 6;
        const boxWidth = contentWidth / 4;
        const summaryBoxes = [
          { label: isPT ? "Rendimentos Totais" : "Total Income", val: formatCurrency(reportData.totalIncome), color: [16, 185, 129] },
          { label: isPT ? "Custo de Vida (Despesas)" : "Total Expenses", val: formatCurrency(reportData.totalRealExpense), color: [239, 68, 68] },
          { label: isPT ? "Aportes em Investimentos" : "Contributions", val: formatCurrency(reportData.totalContributions), color: [99, 102, 241] },
          { label: isPT ? "Resultado Líquido do Ano" : "Net Annual Savings", val: formatCurrency(reportData.netAnnualSavings), color: [59, 130, 246] },
        ];

        summaryBoxes.forEach((box, i) => {
          const bx = margin + (i * boxWidth);
          doc.setFillColor(255, 255, 255);
          doc.rect(bx, currentY, boxWidth, 14, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.rect(bx, currentY, boxWidth, 14, 'S');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
          doc.text(box.label.toUpperCase(), bx + 3, currentY + 4.5);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(box.color[0], box.color[1], box.color[2]);
          doc.text(box.val, bx + 3, currentY + 10.5);
        });

        // 4. QUADRO 3: RENDIMENTOS POR CATEGORIA (RECEITAS)
        currentY += 19;
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(isPT ? "QUADRO 3: DISCRIMINAÇÃO DOS RENDIMENTOS RECEBIDOS NO ANO" : "SECTION 3: ANNUAL INCOME BREAKDOWN BY CATEGORY", margin + 4, currentY + 4);

        currentY += 5.5;
        // Table header
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(margin, currentY, contentWidth, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text(isPT ? "CATEGORIA DE RENDIMENTO" : "INCOME CATEGORY", margin + 4, currentY + 3.5);
        doc.text(isPT ? "QUANTIDADE" : "COUNT", margin + 110, currentY + 3.5);
        doc.text(isPT ? "VALOR TOTAL" : "TOTAL AMOUNT", margin + 145, currentY + 3.5);

        currentY += 5;
        const topIncomes = reportData.sortedIncomeCategories.slice(0, 5);
        if (topIncomes.length === 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
          doc.text(isPT ? "Nenhum rendimento registrado no ano selecionado." : "No income recorded in this tax year.", margin + 4, currentY + 4);
          currentY += 6;
        } else {
          topIncomes.forEach((inc) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(inc.category, margin + 4, currentY + 4);
            doc.text(`${inc.count}x`, margin + 110, currentY + 4);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(inc.total), margin + 145, currentY + 4);

            doc.setDrawColor(241, 245, 249);
            doc.line(margin, currentY + 5.5, margin + contentWidth, currentY + 5.5);
            currentY += 5.5;
          });
        }

        // 5. QUADRO 4: DESPESAS E CUSTO DE VIDA POR CATEGORIA
        currentY += 3;
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(isPT ? "QUADRO 4: DISCRIMINAÇÃO DE DESPESAS E CUSTO DE VIDA" : "SECTION 4: ANNUAL EXPENSES & LIVING COSTS", margin + 4, currentY + 4);

        currentY += 5.5;
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(margin, currentY, contentWidth, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text(isPT ? "CATEGORIA DE DESPESA" : "EXPENSE CATEGORY", margin + 4, currentY + 3.5);
        doc.text(isPT ? "QUANTIDADE" : "COUNT", margin + 110, currentY + 3.5);
        doc.text(isPT ? "VALOR TOTAL" : "TOTAL AMOUNT", margin + 145, currentY + 3.5);

        currentY += 5;
        const topExpenses = reportData.sortedExpenseCategories.slice(0, 6);
        if (topExpenses.length === 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
          doc.text(isPT ? "Nenhuma despesa registrada no ano selecionado." : "No expenses recorded in this tax year.", margin + 4, currentY + 4);
          currentY += 6;
        } else {
          topExpenses.forEach((exp) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(exp.category, margin + 4, currentY + 4);
            doc.text(`${exp.count}x`, margin + 110, currentY + 4);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(exp.total), margin + 145, currentY + 4);

            doc.setDrawColor(241, 245, 249);
            doc.line(margin, currentY + 5.5, margin + contentWidth, currentY + 5.5);
            currentY += 5.5;
          });
        }

        // 6. QUADRO 5: BENS, DIREITOS E INVESTIMENTOS EM 31/12
        currentY += 3;
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(
          isPT 
            ? `QUADRO 5: POSIÇÃO DE INVESTIMENTOS E ATIVOS EM 31/12/${selectedYear}`
            : `SECTION 5: INVESTMENT ASSETS & HOLDINGS (DEC 31, ${selectedYear})`,
          margin + 4, 
          currentY + 4
        );

        currentY += 5.5;
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(margin, currentY, contentWidth, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text(isPT ? "ATIVO / INVESTIMENTO" : "ASSET / INVESTMENT", margin + 4, currentY + 3.5);
        doc.text(isPT ? "VALOR APLICADO" : "INITIAL APPLIED", margin + 85, currentY + 3.5);
        doc.text(isPT ? "VALOR ATUAL (31/12)" : "CURRENT VALUE", margin + 120, currentY + 3.5);
        doc.text(isPT ? "RENDIMENTO" : "YIELD", margin + 155, currentY + 3.5);

        currentY += 5;
        const invList = reportData.userInvestments.slice(0, 5);
        if (invList.length === 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
          doc.text(isPT ? "Nenhum ativo de investimento cadastrado nesta moeda." : "No investment assets registered in this currency.", margin + 4, currentY + 4);
          currentY += 6;
        } else {
          invList.forEach((inv) => {
            const yld = (Number(inv.currentValue) || 0) - (Number(inv.initialAmount) || 0);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(inv.name.substring(0, 35), margin + 4, currentY + 4);
            doc.text(formatCurrency(inv.initialAmount), margin + 85, currentY + 4);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(inv.currentValue), margin + 120, currentY + 4);
            doc.setTextColor(yld >= 0 ? 16 : 239, yld >= 0 ? 185 : 68, yld >= 0 ? 129 : 68);
            doc.text(`${yld >= 0 ? '+' : ''}${formatCurrency(yld)}`, margin + 155, currentY + 4);

            doc.setDrawColor(241, 245, 249);
            doc.line(margin, currentY + 5.5, margin + contentWidth, currentY + 5.5);
            currentY += 5.5;
          });
        }

        // 7. QUADRO 6: TABELA MÊS A MÊS DO ANO
        currentY += 3;
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(isPT ? `QUADRO 6: DEMONSTRATIVO MÊS A MÊS DO ANO (${selectedYear})` : `SECTION 6: MONTH-BY-MONTH BREAKDOWN (${selectedYear})`, margin + 4, currentY + 4);

        currentY += 5.5;
        // Mini grid for 12 months in 2 rows of 6 or compact list
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(margin, currentY, contentWidth, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text(isPT ? "MÊS" : "MONTH", margin + 4, currentY + 3.5);
        doc.text(isPT ? "RECEITAS" : "INCOME", margin + 45, currentY + 3.5);
        doc.text(isPT ? "DESPESAS" : "EXPENSES", margin + 85, currentY + 3.5);
        doc.text(isPT ? "APORTES" : "INVESTED", margin + 125, currentY + 3.5);
        doc.text(isPT ? "SALDO ACUM." : "BALANCE", margin + 155, currentY + 3.5);

        currentY += 5;
        reportData.monthlyList.forEach((m) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(m.name, margin + 4, currentY + 3.5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(16, 185, 129);
          doc.text(formatCurrency(m.income), margin + 45, currentY + 3.5);

          doc.setTextColor(239, 68, 68);
          doc.text(formatCurrency(m.expense), margin + 85, currentY + 3.5);

          doc.setTextColor(99, 102, 241);
          doc.text(formatCurrency(m.contributions), margin + 125, currentY + 3.5);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(m.balance >= 0 ? 59 : 239, m.balance >= 0 ? 130 : 68, m.balance >= 0 ? 246 : 68);
          doc.text(formatCurrency(m.balance), margin + 155, currentY + 3.5);

          doc.setDrawColor(245, 245, 245);
          doc.line(margin, currentY + 4.5, margin + contentWidth, currentY + 4.5);
          currentY += 4.5;
        });

        // 8. RODAPÉ DE AUTENTICAÇÃO E AUDITORIA
        currentY = Math.max(currentY + 4, 262);
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 18, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, currentY, contentWidth, 18, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(isPT ? "AUTENTICAÇÃO DIGITAL E VALIDADE JURÍDICO-FISCAL:" : "DIGITAL AUTHENTICATION & AUDIT VALIDITY:", margin + 4, currentY + 5);

        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text(authCode, margin + 4, currentY + 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text(
          isPT 
            ? "Documento gerado eletronicamente pela plataforma Money Dashs (GTS Global Tech Software). Validade de conferência para IRPF e gestão contábil."
            : "Document electronically generated by Money Dashs platform (GTS Global Tech Software). Audit trail for tax statement and financial records.",
          margin + 4,
          currentY + 15
        );

        const safeName = userName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const outputFilename = `informe_rendimentos_${selectedYear}_${safeName}.pdf`;
        return { doc, outputFilename };
  };

  const handleShareWhatsApp = async () => {
    setIsSharingWhatsApp(true);
    setShareNotice(null);
    try {
      const { doc, outputFilename } = buildAnnualReportPdfDoc();
      const result = await sharePdfToWhatsApp({
        doc,
        fileName: outputFilename,
        shareTitle: isPT ? `Informe de Rendimentos ${selectedYear} (PDF)` : `Annual Tax Report ${selectedYear} (PDF)`,
        summaryText: generateReportText(),
        onSuccess: (mode) => {
          if (mode === 'download-and-whatsapp') {
            setShareNotice(isPT 
              ? '📄 Informe em PDF baixado automaticamente! O WhatsApp foi aberto para você enviar a mensagem e anexar o documento PDF.'
              : '📄 PDF Report downloaded! WhatsApp opened so you can send and attach the PDF.'
            );
          } else {
            setShareNotice(isPT ? '✅ Informe em PDF compartilhado com sucesso!' : '✅ PDF Report shared successfully!');
          }
          setTimeout(() => setShareNotice(null), 7000);
        }
      });

      if (result === 'download-and-whatsapp') {
        setShareNotice(isPT 
          ? '📄 Informe em PDF baixado no seu dispositivo! O WhatsApp foi aberto para você enviar e anexar o documento PDF.'
          : '📄 PDF downloaded! WhatsApp opened so you can send and attach the PDF.'
        );
        setTimeout(() => setShareNotice(null), 7000);
      }
    } catch (err) {
      console.error('Error sharing report to WhatsApp:', err);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  const handleNativeShare = async () => {
    setIsGeneratingPdf(true);
    try {
      const { doc, outputFilename } = buildAnnualReportPdfDoc();
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], outputFilename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: isPT ? `Informe de Rendimentos ${selectedYear}` : `Annual Tax Report ${selectedYear}`,
          text: generateReportText(),
        });
      } else if (navigator.share) {
        await navigator.share({
          title: isPT ? `Informe de Rendimentos ${selectedYear}` : `Annual Tax Report ${selectedYear}`,
          text: generateReportText(),
        });
      } else {
        await handleShareWhatsApp();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        const { doc, outputFilename } = buildAnnualReportPdfDoc();
        doc.save(outputFilename);
      } catch (err) {
        console.error("Error generating Annual Report PDF:", err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-50 via-indigo-50/30 to-blue-50/20 dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {isPT ? 'Informe de Rendimentos do Ano' : 'Annual Tax & Income Statement'}
                </h3>
                <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  IRPF {exerciseYear}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPT ? 'Demonstrativo fiscal, rendimentos recebidos, despesas e patrimônio' : 'Annual tax statement, income breakdown, deductions and assets'}
              </p>
            </div>
          </div>

          {/* CONTROLS (YEAR & CURRENCY SELECTOR) */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700/80 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <label htmlFor="annual-year-select" className="text-[11px] font-bold text-gray-400 uppercase mr-1">
                {isPT ? 'Ano:' : 'Year:'}
              </label>
              <select
                id="annual-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent font-black text-sm text-gray-800 dark:text-white focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y} className="text-gray-900 dark:text-gray-100 dark:bg-gray-800">
                    {y} (Exercício {Number(y) + 1})
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Pill */}
            <div className="flex bg-white dark:bg-gray-700/80 p-1 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <button
                type="button"
                onClick={() => onCurrencyChange('BRL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedCurrency === 'BRL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                BRL
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange('USD')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedCurrency === 'USD'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                USD
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* NOTIFICATION / STATUS BANNER */}
          {shareNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3 animate-fade-in shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium flex-1">
                {shareNotice}
              </div>
              <button 
                type="button" 
                onClick={() => setShareNotice(null)} 
                className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 p-0.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* IDENTIFICATION BANNER */}
          <div className="bg-slate-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  {isPT ? 'Contribuinte / Titular' : 'Taxpayer / Holder'}
                </span>
                <span className="text-sm font-black text-gray-900 dark:text-white block">
                  {userName}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">{userEmail}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-2 md:pt-0 border-gray-200 dark:border-gray-700">
              <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">{isPT ? 'Ano-Calendário' : 'Tax Year'}</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs">{selectedYear}</span>
              </div>
              <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">{isPT ? 'Exercício IRPF' : 'Declaration'}</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{exerciseYear}</span>
              </div>
              <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">{isPT ? 'Lançamentos' : 'Transactions'}</span>
                <span className="font-black text-gray-700 dark:text-gray-300 text-xs">{reportData.transactionCount}</span>
              </div>
            </div>
          </div>

          {/* 4 SUMMARY STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Income */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {isPT ? 'Rendimentos Totais' : 'Total Gross Income'}
                </span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(reportData.totalIncome)}
              </p>
              <p className="text-[10px] text-emerald-600/70 mt-0.5">
                {isPT ? 'Entradas brutas no ano' : 'All revenues in the year'}
              </p>
            </div>

            {/* Total Expenses */}
            <div className="bg-rose-50/70 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200/60 dark:border-rose-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  {isPT ? 'Custo de Vida Real' : 'Total Real Expenses'}
                </span>
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(reportData.totalRealExpense)}
              </p>
              <p className="text-[10px] text-rose-600/70 mt-0.5">
                {isPT ? 'Despesas pagas no ano' : 'Total living expenses'}
              </p>
            </div>

            {/* Total Contributions */}
            <div className="bg-indigo-50/70 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  {isPT ? 'Total em Aportes' : 'Contributions / Invested'}
                </span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(reportData.totalContributions)}
              </p>
              <p className="text-[10px] text-indigo-600/70 mt-0.5">
                {isPT ? 'Alocados em investimentos' : 'Total invested'}
              </p>
            </div>

            {/* Net Balance / Result */}
            <div className="bg-blue-50/70 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  {isPT ? 'Resultado Líquido' : 'Net Annual Savings'}
                </span>
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(reportData.netAnnualSavings)}
              </p>
              <p className="text-[10px] text-blue-600/70 mt-0.5">
                {isPT ? 'Receitas - Despesas - Aportes' : 'Net cash generated'}
              </p>
            </div>
          </div>

          {/* TWO COLUMNS: INCOME DISCRIMINATION VS EXPENSE DISCRIMINATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Income Breakdown */}
            <div className="bg-white dark:bg-gray-800/90 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {isPT ? 'Rendimentos Recebidos no Ano' : 'Annual Income Breakdown'}
                </h4>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(reportData.totalIncome)}
                </span>
              </div>

              {reportData.sortedIncomeCategories.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  {isPT ? 'Nenhum rendimento registrado para este ano.' : 'No income recorded for this year.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {reportData.sortedIncomeCategories.map((item, idx) => {
                    const percentage = reportData.totalIncome > 0 
                      ? ((item.total / reportData.totalIncome) * 100).toFixed(1) 
                      : '0';
                    return (
                      <div key={idx} className="flex flex-col gap-1 p-2 rounded-xl bg-gray-50/60 dark:bg-gray-900/40 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 dark:text-white truncate max-w-[180px]">
                            {item.category}
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>{item.count} {isPT ? 'lançamento(s)' : 'entries'}</span>
                          <span>{percentage}% do total</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white dark:bg-gray-800/90 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  {isPT ? 'Custo de Vida e Despesas no Ano' : 'Annual Expenses & Deductions'}
                </h4>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(reportData.totalRealExpense)}
                </span>
              </div>

              {reportData.sortedExpenseCategories.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  {isPT ? 'Nenhuma despesa registrada para este ano.' : 'No expenses recorded for this year.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {reportData.sortedExpenseCategories.slice(0, 6).map((item, idx) => {
                    const percentage = reportData.totalRealExpense > 0 
                      ? ((item.total / reportData.totalRealExpense) * 100).toFixed(1) 
                      : '0';
                    return (
                      <div key={idx} className="flex flex-col gap-1 p-2 rounded-xl bg-gray-50/60 dark:bg-gray-900/40 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 dark:text-white truncate max-w-[180px]">
                            {item.category}
                          </span>
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>{item.count} {isPT ? 'lançamento(s)' : 'entries'}</span>
                          <span>{percentage}% do custo</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ASSETS & INVESTMENTS SECTION (31/12) */}
          <div className="bg-white dark:bg-gray-800/90 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 gap-2 mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {isPT ? `Bens, Direitos e Posição em Ativos (31/12/${selectedYear})` : `Investments & Asset Position (Dec 31, ${selectedYear})`}
              </h4>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-400">{isPT ? 'Patrimônio Total:' : 'Total Assets:'}</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(reportData.totalInvestedCurrent)}
                </span>
              </div>
            </div>

            {reportData.userInvestments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {isPT ? 'Nenhum ativo de investimento registrado na carteira desta moeda.' : 'No investment assets registered in this currency.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100 dark:border-gray-700 text-[10px] uppercase font-bold">
                      <th className="pb-2">{isPT ? 'Ativo / Aplicação' : 'Asset / Holding'}</th>
                      <th className="pb-2 text-right">{isPT ? 'Valor Aplicado' : 'Initial Amount'}</th>
                      <th className="pb-2 text-right">{isPT ? 'Posição Atual (31/12)' : 'Current Value'}</th>
                      <th className="pb-2 text-right">{isPT ? 'Rendimento Apurado' : 'Net Yield'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 font-medium">
                    {reportData.userInvestments.map(inv => {
                      const yieldVal = (Number(inv.currentValue) || 0) - (Number(inv.initialAmount) || 0);
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-2.5 font-bold text-gray-900 dark:text-white">{inv.name}</td>
                          <td className="py-2.5 text-right text-gray-600 dark:text-gray-300">{formatCurrency(inv.initialAmount)}</td>
                          <td className="py-2.5 text-right font-black text-gray-900 dark:text-white">{formatCurrency(inv.currentValue)}</td>
                          <td className={`py-2.5 text-right font-bold ${yieldVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                            {yieldVal >= 0 ? '+' : ''}{formatCurrency(yieldVal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* MONTH-BY-MONTH GRID SUMMARY */}
          <div className="bg-white dark:bg-gray-800/90 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 pb-3 border-b border-gray-100 dark:border-gray-700 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              {isPT ? `Demonstrativo Mês a Mês do Ano (${selectedYear})` : `Month-by-Month Annual Breakdown (${selectedYear})`}
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100 dark:border-gray-700 text-[10px] uppercase font-bold">
                    <th className="pb-2">{isPT ? 'Mês' : 'Month'}</th>
                    <th className="pb-2 text-right">{isPT ? 'Receitas' : 'Income'}</th>
                    <th className="pb-2 text-right">{isPT ? 'Despesas' : 'Expenses'}</th>
                    <th className="pb-2 text-right">{isPT ? 'Aportes' : 'Invested'}</th>
                    <th className="pb-2 text-right">{isPT ? 'Saldo Acumulado' : 'Balance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 font-medium">
                  {reportData.monthlyList.map(m => (
                    <tr key={m.index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-2 font-bold text-gray-800 dark:text-gray-200">{m.name}</td>
                      <td className="py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(m.income)}</td>
                      <td className="py-2 text-right font-bold text-rose-600 dark:text-rose-400">{formatCurrency(m.expense)}</td>
                      <td className="py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(m.contributions)}</td>
                      <td className={`py-2 text-right font-black ${m.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
                        {formatCurrency(m.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AUDIT SEAL BOX */}
          <div className="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-gray-800 dark:text-white block text-[11px]">
                  {isPT ? 'Chave de Autenticação Digital' : 'Digital Audit Seal'}
                </span>
                <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">{authCode}</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400">
              {isPT ? 'GTS Global Tech Software • Auditoria Contábil' : 'GTS Global Tech Software • Audit Trail'}
            </span>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-between items-center">
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* WHATSAPP PDF SHARE */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharingWhatsApp || isGeneratingPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {isSharingWhatsApp ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{isPT ? 'Enviando PDF...' : 'Sending PDF...'}</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>WhatsApp (PDF)</span>
                </>
              )}
            </button>

            {/* NATIVE SHARE (PDF FILE) */}
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isGeneratingPdf || isSharingWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
              title={isPT ? 'Compartilhar arquivo PDF' : 'Share PDF file'}
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isPT ? 'Compartilhar' : 'Share'}</span>
            </button>

            {/* COPY TEXT */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">{isPT ? 'Copiado!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isPT ? 'Copiar Texto' : 'Copy Text'}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              {isPT ? 'Fechar' : 'Close'}
            </button>

            {/* DOWNLOAD PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf || isSharingWhatsApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{isPT ? 'Gerando PDF...' : 'Generating...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isPT ? 'Baixar Informe (PDF)' : 'Download PDF Report'}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AnnualIncomeReportModal;
