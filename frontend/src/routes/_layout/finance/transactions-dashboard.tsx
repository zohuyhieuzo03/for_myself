import { Container, Heading, HStack, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { AccountsService, TransactionsService } from "@/client"
import DateRangePicker from "@/components/Common/DateRangePicker"
import TransactionDashboard from "@/components/Common/TransactionDashboard"

export const Route = createFileRoute("/_layout/finance/transactions-dashboard")(
  {
    component: TransactionsDashboardPage,
  },
)

type FilterType = "all" | "month" | "last7" | "last30" | "custom"
type TransactionType = "all" | "expense" | "income"

function TransactionsDashboardPage() {
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [transactionType, setTransactionType] = useState<TransactionType>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => TransactionsService.readTransactions(),
  })

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => AccountsService.readAccounts(),
  })

  // Filter transactions based on selected filters
  const filteredTransactions =
    transactions?.data?.filter((tx: any) => {
      if (selectedAccountId && tx.account_id !== selectedAccountId) {
        return false
      }

      // Filter by transaction type
      if (transactionType !== "all") {
        if (transactionType === "expense" && tx.type !== "out") {
          return false
        }
        if (transactionType === "income" && tx.type !== "in") {
          return false
        }
      }

      const txDate = new Date(tx.txn_date)
      const now = new Date()

      switch (filterType) {
        case "last7": {
          const last7Days = new Date()
          last7Days.setDate(now.getDate() - 6)
          return txDate >= last7Days
        }
        case "last30": {
          const last30Days = new Date()
          last30Days.setDate(now.getDate() - 29)
          return txDate >= last30Days
        }
        case "month": {
          if (!selectedMonth) return true
          const selectedDate = new Date(selectedMonth)
          return (
            txDate.getFullYear() === selectedDate.getFullYear() &&
            txDate.getMonth() === selectedDate.getMonth()
          )
        }
        case "custom":
          if (!startDate || !endDate) return true
          return txDate >= new Date(startDate) && txDate <= new Date(endDate)
        default:
          return true
      }
    }) || []

  // Transform transactions to match TransactionDashboard format
  const dashboardTransactions = filteredTransactions.map((tx: any) => ({
    amount: tx.amount, // Keep original amount, don't convert to negative
    category: tx.category_name || "Uncategorized",
    category_id: tx.category_id,
    date: tx.txn_date,
    description: tx.merchant || tx.description,
    type: tx.type, // Add type information
  }))

  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Transaction Dashboard</Heading>
          <div>Loading...</div>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Transaction Dashboard</Heading>
          <div style={{ color: "red" }}>Error loading transactions</div>
        </VStack>
      </Container>
    )
  }

  // Prepare chart data for monthly totals
  const chartData = dashboardTransactions
    .filter((tx: any) => tx.amount && typeof tx.amount === "number")
    .reduce((acc: any, tx: any) => {
      const date = new Date(tx.date)
      const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!acc[monthKey]) {
        acc[monthKey] = { label: monthKey, value: 0 }
      }
      acc[monthKey].value += tx.amount
      return acc
    }, {})

  const monthlyData = Object.values(chartData).sort((a: any, b: any) =>
    a.label.localeCompare(b.label),
  ) as Array<{ label: string; value: number }>

  const FilterControls = (
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
        <option value="custom">Custom range</option>
      </select>

      {filterType === "month" && (
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            height: 32,
            paddingInline: 8,
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: 14,
            minWidth: 140,
            backgroundColor: "white",
            color: "inherit",
          }}
        />
      )}

      {filterType === "custom" && (
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          disabled={false}
        />
      )}
    </HStack>
  )

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Transaction Dashboard</Heading>
          {FilterControls}
        </HStack>

        <TransactionDashboard
          transactions={dashboardTransactions}
          currency="₫"
          showStats={true}
          showPieChart={true}
          showRecentTransactions={true}
          showMonthlyChart={true}
          monthlyData={monthlyData}
          showAveragePerDay={filterType !== "all"}
          filterType={filterType}
        />
      </VStack>
    </Container>
  )
}
