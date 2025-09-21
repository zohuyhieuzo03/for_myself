import { Container, Heading, HStack, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { GmailService } from "@/client"
import DateRangePicker from "@/components/Common/DateRangePicker"
import TransactionDashboard from "@/components/Common/TransactionDashboard"

type FilterType = "all" | "month" | "last7" | "last30" | "custom"

export default function EmailDashboard() {
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const { data: connections } = useQuery({
    queryKey: ["gmail-connections"],
    queryFn: () => GmailService.getGmailConnections(),
    staleTime: 5 * 60 * 1000,
  })

  // Set default connection when connections load
  useEffect(() => {
    if (
      connections?.data &&
      connections.data.length > 0 &&
      !selectedConnectionId
    ) {
      setSelectedConnectionId(connections.data[0].id)
    }
  }, [connections, selectedConnectionId])

  const connectionId = selectedConnectionId || connections?.data?.[0]?.id

  // Get email transactions for the dashboard
  const { data: emailTransactions } = useQuery({
    queryKey: ["email-transactions", { connectionId }],
    enabled: Boolean(connectionId),
    queryFn: () =>
      GmailService.getEmailTransactions({
        connectionId: connectionId!,
        skip: 0,
        limit: 50000, // Increased limit to get more emails
      }),
    staleTime: 5 * 60 * 1000,
  })

  // Transform email transactions to match TransactionDashboard format
  const allTransactions =
    emailTransactions?.data?.map((tx: any) => ({
      amount: tx.amount || 0,
      category: tx.category_name || "Uncategorized",
      category_id: tx.category_id,
      date: tx.received_at,
      received_at: tx.received_at,
      description: tx.description,
      subject: tx.subject,
      // All currencies (VND, VNDR, VNF) are displayed as VND
    })) || []

  // Filter transactions based on selected filters
  const transactions = allTransactions.filter((tx: any) => {
    const txDate = new Date(tx.received_at)
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
  })

  // Prepare chart data for monthly totals
  const chartData = transactions
    .filter((tx: any) => tx.amount && typeof tx.amount === "number")
    .reduce((acc: any, tx: any) => {
      const date = new Date(tx.received_at)
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

  const DateRangeControls = (
    <HStack gap={3}>
      <select
        value={selectedConnectionId}
        onChange={(e) => setSelectedConnectionId(e.target.value)}
        style={{ height: 32, paddingInline: 8, minWidth: 200 }}
      >
        <option value="">Select Connection</option>
        {connections?.data?.map((conn: any) => (
          <option key={conn.id} value={conn.id}>
            {conn.gmail_email}
          </option>
        ))}
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
    <Container maxW="6xl" py={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Email Transactions Dashboard</Heading>
        {DateRangeControls}
      </HStack>

      <VStack gap={6} align="stretch">
        {/* Transaction Dashboard */}
        <TransactionDashboard
          transactions={transactions}
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
