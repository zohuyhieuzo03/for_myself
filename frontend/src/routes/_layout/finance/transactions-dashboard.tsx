import { Container, Heading, HStack, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { TransactionsService, AccountsService } from "@/client";
import TransactionDashboard from "@/components/Common/TransactionDashboard";

export const Route = createFileRoute("/_layout/finance/transactions-dashboard")({
  component: TransactionsDashboardPage,
});

type FilterType = "all" | "month" | "last7" | "last30" | "custom";
type TransactionType = "all" | "expense" | "income";

function TransactionsDashboardPage() {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [year, setYear] = useState<number | "all">("all");
  const [month, setMonth] = useState<number | "all">("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [transactionType, setTransactionType] = useState<TransactionType>("all");

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => TransactionsService.readTransactions(),
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => AccountsService.readAccounts(),
  });


  // Filter transactions based on selected filters
  const filteredTransactions = transactions?.data?.filter((tx: any) => {
    if (selectedAccountId && tx.account_id !== selectedAccountId) {
      return false;
    }

    // Filter by transaction type
    if (transactionType !== "all") {
      if (transactionType === "expense" && tx.type !== "out") {
        return false;
      }
      if (transactionType === "income" && tx.type !== "in") {
        return false;
      }
    }

    const txDate = new Date(tx.txn_date);
    const now = new Date();

    switch (filterType) {
      case "last7":
        const last7Days = new Date();
        last7Days.setDate(now.getDate() - 6);
        return txDate >= last7Days;
      case "last30":
        const last30Days = new Date();
        last30Days.setDate(now.getDate() - 29);
        return txDate >= last30Days;
      case "month":
        if (year !== "all" && txDate.getFullYear() !== year) return false;
        if (month !== "all" && txDate.getMonth() + 1 !== month) return false;
        return true;
      default:
        return true;
    }
  }) || [];

  // Transform transactions to match TransactionDashboard format
  const dashboardTransactions = filteredTransactions.map((tx: any) => ({
    amount: tx.amount, // Keep original amount, don't convert to negative
    category: tx.category_name || "Uncategorized",
    category_id: tx.category_id,
    date: tx.txn_date,
    description: tx.merchant || tx.description,
    type: tx.type, // Add type information
  }));

  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Transaction Dashboard</Heading>
          <div>Loading...</div>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Transaction Dashboard</Heading>
          <div style={{ color: "red" }}>Error loading transactions</div>
        </VStack>
      </Container>
    );
  }

  // Prepare chart data for monthly totals
  const chartData = dashboardTransactions
    .filter((tx: any) => tx.amount && typeof tx.amount === "number")
    .reduce((acc: any, tx: any) => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { label: monthKey, value: 0 };
      }
      acc[monthKey].value += tx.amount;
      return acc;
    }, {});

  const monthlyData = Object.values(chartData).sort((a: any, b: any) => 
    a.label.localeCompare(b.label)
  ) as Array<{ label: string; value: number }>;

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // Determine days to show based on filter type
  const getDaysToShow = () => {
    switch (filterType) {
      case "last7":
        return 7;
      case "last30":
        return 30;
      case "month":
        return 30; // Default to 30 days for month view
      case "all":
        return 30; // Default to 30 days for all time
      default:
        return 30;
    }
  };

  function FilterControls() {
    return (
      <HStack gap={3}>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          style={{ height: 32, paddingInline: 8, minWidth: 200 }}
        >
          <option value="">All Accounts</option>
          {accounts?.data?.map((acc: any) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value as TransactionType)}
          style={{ height: 32, paddingInline: 8 }}
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          style={{ height: 32, paddingInline: 8 }}
        >
          <option value="all">All time</option>
          <option value="month">By month</option>
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
        </select>

        <select
          value={year}
          onChange={(e) =>
            setYear(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          style={{ width: 120, height: 32, paddingInline: 8 }}
          disabled={filterType !== "month" && filterType !== "all"}
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) =>
            setMonth(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          style={{ width: 140, height: 32, paddingInline: 8 }}
          disabled={filterType !== "month"}
        >
          <option value="all">All months</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </HStack>
    );
  }

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Transaction Dashboard</Heading>
          <FilterControls />
        </HStack>
        
        <TransactionDashboard
          transactions={dashboardTransactions}
          currency="₫"
          showStats={true}
          showPieChart={true}
          showRecentTransactions={true}
          showMonthlyChart={true}
          monthlyData={monthlyData}
          daysToShow={getDaysToShow()}
        />
      </VStack>
    </Container>
  );
}
