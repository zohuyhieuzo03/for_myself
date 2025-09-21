import { Container, Heading, HStack, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { GmailService } from "@/client"
import TransactionDashboard from "@/components/Common/TransactionDashboard"

type FilterType = "all" | "month" | "last7" | "last30" | "custom"

export default function EmailDashboard() {
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [year, setYear] = useState<number | "all">("all")
  const [month, setMonth] = useState<number | "all">("all")
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("")

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
  const transactions =
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

  const years = Array.from(
    { length: 6 },
    (_, i) => new Date().getFullYear() - i,
  )


  function DateRangeControls() {
    return (
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
    )
  }

  return (
    <Container maxW="6xl" py={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Email Transactions Dashboard</Heading>
        <DateRangeControls />
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
        />
      </VStack>
    </Container>
  )
}
