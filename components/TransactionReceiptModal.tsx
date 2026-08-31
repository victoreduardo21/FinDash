import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { PersonalTransaction, TransactionType, Language, User } from '../types';
import { sharePdfToWhatsApp } from '../utils/pdfShare';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Calendar, 
  Tag, 
  Wallet, 
  FileText,
  User as UserIcon,
  MessageCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PersonalTransaction | null;
  language?: Language;
  currentUser?: User | null;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  language = 'pt-BR',
  currentUser
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const isPT = language === 'pt-BR';
  const isIncome = transaction.type === TransactionType.Receita;
  const isInvestment = (transaction.category || '').toLowerCase().includes('invest') || 
                       (transaction.category || '').toLowerCase().includes('aporte');
  
  const currencySymbol = transaction.currency === 'USD' ? '$' : 'R$';
  const formattedAmount = (Number(transaction.amount) || 0).toLocaleString(
    isPT ? 'pt-BR' : 'en-US', 
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  // Format date nicely
  let formattedDate = transaction.date || '';
  if (formattedDate.includes('T')) formattedDate = formattedDate.split('T')[0];
  const dateParts = formattedDate.split('-');
  const displayDate = dateParts.length === 3
    ? (isPT ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`)
    : formattedDate;

  // Stable auth code based on ID or timestamp
  const rawId = (transaction.id || 'TX000000').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const authCode = `GTS-TX-${rawId.slice(0, 8) || '000000'}-${(dateParts[0] || '2026')}`;

  const userName = currentUser?.name || (isPT ? 'Usuário Registrado' : 'Registered User');

  // Text representation for WhatsApp and Clipboard
  const generateReceiptText = () => {
    const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━';
    if (isPT) {
      return `📄 *COMPROVANTE DE LANÇAMENTO OFICIAL (PDF)*\n*Money Dashs | GTS Global Tech Software*\n${divider}\n💰 *Valor:* ${isIncome ? '+' : '-'}${currencySymbol} ${formattedAmount}\n📝 *Descrição:* ${transaction.description}\n🏷️ *Categoria:* ${transaction.category}\n📊 *Tipo:* ${isIncome ? 'Receita (Entrada)' : 'Despesa (Saída)'}\n📅 *Data:* ${displayDate}\n💳 *Moeda/Carteira:* ${transaction.currency || 'BRL'}\n👤 *Titular:* ${userName}\n🔒 *Autenticação:* ${authCode}\n${divider}\n📎 _Comprovante oficial em formato PDF gerado eletronicamente em ${new Date().toLocaleDateString('pt-BR')}._`;
    } else {
      return `📄 *OFFICIAL TRANSACTION RECEIPT (PDF)*\n*Money Dashs | GTS Global Tech Software*\n${divider}\n💰 *Amount:* ${isIncome ? '+' : '-'}${currencySymbol} ${formattedAmount}\n📝 *Description:* ${transaction.description}\n🏷️ *Category:* ${transaction.category}\n📊 *Type:* ${isIncome ? 'Income' : 'Expense'}\n📅 *Date:* ${displayDate}\n💳 *Currency/Wallet:* ${transaction.currency || 'USD'}\n👤 *Holder:* ${userName}\n🔒 *Auth Code:* ${authCode}\n${divider}\n📎 _Official PDF statement generated on ${new Date().toLocaleDateString('en-US')}._`;
    }
  };

  const buildReceiptPdfDoc = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5' // A5 is standard for receipts/vouchers
    });

    const colorPrimary = [15, 23, 42]; // Slate 900
    const colorTextSec = [100, 116, 139]; // Slate 500

    // 1. Banner Header
    doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.rect(8, 8, 132, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("GTS Global Tech Software | Money Dashs", 13, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(isPT ? 'COMPROVANTE OFICIAL DE LANÇAMENTO' : 'OFFICIAL TRANSACTION RECEIPT', 13, 22);

    doc.setFontSize(7);
    doc.text(new Date().toLocaleDateString(isPT ? 'pt-BR' : 'en-US'), 118, 17);

    // 2. Receipt Box Container
    doc.setFillColor(248, 250, 252);
    doc.rect(8, 30, 132, 120, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(8, 30, 132, 120, 'S');

    // Status badge
    doc.setFillColor(isIncome ? 220 : 254, isIncome ? 252 : 226, isIncome ? 231 : 226);
    doc.rect(13, 35, 122, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(isIncome ? 5 : 185, isIncome ? 150 : 28, isIncome ? 105 : 28);
    const statusText = isIncome 
      ? (isPT ? 'LANCAMENTO EFETIVADO (RECEITA)' : 'COMPLETED TRANSACTION (INCOME)')
      : (isPT ? 'LANCAMENTO EFETIVADO (DESPESA)' : 'COMPLETED TRANSACTION (EXPENSE)');
    doc.text(statusText, 74, 41.5, { align: 'center' });

    // Amount Display
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(isIncome ? 16 : 220, isIncome ? 185 : 38, isIncome ? 129 : 38);
    const sign = isIncome ? '+ ' : '- ';
    doc.text(`${sign}${currencySymbol} ${formattedAmount}`, 74, 55, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colorTextSec[0], colorTextSec[1], colorTextSec[2]);
    doc.text(transaction.currency === 'USD' ? 'Carteira Dolar (USD)' : 'Carteira Real (BRL)', 74, 60, { align: 'center' });

    // Divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(13, 65, 135, 65);
    doc.setLineDashPattern([], 0);

    // Details grid
    let yPos = 73;
    const addField = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(colorTextSec[0], colorTextSec[1], colorTextSec[2]);
      doc.text(label.toUpperCase(), 14, yPos);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const safeVal = value.length > 32 ? value.substring(0, 30) + '...' : value;
      doc.text(safeVal, 60, yPos);

      doc.setDrawColor(241, 245, 249);
      doc.line(14, yPos + 2, 134, yPos + 2);
      yPos += 7.5;
    };

    addField(isPT ? 'Descricao' : 'Description', transaction.description);
    addField(isPT ? 'Categoria' : 'Category', transaction.category);
    addField(isPT ? 'Data do Evento' : 'Event Date', displayDate);
    addField(isPT ? 'Titular' : 'Account Holder', userName);
    addField(isPT ? 'Moeda' : 'Currency', transaction.currency || 'BRL');
    addField(isPT ? 'Autenticacao' : 'Auth Code', authCode);

    // Security seal box
    yPos += 3;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, yPos, 120, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(isPT ? "AUTENTICACAO DIGITAL CRIPTOGRAFADA" : "ENCRYPTED DIGITAL AUTHENTICATION", 17, yPos + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(isPT ? "Registrado no sistema GTS Global Tech Software com validade de conferencia." : "Registered in GTS Global Tech Software with full audit validity.", 17, yPos + 8.5);

    // Signatures
    yPos += 20;
    doc.setDrawColor(203, 213, 225);
    doc.line(18, yPos, 65, yPos);
    doc.line(82, yPos, 130, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(isPT ? 'Assinatura do Titular' : 'Holder Signature', 41.5, yPos + 4, { align: 'center' });
    doc.text('GTS Global Tech Software', 106, yPos + 4, { align: 'center' });

    const cleanDesc = (transaction.description || 'transacao').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const outputFilename = `comprovante_${cleanDesc}_${formattedDate}.pdf`;

    return { doc, outputFilename };
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateReceiptText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Error copying to clipboard:', e);
    }
  };

  const handleShareWhatsApp = async () => {
    setIsSharingWhatsApp(true);
    setShareNotice(null);
    try {
      const { doc, outputFilename } = buildReceiptPdfDoc();
      const result = await sharePdfToWhatsApp({
        doc,
        fileName: outputFilename,
        shareTitle: isPT ? 'Comprovante Oficial de Lançamento (PDF)' : 'Official Transaction Receipt (PDF)',
        summaryText: generateReceiptText(),
        onSuccess: (mode) => {
          if (mode === 'download-and-whatsapp') {
            setShareNotice(isPT 
              ? '📄 PDF baixado com sucesso! O WhatsApp foi aberto para você enviar e anexar o comprovante.'
              : '📄 PDF downloaded! WhatsApp opened so you can send and attach the receipt.'
            );
          } else {
            setShareNotice(isPT ? '✅ Comprovante em PDF compartilhado!' : '✅ PDF receipt shared!');
          }
          setTimeout(() => setShareNotice(null), 6000);
        }
      });

      if (result === 'download-and-whatsapp') {
        setShareNotice(isPT 
          ? '📄 PDF baixado no seu dispositivo! O WhatsApp foi aberto para você enviar a mensagem e anexar o arquivo.'
          : '📄 PDF downloaded! WhatsApp opened so you can send and attach the file.'
        );
        setTimeout(() => setShareNotice(null), 6000);
      }
    } catch (err) {
      console.error('Error sharing receipt to WhatsApp:', err);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  const handleNativeShare = async () => {
    setIsGeneratingPdf(true);
    try {
      const { doc, outputFilename } = buildReceiptPdfDoc();
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], outputFilename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: isPT ? 'Comprovante Oficial de Lançamento' : 'Official Transaction Receipt',
          text: generateReceiptText(),
        });
      } else if (navigator.share) {
        await navigator.share({
          title: isPT ? 'Comprovante Oficial de Lançamento' : 'Official Transaction Receipt',
          text: generateReceiptText(),
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
        const { doc, outputFilename } = buildReceiptPdfDoc();
        doc.save(outputFilename);
      } catch (err) {
        console.error("Error generating receipt PDF:", err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/65 z-50 flex justify-center items-center backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL TOP HEADER */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/70 dark:bg-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                {isPT ? 'Comprovante de Lançamento' : 'Transaction Receipt'}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {isPT ? 'Extrato individual detalhado' : 'Detailed individual extract'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL BODY / RECEIPT CARD */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* VOUCHER TICKET BOX */}
          <div className="bg-gradient-to-b from-gray-50/90 to-slate-50/50 dark:from-gray-900/60 dark:to-gray-900/30 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700 relative overflow-hidden shadow-inner">
            
            {/* Stamp / Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                GTS GLOBAL TECH
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isPT ? 'Efetivado' : 'Completed'}
              </div>
            </div>

            {/* Main Amount */}
            <div className="text-center py-3 border-y border-dashed border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                {isPT ? 'Valor do Lançamento' : 'Transaction Amount'}
              </span>
              <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${
                isIncome 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : isInvestment 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-rose-600 dark:text-rose-400'
              }`}>
                {isIncome ? '+ ' : '- '}
                {currencySymbol} {formattedAmount}
              </h2>
              <span className="inline-block mt-1 text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700">
                {transaction.currency === 'USD' ? 'Carteira Dólar (USD)' : 'Carteira Real (BRL)'}
              </span>
            </div>

            {/* Structured Details */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {isPT ? 'Descrição' : 'Description'}
                </span>
                <span className="font-extrabold text-gray-800 dark:text-white max-w-[200px] truncate text-right">
                  {transaction.description}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  {isPT ? 'Categoria' : 'Category'}
                </span>
                <span className="font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 text-[11px]">
                  {transaction.category}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {isPT ? 'Data' : 'Date'}
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {displayDate}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  {isPT ? 'Titular' : 'Account Holder'}
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200 max-w-[180px] truncate">
                  {userName}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  {isPT ? 'Autenticação' : 'Auth Code'}
                </span>
                <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                  {authCode}
                </span>
              </div>
            </div>

          </div>

          {/* Notice Banner when sharing/downloading */}
          {shareNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-2 text-emerald-800 dark:text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{shareNotice}</span>
            </div>
          )}

          {/* Quick Share Buttons Strip */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            
            {/* WHATSAPP SHARE WITH PDF */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharingWhatsApp}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold text-xs transition-all shadow-sm active:scale-[0.98]"
              title={isPT ? 'Enviar comprovante oficial em PDF para o WhatsApp' : 'Send official PDF receipt to WhatsApp'}
            >
              {isSharingWhatsApp ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{isPT ? 'Preparando...' : 'Preparing...'}</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp (PDF)</span>
                </>
              )}
            </button>

            {/* COPY TEXT */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold text-xs transition-all active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">{isPT ? 'Copiado!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-500" />
                  {isPT ? 'Copiar Texto' : 'Copy Text'}
                </>
              )}
            </button>

          </div>

        </div>

        {/* MODAL FOOTER / PDF EXPORT & CLOSE */}
        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-2 justify-between items-center">
          
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            {isPT ? 'Mais Opções' : 'Share Options'}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {isPT ? 'Fechar' : 'Close'}
            </button>

            {/* DOWNLOAD PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {isPT ? 'Gerando...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {isPT ? 'Baixar PDF' : 'Download PDF'}
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TransactionReceiptModal;
