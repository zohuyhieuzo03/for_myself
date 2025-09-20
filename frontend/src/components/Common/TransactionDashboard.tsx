import { Badge, Box, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
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
  daysToShow?: number
  currency?: string
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
]

export default function TransactionDashboard({
  transactions,
  showPieChart = true,
  showStats = true,
  showRecentTransactions = true,
  showMonthlyChart = false,
  monthlyData = [],
  monthlyChartType = "bar",
  dataPointType = "months",
  daysToShow = 30,
}: TransactionDashboardProps) {
  const [chartType, setChartType] = useState<"bar" | "line">(monthlyChartType)
  const [pointType, setPointType] = useState<"days" | "months">(dataPointType)

  // Calculate total amount
  const totalAmount = transactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  )

  // Group by category for pie chart
  const categoryData = transactions.reduce(
    (acc, transaction) => {
      const category = transaction.category || "Uncategorized"
      if (acc[category]) {
        acc[category].value += transaction.amount
      } else {
        acc[category] = { name: category, value: transaction.amount }
      }
      return acc
    },
    {} as Record<string, { name: string; value: number }>,
  )

  const pieChartData = Object.values(categoryData)

  // Calculate average transaction
  const averageTransaction =
    transactions.length > 0 ? totalAmount / transactions.length : 0

  // Count transactions
  const transactionCount = transactions.length

  // Get recent transactions (last 5)
  const recentTransactions = transactions
    .sort((a, b) => {
      const dateA = a.received_at || a.date
      const dateB = b.received_at || b.date
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, 5)

  // Process chart data based on point type
  const processChartData = (
    data: Array<{ label: string; value: number }>,
    type: "days" | "months",
  ) => {
    if (type === "days") {
      // Group by days for the specified number of days
      const lastDays = Array.from({ length: daysToShow }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date
      }).reverse()

      const dayData = lastDays.map((date) => {
        const dayTransactions = transactions.filter((tx) => {
          const txDate = new Date(tx.received_at || tx.date)
          return txDate.toDateString() === date.toDateString()
        })
        const total = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0)
        return {
          label: `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
          value: total,
        }
      })

      return dayData
    }
    // Use monthly data as provided
    return data
  }

  const chartData = processChartData(monthlyData, pointType)

  return (
    <VStack gap={6} align="stretch">
      {showStats && (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
            <Text fontSize="sm" color="gray.600" mb={1}>
              Total Amount
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.500">
              {formatCurrency(totalAmount)}
            </Text>
            <Text fontSize="xs" color="gray.500">
              All transactions
            </Text>
          </Box>

          <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
            <Text fontSize="sm" color="gray.600" mb={1}>
              Average Transaction
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
              {formatCurrency(averageTransaction)}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Per transaction
            </Text>
          </Box>

          <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
            <Text fontSize="sm" color="gray.600" mb={1}>
              Transaction Count
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
              {transactionCount}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Total transactions
            </Text>
          </Box>
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
                  Monthly Totals
                </Text>
                <HStack gap={3}>
                  <select
                    value={pointType}
                    onChange={(e) =>
                      setPointType(e.target.value as "days" | "months")
                    }
                    style={{ height: 32, paddingInline: 8, minWidth: 100 }}
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                  <select
                    value={chartType}
                    onChange={(e) =>
                      setChartType(e.target.value as "bar" | "line")
                    }
                    style={{ height: 32, paddingInline: 8, minWidth: 100 }}
                  >
                    <option value="bar">Column</option>
                    <option value="line">Line</option>
                  </select>
                </HStack>
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
            {recentTransactions.map((transaction, index) => (
              <Box key={index}>
                <HStack justify="space-between" align="center">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" fontWeight="medium">
                      {transaction.description ||
                        transaction.subject ||
                        "Transaction"}
                    </Text>
                    <HStack gap={2}>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(
                          transaction.received_at || transaction.date,
                        ).toLocaleDateString()}
                      </Text>
                      {transaction.category && (
                        <Badge colorPalette="blue" size="sm">
                          {transaction.category}
                        </Badge>
                      )}
                      {transaction.type && (
                        <Badge
                          colorPalette={
                            transaction.type === "in" ? "green" : "red"
                          }
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
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  )
}
