# 💰 Controle Financeiro - Expense Chart App

Uma aplicação moderna e intuitiva para controle de despesas pessoais, construída com React, TypeScript e componentes UI elegantes.
<img width="1690" height="932" alt="Screenshot 2025-09-30 at 08 30 26" src="https://github.com/user-attachments/assets/7b621b41-ae79-488a-9dd6-34d868eed920" />

## ✨ Funcionalidades

### 📊 Dashboard Completo
- **Resumo Financeiro**: Visualização rápida de receitas, despesas e saldo total
- **Gráficos Interativos**: Análise visual de gastos por categoria e período
- **Cards de Resumo**: Métricas importantes em tempo real

### 💳 Gestão de Transações
- **Adicionar Despesas**: Registro rápido de gastos com categorização
- **Adicionar Receitas**: Controle de entradas de dinheiro
- **Empréstimos**: Gestão de dinheiro emprestado e devoluções
- **Edição e Exclusão**: Modificação fácil de transações existentes

### 🏷️ Categorização Inteligente
- **13 Categorias Pré-definidas**: Alimentação, Transporte, Moradia, Saúde, etc.
- **Ícones e Cores**: Identificação visual rápida
- **Categorias de Receita**: Salário, Freelance, Investimentos, etc.

### 📈 Análises e Relatórios
- **Gráficos de Pizza**: Distribuição de gastos por categoria
- **Gráficos de Linha**: Evolução temporal das despesas
- **Filtros por Período**: Análise mensal, semanal ou personalizada
- **Comparativos**: Receitas vs Despesas

### 💾 Importação e Exportação
- **Exportar Dados**: Backup em formato JSON
- **Importar Dados**: Restauração de dados salvos
- **Armazenamento Local**: Dados salvos no navegador
- **Limpeza de Dados**: Reset completo quando necessário

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca principal para interface
- **TypeScript** - Tipagem estática para maior confiabilidade
- **Vite** - Build tool moderno e rápido
- **React Router** - Navegação entre páginas

### UI/UX
- **shadcn/ui** - Componentes UI modernos e acessíveis
- **Radix UI** - Primitivos acessíveis para componentes
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Ícones elegantes e consistentes

### Gráficos e Visualizações
- **Recharts** - Biblioteca de gráficos para React
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### Estado e Dados
- **TanStack Query** - Gerenciamento de estado do servidor
- **Local Storage** - Persistência de dados no navegador
- **Custom Hooks** - Lógica reutilizável

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Passos para Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/expense-chart-app.git
cd expense-chart-app
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Execute o projeto em modo de desenvolvimento**
```bash
npm run dev
# ou
yarn dev
```

4. **Acesse a aplicação**
Abra [http://localhost:5173](http://localhost:5173) no seu navegador

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
```

## 📱 Como Usar

### 1. Adicionando Transações
- Clique em "Adicionar Despesa" ou "Adicionar Receita"
- Preencha os campos obrigatórios (valor, categoria, descrição)
- Selecione a data da transação
- Para empréstimos, adicione informações do devedor

### 2. Visualizando Dados
- **Cards de Resumo**: Veja o total de receitas, despesas e saldo
- **Lista de Transações**: Histórico completo com opções de edição
- **Gráficos**: Análise visual dos seus gastos

### 3. Gerenciando Dados
- **Exportar**: Baixe um arquivo JSON com todos os dados
- **Importar**: Restaure dados de um arquivo JSON
- **Limpar**: Remove todos os dados (use com cuidado!)

## 🎨 Personalização

### Categorias
As categorias podem ser personalizadas editando o arquivo `src/pages/Index.tsx`:

```typescript
const defaultCategories: Category[] = [
  { id: "food", name: "Alimentação", icon: "🍔", color: "#ef4444" },
  // Adicione suas próprias categorias aqui
];
```

### Temas
A aplicação suporta temas claro e escuro através do sistema de temas do shadcn/ui.

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── ExpenseForm.tsx # Formulário de transações
│   ├── ExpenseList.tsx # Lista de transações
│   ├── SummaryCards.tsx # Cards de resumo
│   └── ExpenseCharts.tsx # Gráficos e visualizações
├── hooks/              # Custom hooks
│   └── use-local-storage.ts # Hook para localStorage
├── pages/              # Páginas da aplicação
│   ├── Index.tsx       # Página principal
│   └── NotFound.tsx    # Página 404
├── lib/                # Utilitários
│   └── utils.ts        # Funções auxiliares
└── App.tsx             # Componente raiz
```

## 🔧 Desenvolvimento

### Adicionando Novas Funcionalidades
1. Crie componentes na pasta `src/components/`
2. Use os componentes base do `src/components/ui/`
3. Implemente custom hooks em `src/hooks/` quando necessário
4. Mantenha a tipagem TypeScript consistente

### Padrões de Código
- Use TypeScript para todas as funcionalidades
- Siga as convenções do ESLint configurado
- Mantenha componentes pequenos e focados
- Use custom hooks para lógica reutilizável

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente se necessário
3. Deploy automático a cada push

### Netlify
1. Conecte o repositório
2. Configure o build command: `npm run build`
3. Configure o publish directory: `dist`

### Outras Plataformas
A aplicação gera arquivos estáticos na pasta `dist/` que podem ser servidos por qualquer servidor web.

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI incríveis
- [Radix UI](https://www.radix-ui.com/) - Primitivos acessíveis
- [Recharts](https://recharts.org/) - Biblioteca de gráficos
- [Lucide](https://lucide.dev/) - Ícones elegantes
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões:

1. Abra uma [issue](https://github.com/seu-usuario/expense-chart-app/issues)
2. Entre em contato através do email: seu-email@exemplo.com

---

**Desenvolvido com ❤️ para ajudar no controle financeiro pessoal**
