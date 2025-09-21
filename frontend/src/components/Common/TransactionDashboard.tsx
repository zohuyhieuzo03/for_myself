import { Badge, Box, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCurrency } from "@/utils"

interface TransactionItem {
  amount: number
  category?: string
  category_id?: string
  date: string
  received_at?: string
  description?: string
  subject?: string
  type?: string
}

interface TransactionDashboardProps {
  transactions: TransactionItem[]
  showPieChart?: boolean
  showStats?: boolean
  showRecentTransactions?: boolean
  showMonthlyChart?: boolean
  monthlyData?: Array<{ label: string; value: number }>
  monthlyChartType?: "bar" | "line"
  dataPointType?: "days" | "months"
  currency?: string
  showAveragePerDay?: boolean
  filterType?: string
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
]

// Utility functions
const getTransactionDate = (tx: TransactionItem): Date => {
  return new Date(tx.received_at || tx.date)
}

const calculateDaysInMonth = (date: Date): number => {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month + 1, 0).getDate()
}

const calculateDaysBetween = (startDate: Date, endDate: Date): number => {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

const getDaysToDivide = (filterType: string, transactions: TransactionItem[]): number => {
  if (transactions.length === 0) return 1

  switch (filterType) {
    case "last7":
      return 7
    case "last30":
      return 30
    case "month": {
      const firstTxDate = getTransactionDate(transactions[0])
      return calculateDaysInMonth(firstTxDate)
    }
    case "custom": {
      const dates = transactions.map(getTransactionDate)
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
      return calculateDaysBetween(minDate, maxDate)
    }
    default:
      return 1
  }
}

export default function TransactionDashboard({
  transactions,
  showPieChart = true,
  showStats = true,
  showRecentTransactions = true,
  showMonthlyChart = false,
  monthlyData = [],
  monthlyChartType = "bar",
  dataPointType = "months",
  showAveragePerDay = false,
  filterType = "all",
}: TransactionDashboardProps) {
  const [chartType, setChartType] = useState<"bar" | "line">(monthlyChartType)
  const [pointType, setPointType] = useState<"days" | "months">(dataPointType)

  // Memoized calculations for better performance
  const stats = useMemo(() => {
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    const transactionCount = transactions.length
    const averageTransaction = transactionCount > 0 ? totalAmount / transactionCount : 0
    
    const daysToDivide = getDaysToDivide(filterType, transactions)
    const averagePerDay = filterType !== "all" && daysToDivide > 0 ? totalAmount / daysToDivide : 0

    return {
      totalAmount,
      transactionCount,
      averageTransaction,
      averagePerDay,
    }
  }, [transactions, filterType])

  // Memoized category data for pie chart
  const pieChartData = useMemo(() => {
    const categoryData = transactions.reduce(
      (acc, tx) => {
        const category = tx.category || "Uncategorized"
        if (acc[category]) {
          acc[category].value += tx.amount
        } else {
          acc[category] = { name: category, value: tx.amount }
        }
        return acc
      },
      {} as Record<string, { name: string; value: number }>,
    )
    return Object.values(categoryData)
  }, [transactions])

  // Memoized recent transactions
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => {
        const dateA = getTransactionDate(a)
        const dateB = getTransactionDate(b)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5)
  }, [transactions])

  // Memoized chart data processing
  const chartData = useMemo(() => {
    if (pointType === "days") {
      const dayData = transactions.reduce(
        (acc, tx) => {
          const txDate = getTransactionDate(tx)
          const dayKey = `${String(txDate.getMonth() + 1).padStart(2, "0")}/${String(txDate.getDate()).padStart(2, "0")}`

          if (!acc[dayKey]) {
            acc[dayKey] = { label: dayKey, value: 0 }
          }
          acc[dayKey].value += tx.amount
          return acc
        },
        {} as Record<string, { label: string; value: number }>,
      )

      return Object.values(dayData).sort((a, b) => a.label.localeCompare(b.label))
    }
    return monthlyData
  }, [transactions, pointType, monthlyData])

  // Render components
  const renderStatsCard = (title: string, value: string | number, color: string, subtitle: string) => (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
      <Text fontSize="sm" color="gray.600" mb={1}>
        {title}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" color={`${color}.500`}>
        {typeof value === 'number' ? formatCurrency(value) : value}
      </Text>
      <Text fontSize="xs" color="gray.500">
        {subtitle}
      </Text>
    </Box>
  )

  const renderChartControls = () => (
    <HStack gap={3}>
      <select
        value={pointType}
        onChange={(e) => setPointType(e.target.value as "days" | "months")}
        style={{ height: 32, paddingInline: 8, minWidth: 100 }}
      >
        <option value="days">Days</option>
        <option value="months">Months</option>
      </select>
      <select
        value={chartType}
        onChange={(e) => setChartType(e.target.value as "bar" | "line")}
        style={{ height: 32, paddingInline: 8, minWidth: 100 }}
      >
        <option value="bar">Column</option>
        <option value="line">Line</option>
      </select>
    </HStack>
  )

  const renderTransactionItem = (transaction: TransactionItem, index: number) => (
    <Box key={index}>
      <HStack justify="space-between" align="center">
        <VStack align="start" gap={1}>
          <Text fontSize="sm" fontWeight="medium">
            {transaction.description || transaction.subject || "Transaction"}
          </Text>
          <HStack gap={2}>
            <Text fontSize="xs" color="gray.500">
              {getTransactionDate(transaction).toLocaleDateString()}
            </Text>
            {transaction.category && (
              <Badge colorPalette="blue" size="sm">
                {transaction.category}
              </Badge>
            )}
            {transaction.type && (
              <Badge
                colorPalette={transaction.type === "in" ? "green" : "red"}
                size="sm"
              >
                {transaction.type === "in" ? "Income" : "Expense"}
              </Badge>
            )}
          </HStack>
        </VStack>
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color={transaction.type === "in" ? "green.500" : "red.500"}
        >
          {formatCurrency(transaction.amount)}
        </Text>
      </HStack>
      {index < recentTransactions.length - 1 && (
        <Box borderBottom="1px solid" borderColor="gray.200" mt={2} />
      )}
    </Box>
  )

  return (
    <VStack gap={6} align="stretch">
      {showStats && (
        <SimpleGrid columns={{ base: 1, md: showAveragePerDay ? 4 : 3 }} gap={4}>
          {renderStatsCard("Total Amount", stats.totalAmount, "green", "All transactions")}
          {renderStatsCard("Average Transaction", stats.averageTransaction, "blue", "Per transaction")}
          {showAveragePerDay && renderStatsCard("Average Per Day", stats.averagePerDay, "orange", "Daily average")}
          {renderStatsCard("Transaction Count", stats.transactionCount, "purple", "Total transactions")}
        </SimpleGrid>
      )}

      {(showPieChart && pieChartData.length > 0) ||
      (showMonthlyChart && monthlyData.length > 0) ? (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
          {showPieChart && pieChartData.length > 0 && (
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.700">
                Category Distribution
              </Text>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}

          {showMonthlyChart && monthlyData.length > 0 && (
            <Box>
              <HStack justify="space-between" align="center" mb={4}>
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                  Chart
                </Text>
                {renderChartControls()}
              </HStack>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 8, bottom: 24, left: 56 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" fontSize={10} />
                      <YAxis
                        fontSize={10}
                        allowDecimals={false}
                        width={72}
                        tickFormatter={(v: any) =>
                          `${Number(v).toLocaleString()}`
                        }
                      />
                      <Tooltip
                        formatter={(v: any) => [
                          formatCurrency(Number(v)),
                          "Total",
                        ]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell
                            key={`bar-${i}`}
                            fill={COLORS[i % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={chartData}
                      margin={{ top: 8, right: 8, bottom: 24, left: 56 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorValue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS[0]}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS[0]}
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" fontSize={10} />
                      <YAxis
                        fontSize={10}
                        allowDecimals={false}
                        width={72}
                        tickFormatter={(v: any) =>
                          `${Number(v).toLocaleString()}`
                        }
                      />
                      <Tooltip
                        formatter={(v: any) => [
                          formatCurrency(Number(v)),
                          "Total",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={COLORS[0]}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </Box>
            </Box>
          )}
        </SimpleGrid>
      ) : null}

      {showRecentTransactions && recentTransactions.length > 0 && (
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.700">
            Recent Transactions
          </Text>
          <VStack gap={2} align="stretch">
            {recentTransactions.map((transaction, index) => renderTransactionItem(transaction, index))}
          </VStack>
        </Box>
      )}
    </VStack>
  )
}
