import { MonthlyDrePanel } from "@/components/MonthlyDrePanel";
import { FinancialHealthPanel } from "@/components/FinancialHealthPanel";
import { useExpensesStorage } from "@/hooks/use-local-storage";

const MonthlyResultPage = () => {
  const { expenses } = useExpensesStorage();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Resultado Mensal PF x PJ</h1>
        <p className="text-sm text-muted-foreground">Comparativo mensal de receitas, despesas e fluxo de caixa.</p>
      </div>
      <FinancialHealthPanel expenses={expenses} />
      <MonthlyDrePanel expenses={expenses} />
    </div>
  );
};

export default MonthlyResultPage;
