import React, { useState } from 'react';
import { DailyExpenses } from '@/components/DailyExpenses';
import { Category, Expense } from '@/components/ExpenseForm';
import { useExpensesStorage } from '@/hooks/use-local-storage';
import { Wallet, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { defaultCategories } from '@/data/categories';

const DailyExpensesPage = () => {
  const { expenses, updateExpense, bulkDuplicateExpenses, deleteExpense } = useExpensesStorage();
  const [categories] = useState<Category[]>(defaultCategories);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gastos Diários</h1>
                <p className="text-sm text-gray-600">Visualize seus gastos organizados por dia</p>
              </div>
            </div>
            
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <DailyExpenses 
          expenses={expenses} 
          categories={categories} 
          onUpdateExpense={updateExpense}
          onBulkDuplicate={bulkDuplicateExpenses}
          onDeleteExpense={deleteExpense}
        />
      </div>
    </div>
  );
};

export default DailyExpensesPage;
