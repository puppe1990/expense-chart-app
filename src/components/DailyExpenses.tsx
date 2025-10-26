import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, DollarSign, RefreshCw, Download, FileSpreadsheet, FileText, Edit, Copy, CheckSquare, Square, Trash2 } from 'lucide-react';
import { Expense, Category } from './ExpenseForm';
import { useForceUpdate } from '@/hooks/use-force-update';
import { formatDateToISO, formatDateStringForDisplay, parseDateString } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EditTransactionDialog } from './EditTransactionDialog';
import { toast } from 'sonner';

interface DailyExpensesProps {
  expenses: Expense[];
  categories: Category[];
  onUpdateExpense?: (id: string, updatedExpense: Omit<Expense, "id">) => void;
  onBulkDuplicate?: (expenses: Expense[], targetDate?: string) => void;
  onDeleteExpense?: (id: string) => void;
}

interface DailyExpenseData {
  date: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactions: Expense[];
}

export const DailyExpenses = ({ expenses, categories, onUpdateExpense, onBulkDuplicate, onDeleteExpense }: DailyExpensesProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [targetDuplicateDate, setTargetDuplicateDate] = useState<string>(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const [pendingDuplicateExpenses, setPendingDuplicateExpenses] = useState<Expense[]>([]);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const forceUpdate = useForceUpdate();

  // Forçar atualização quando as despesas mudarem
  useEffect(() => {
    forceUpdate();
  }, [expenses, forceUpdate]);

  // Função para formatar data
  const formatDate = (date: Date) => {
    return formatDateToISO(date);
  };

  // Função para formatar data para exibição
  const formatDisplayDate = (dateString: string) => {
    return formatDateStringForDisplay(dateString);
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Agrupar despesas por dia
  const dailyExpenses = useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      const date = expense.date;
      
      if (!acc[date]) {
        acc[date] = {
          date,
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0,
          transactions: []
        };
      }
      
      acc[date].transactions.push(expense);
      
      if (expense.type === 'income' || expense.type === 'investment_profit') {
        acc[date].totalIncome += expense.amount;
      } else {
        acc[date].totalExpense += expense.amount;
      }
      
      acc[date].netAmount = acc[date].totalIncome - acc[date].totalExpense;
      
      return acc;
    }, {} as Record<string, DailyExpenseData>);

    return Object.values(grouped).sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime());
  }, [expenses]);

  // Filtrar despesas do mês atual e criar dias vazios
  const currentMonthExpenses = useMemo(() => {
    const currentMonth = currentDate.getMonth() + 1; // +1 porque getMonth() retorna 0-11
    const currentYear = currentDate.getFullYear();
    
    // Criar string de referência do mês (YYYY-MM)
    const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Filtrar despesas do mês atual usando comparação de string
    const monthExpenses = dailyExpenses.filter(day => {
      return day.date.startsWith(monthString);
    });

    // Criar um mapa de despesas por data para facilitar a busca
    const expensesByDate = monthExpenses.reduce((acc, day) => {
      acc[day.date] = day;
      return acc;
    }, {} as Record<string, DailyExpenseData>);

    // Gerar todos os dias do mês
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const allDays: DailyExpenseData[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      if (expensesByDate[dateString]) {
        allDays.push(expensesByDate[dateString]);
      } else {
        // Criar um dia vazio
        allDays.push({
          date: dateString,
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0,
          transactions: []
        });
      }
    }

    // Ordenar por data (mais recente primeiro)
    return allDays.sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime());
  }, [dailyExpenses, currentDate]);

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Handlers para edição
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedExpense: Omit<Expense, "id">) => {
    if (editingExpense && onUpdateExpense) {
      onUpdateExpense(editingExpense.id, updatedExpense);
    }
    setIsEditDialogOpen(false);
    setEditingExpense(null);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
  };

  // Bulk operation handlers
  const handleToggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedTransactionIds(new Set());
  };

  const handleToggleTransaction = (expenseId: string) => {
    setSelectedTransactionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allTransactionIds = new Set(expenses.map(exp => exp.id));
    setSelectedTransactionIds(prev => {
      // If all are selected, deselect all. Otherwise select all.
      if (prev.size === expenses.length) {
        return new Set();
      } else {
        return allTransactionIds;
      }
    });
  };

  const handleBulkDuplicate = () => {
    if (selectedTransactionIds.size === 0) {
      toast.error('Selecione pelo menos uma transação para duplicar');
      return;
    }

    if (onBulkDuplicate) {
      const expensesToDuplicate = expenses.filter(exp => selectedTransactionIds.has(exp.id));
      setPendingDuplicateExpenses(expensesToDuplicate);
      setTargetDuplicateDate(() => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      });
      setIsDuplicateDialogOpen(true);
    }
  };

  const handleConfirmDuplicate = () => {
    if (onBulkDuplicate && pendingDuplicateExpenses.length > 0) {
      onBulkDuplicate(pendingDuplicateExpenses, targetDuplicateDate);
      toast.success(`${pendingDuplicateExpenses.length} transação(ões) duplicada(s) com sucesso!`);
      setSelectedTransactionIds(new Set());
      setBulkMode(false);
      setIsDuplicateDialogOpen(false);
      setPendingDuplicateExpenses([]);
    }
  };

  const handleCancelDuplicate = () => {
    setIsDuplicateDialogOpen(false);
    setPendingDuplicateExpenses([]);
  };

  // Delete handlers
  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteExpense = () => {
    if (expenseToDelete && onDeleteExpense) {
      onDeleteExpense(expenseToDelete.id);
      toast.success('Transação excluída com sucesso!');
      setExpenseToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const cancelDeleteExpense = () => {
    setExpenseToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // Calcular totais do mês
  const monthTotals = useMemo(() => {
    return currentMonthExpenses.reduce(
      (totals, day) => ({
        totalIncome: totals.totalIncome + day.totalIncome,
        totalExpense: totals.totalExpense + day.totalExpense,
        netAmount: totals.netAmount + day.netAmount,
      }),
      { totalIncome: 0, totalExpense: 0, netAmount: 0 }
    );
  }, [currentMonthExpenses]);

  // Obter categoria por ID
  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  // Função para exportar dados para CSV
  const exportToCSV = () => {
    const csvData = currentMonthExpenses
      .filter(day => day.transactions.length > 0) // Apenas dias com transações
      .map(day => {
        const dayData = [
          // Cabeçalho para o dia
          {
            'Data': formatDisplayDate(day.date),
            'Tipo': 'RESUMO DO DIA',
            'Descrição': `Total do dia: ${day.transactions.length} transação${day.transactions.length !== 1 ? 'ões' : ''}`,
            'Valor': '',
            'Categoria': '',
            'Método de Pagamento': '',
            'Entradas': day.totalIncome > 0 ? day.totalIncome.toFixed(2).replace('.', ',') : '',
            'Saídas': day.totalExpense > 0 ? day.totalExpense.toFixed(2).replace('.', ',') : '',
            'Saldo': day.netAmount.toFixed(2).replace('.', ','),
            'Observações': ''
          }
        ];

        // Adicionar cada transação do dia
        const transactionsData = day.transactions.map(transaction => {
          const category = getCategoryById(transaction.category);
          return {
            'Data': formatDisplayDate(day.date),
            'Tipo': transaction.type === 'income' ? 'Entrada' :
                   transaction.type === 'expense' ? 'Despesa' :
                   transaction.type === 'transfer' ? 'Transferência' :
                   transaction.type === 'investment' ? 'Investimento' :
                   transaction.type === 'investment_profit' ? 'Lucro' :
                   transaction.type === 'loan' ? 'Empréstimo' : 'Outro',
            'Descrição': transaction.description,
            'Valor': transaction.amount.toFixed(2).replace('.', ','),
            'Categoria': category?.name || 'Não definida',
            'Método de Pagamento': transaction.paymentMethod || 'Não informado',
            'Entradas': transaction.type === 'income' || transaction.type === 'investment_profit' ? transaction.amount.toFixed(2).replace('.', ',') : '',
            'Saídas': transaction.type !== 'income' && transaction.type !== 'investment_profit' ? transaction.amount.toFixed(2).replace('.', ',') : '',
            'Saldo': '',
            'Observações': transaction.notes || ''
          };
        });

        return [...dayData, ...transactionsData];
      })
      .flat();

    // Criar conteúdo CSV
    const headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'Categoria', 'Método de Pagamento', 'Entradas', 'Saídas', 'Saldo', 'Observações'];
    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(';'))
    ].join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const monthName = currentDate.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
    link.setAttribute('download', `gastos-diarios-${monthName.replace(' ', '-').toLowerCase()}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para exportar dados para Excel
  const exportToExcel = () => {
    const excelData = currentMonthExpenses
      .filter(day => day.transactions.length > 0) // Apenas dias com transações
      .map(day => {
        const dayData = [
          // Cabeçalho para o dia
          {
            'Data': formatDisplayDate(day.date),
            'Tipo': 'RESUMO DO DIA',
            'Descrição': `Total do dia: ${day.transactions.length} transação${day.transactions.length !== 1 ? 'ões' : ''}`,
            'Valor': '',
            'Categoria': '',
            'Método de Pagamento': '',
            'Entradas': day.totalIncome > 0 ? day.totalIncome : '',
            'Saídas': day.totalExpense > 0 ? day.totalExpense : '',
            'Saldo': day.netAmount,
            'Observações': ''
          }
        ];

        // Adicionar cada transação do dia
        const transactionsData = day.transactions.map(transaction => {
          const category = getCategoryById(transaction.category);
          return {
            'Data': formatDisplayDate(day.date),
            'Tipo': transaction.type === 'income' ? 'Entrada' :
                   transaction.type === 'expense' ? 'Despesa' :
                   transaction.type === 'transfer' ? 'Transferência' :
                   transaction.type === 'investment' ? 'Investimento' :
                   transaction.type === 'investment_profit' ? 'Lucro' :
                   transaction.type === 'loan' ? 'Empréstimo' : 'Outro',
            'Descrição': transaction.description,
            'Valor': transaction.amount,
            'Categoria': category?.name || 'Não definida',
            'Método de Pagamento': transaction.paymentMethod || 'Não informado',
            'Entradas': transaction.type === 'income' || transaction.type === 'investment_profit' ? transaction.amount : '',
            'Saídas': transaction.type !== 'income' && transaction.type !== 'investment_profit' ? transaction.amount : '',
            'Saldo': '',
            'Observações': transaction.notes || ''
          };
        });

        return [...dayData, ...transactionsData];
      })
      .flat();

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Definir larguras das colunas
    const columnWidths = [
      { wch: 15 }, // Data
      { wch: 15 }, // Tipo
      { wch: 30 }, // Descrição
      { wch: 12 }, // Valor
      { wch: 20 }, // Categoria
      { wch: 20 }, // Método de Pagamento
      { wch: 12 }, // Entradas
      { wch: 12 }, // Saídas
      { wch: 12 }, // Saldo
      { wch: 30 }  // Observações
    ];
    worksheet['!cols'] = columnWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos Diários');

    // Gerar nome do arquivo
    const monthName = currentDate.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
    const fileName = `gastos-diarios-${monthName.replace(' ', '-').toLowerCase()}.xlsx`;

    // Baixar arquivo
    XLSX.writeFile(workbook, fileName);
  };

  // Função para exportar dados para PDF
  const exportToPDF = () => {
    try {
      // Verificar se há dados para exportar
      const hasData = currentMonthExpenses.some(day => day.transactions.length > 0);
      if (!hasData) {
        alert('Não há dados para exportar neste mês.');
        return;
      }

      console.log('Iniciando geração de PDF...');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    // Configurar fonte
    pdf.setFont('helvetica');
    
    // Título do relatório
    const monthName = currentDate.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    pdf.setFontSize(16);
    pdf.text('Relatório de Gastos Diários', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Período: ${monthName}`, 20, 30);
    
    // Resumo do mês
    pdf.setFontSize(10);
    pdf.text('Resumo do Mês:', 20, 45);
    pdf.text(`Entradas: R$ ${monthTotals.totalIncome.toFixed(2).replace('.', ',')}`, 20, 52);
    pdf.text(`Saídas: R$ ${monthTotals.totalExpense.toFixed(2).replace('.', ',')}`, 20, 59);
    pdf.text(`Saldo: R$ ${monthTotals.netAmount.toFixed(2).replace('.', ',')}`, 20, 66);
    
    // Preparar dados para a tabela
    const tableData = currentMonthExpenses
      .filter(day => day.transactions.length > 0)
      .flatMap(day => {
        const daySummary = [
          [
            formatDisplayDate(day.date),
            'RESUMO DO DIA',
            `Total: ${day.transactions.length} transação${day.transactions.length !== 1 ? 'ões' : ''}`,
            '',
            '',
            day.totalIncome > 0 ? `R$ ${day.totalIncome.toFixed(2).replace('.', ',')}` : '',
            day.totalExpense > 0 ? `R$ ${day.totalExpense.toFixed(2).replace('.', ',')}` : '',
            `R$ ${day.netAmount.toFixed(2).replace('.', ',')}`,
            ''
          ]
        ];
        
        const transactionsData = day.transactions.map(transaction => {
          const category = getCategoryById(transaction.category);
          const typeLabel = transaction.type === 'income' ? 'Entrada' :
                           transaction.type === 'expense' ? 'Despesa' :
                           transaction.type === 'transfer' ? 'Transferência' :
                           transaction.type === 'investment' ? 'Investimento' :
                           transaction.type === 'investment_profit' ? 'Lucro' :
                           transaction.type === 'loan' ? 'Empréstimo' : 'Outro';
          
          return [
            formatDisplayDate(day.date),
            typeLabel,
            transaction.description || '',
            `R$ ${transaction.amount.toFixed(2).replace('.', ',')}`,
            category?.name || 'Não definida',
            transaction.type === 'income' || transaction.type === 'investment_profit' ? `R$ ${transaction.amount.toFixed(2).replace('.', ',')}` : '',
            transaction.type !== 'income' && transaction.type !== 'investment_profit' ? `R$ ${transaction.amount.toFixed(2).replace('.', ',')}` : '',
            '',
            transaction.notes || ''
          ];
        });
        
        return [...daySummary, ...transactionsData];
      });
    
    // Cabeçalhos da tabela
    const headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'Categoria', 'Entradas', 'Saídas', 'Saldo', 'Observações'];
    
    // Configurar a tabela
    const tableConfig = {
      head: [headers],
      body: tableData,
      startY: 80,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 35 },
      },
      margin: { left: 20, right: 20 },
    };
    
    // Adicionar a tabela ao PDF
    try {
      autoTable(pdf, tableConfig);
    } catch (tableError) {
      console.error('Erro ao criar tabela:', tableError);
      // Fallback: criar uma versão simplificada sem autoTable
      pdf.setFontSize(10);
      pdf.text('Dados das transações:', 20, 80);
      
      let yPosition = 90;
      currentMonthExpenses
        .filter(day => day.transactions.length > 0)
        .forEach(day => {
          pdf.setFontSize(12);
          pdf.text(`${formatDisplayDate(day.date)} - Total: R$ ${day.netAmount.toFixed(2).replace('.', ',')}`, 20, yPosition);
          yPosition += 10;
          
          pdf.setFontSize(9);
          day.transactions.forEach(transaction => {
            const category = getCategoryById(transaction.category);
            const typeLabel = transaction.type === 'income' ? 'Entrada' :
                             transaction.type === 'expense' ? 'Despesa' :
                             transaction.type === 'transfer' ? 'Transferência' :
                             transaction.type === 'investment' ? 'Investimento' :
                             transaction.type === 'investment_profit' ? 'Lucro' :
                             transaction.type === 'loan' ? 'Empréstimo' : 'Outro';
            
            pdf.text(`  • ${typeLabel}: ${transaction.description} - R$ ${transaction.amount.toFixed(2).replace('.', ',')} (${category?.name || 'Não definida'})`, 25, yPosition);
            yPosition += 7;
            
            if (yPosition > 250) {
              pdf.addPage();
              yPosition = 20;
            }
          });
          yPosition += 5;
        });
    }
    
    // Adicionar rodapé
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(
        `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
        20,
        pdf.internal.pageSize.height - 10
      );
    }
    
      // Salvar o PDF
      const fileName = `gastos-diarios-${monthName.replace(' ', '-').toLowerCase()}.pdf`;
      console.log('Salvando PDF:', fileName);
      pdf.save(fileName);
      console.log('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o arquivo PDF. Verifique o console para mais detalhes.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação do mês */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gastos Diários
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[200px] text-center">
                {currentDate.toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={forceUpdate}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {onBulkDuplicate && (
                <>
                  <Button
                    variant={bulkMode ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleBulkMode}
                    className="ml-2"
                    title={bulkMode ? "Sair do modo de seleção" : "Selecionar múltiplas transações"}
                  >
                    {bulkMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </Button>
                  {bulkMode && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="ml-2"
                        title="Selecionar todas"
                      >
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleBulkDuplicate}
                        className="ml-2"
                        disabled={selectedTransactionIds.size === 0}
                        title="Duplicar selecionadas"
                      >
                        <Copy className="h-4 w-4" />
                        {selectedTransactionIds.size > 0 && ` (${selectedTransactionIds.size})`}
                      </Button>
                    </>
                  )}
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    title="Exportar dados"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar para CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar para Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar para PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Resumo do mês */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Entradas</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(monthTotals.totalIncome)}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Saídas</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(monthTotals.totalExpense)}
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              monthTotals.netAmount >= 0 
                ? 'bg-blue-50 dark:bg-blue-950/20' 
                : 'bg-orange-50 dark:bg-orange-950/20'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className={`h-4 w-4 ${
                  monthTotals.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
                <span className={`text-sm font-medium ${
                  monthTotals.netAmount >= 0 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-orange-700 dark:text-orange-300'
                }`}>
                  Saldo
                </span>
              </div>
              <div className={`text-2xl font-bold ${
                monthTotals.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatCurrency(monthTotals.netAmount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de gastos diários */}
      <div className="space-y-4">
        {currentMonthExpenses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma transação encontrada para este mês</p>
            </CardContent>
          </Card>
        ) : (
          currentMonthExpenses.map((day) => {
            const hasTransactions = day.transactions.length > 0;
            
            return (
              <Card 
                key={day.date} 
                className={`transition-all duration-200 ${
                  hasTransactions 
                    ? `cursor-pointer hover:shadow-md ${selectedDate === day.date ? 'ring-2 ring-primary' : ''}` 
                    : 'opacity-60'
                }`}
                onClick={() => hasTransactions && setSelectedDate(selectedDate === day.date ? null : day.date)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-lg ${!hasTransactions ? 'text-gray-400' : ''}`}>
                        {formatDisplayDate(day.date)}
                      </CardTitle>
                      <p className={`text-sm ${!hasTransactions ? 'text-gray-400' : 'text-gray-500'}`}>
                        {hasTransactions 
                          ? `${day.transactions.length} transação${day.transactions.length !== 1 ? 'ões' : ''}`
                          : 'Nenhuma transação'
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        !hasTransactions 
                          ? 'text-gray-400' 
                          : day.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {hasTransactions ? formatCurrency(day.netAmount) : 'R$ 0,00'}
                      </div>
                      {hasTransactions && (
                        <div className="text-sm text-gray-500">
                          {formatCurrency(day.totalIncome)} - {formatCurrency(day.totalExpense)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {hasTransactions && selectedDate === day.date && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {day.transactions.map((transaction) => {
                        const category = getCategoryById(transaction.category);
                        const isSelected = selectedTransactionIds.has(transaction.id);
                        return (
                          <div 
                            key={transaction.id}
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                              isSelected 
                                ? 'bg-primary/10 dark:bg-primary/20 border-2 border-primary' 
                                : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {bulkMode && (
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleTransaction(transaction.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category?.color || '#64748b' }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{transaction.description}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  <span>{category?.icon} {category?.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {transaction.type === 'income' ? 'Entrada' :
                                     transaction.type === 'expense' ? 'Despesa' :
                                     transaction.type === 'transfer' ? 'Transferência' :
                                     transaction.type === 'investment' ? 'Investimento' :
                                     transaction.type === 'investment_profit' ? 'Lucro' :
                                     transaction.type === 'loan' ? 'Empréstimo' : 'Outro'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`font-semibold ${
                                transaction.type === 'income' || transaction.type === 'investment_profit'
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' || transaction.type === 'investment_profit' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </div>
                              <div className="flex items-center gap-1">
                                {onUpdateExpense && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditExpense(transaction);
                                    }}
                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                                    title="Editar transação"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {onBulkDuplicate && !bulkMode && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onBulkDuplicate) {
                                        setPendingDuplicateExpenses([transaction]);
                                        setTargetDuplicateDate(() => {
                                          const date = new Date();
                                          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                        });
                                        setIsDuplicateDialogOpen(true);
                                      }
                                    }}
                                    className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-300"
                                    title="Duplicar transação"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                )}
                                {onDeleteExpense && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteExpense(transaction);
                                    }}
                                    className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
                                    title="Excluir transação"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Transaction Dialog */}
      {editingExpense && (
        <EditTransactionDialog
          expense={editingExpense}
          categories={categories}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onSave={handleSaveEdit}
        />
      )}

      {/* Duplicate Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Duplicar Transações
            </DialogTitle>
            <DialogDescription>
              Escolha a data para duplicar {pendingDuplicateExpenses.length} transação(ões).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="duplicate-date" className="text-sm font-medium">
                Data de Destino
              </Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="duplicate-date"
                  type="date"
                  value={targetDuplicateDate}
                  onChange={(e) => setTargetDuplicateDate(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                As transações duplicadas serão adicionadas nesta data.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDuplicate}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Tem certeza que deseja excluir a transação <strong>"{expenseToDelete?.description}"</strong>?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteExpense}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
