// @ts-nocheck
import {
  Box,
  Flex,
  Grid,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { GmailService } from "@/client"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

interface DashboardStats {
  total_transactions: number
  total_amount: number
  processed_count: number
  pending_count: number
  ignored_count: number
  transactions_by_type: Record<string, number>
  transactions_by_month: Array<{ month: string; count: number }>
  top_merchants: Array<{
    merchant: string
    count: number
    total_amount: number
  }>
  amount_by_month: Array<{ month: string; amount: number }>
  processing_rate: number
}

function StatCard({
  title,
  value,
  helpText,
  color = "blue",
}: {
  title: string
  value: string | number
  helpText?: string
  color?: string
}) {
  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      shadow="sm"
      border="1px"
      borderColor="gray.200"
    >
      <VStack align="start" gap={2}>
        <Text fontSize="sm" color="gray.600">
          {title}
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color={`${color}.500`}>
          {value}
        </Text>
        {helpText && (
          <Text fontSize="sm" color="gray.500">
            {helpText}
          </Text>
        )}
      </VStack>
    </Box>
  )
}

function TransactionsByMonthChart({
  data,
}: {
  data: Array<{ month: string; count: number }>
}) {
  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      shadow="sm"
      border="1px"
      borderColor="gray.200"
    >
      <Heading size="md" mb={4}>
        Giao dịch theo tháng
      </Heading>
      <Box height="300px">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3182CE" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

function AmountByMonthChart({
  data,
}: {
  data: Array<{ month: string; amount: number }>
}) {
  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      shadow="sm"
      border="1px"
      borderColor="gray.200"
    >
      <Heading size="md" mb={4}>
        Tổng tiền theo tháng
      </Heading>
      <Box height="300px">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: any) => [
                `${Number(value).toLocaleString()} VNĐ`,
                "Tổng tiền",
              ]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#38A169"
              fill="#38A169"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

function StatusPieChart({
  data,
}: {
  data: Array<{ name: string; value: number }>
}) {
  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      shadow="sm"
      border="1px"
      borderColor="gray.200"
    >
      <Heading size="md" mb={4}>
        Trạng thái giao dịch
      </Heading>
      <Box height="300px">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) =>
                `${name} ${(Number(percent) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

function TransactionTypeChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key === "credit" ? "Thu nhập" : key === "debit" ? "Chi tiêu" : key,
    value,
  }))

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      shadow="sm"
      border="1px"
      borderColor="gray.200"
    >
      <Heading size="md" mb={4}>
        Loại giao dịch
      </Heading>
      <Box height="300px">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) =>
                `${name} ${(Number(percent) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

function TopMerchantsChart({
  data,
}: {
  data: Array<{ merchant: string; count: number; total_amount: number }>
}) {
  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      shadow="sm"
      border="1px"
      borderColor="gray.200"
    >
      <Heading size="md" mb={4}>
        Top 10 nhà cung cấp
      </Heading>
      <Box height="400px">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="merchant" type="category" width={120} />
            <Tooltip
              formatter={(value: any, name: any) => [
                name === "count"
                  ? value
                  : `${Number(value).toLocaleString()} VNĐ`,
                name === "count" ? "Số giao dịch" : "Tổng tiền",
              ]}
            />
            <Bar dataKey="count" fill="#3182CE" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

export default function EmailTransactionDashboard() {
  const [days, setDays] = useState(30)

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["email-transaction-dashboard", days],
    queryFn: () =>
      GmailService.getEmailTransactionsDashboard({
        connectionId: "",
        year: undefined,
        month: undefined,
      }) as any,
  }) as { data: DashboardStats | undefined; isLoading: boolean; error: any }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="400px">
        <Spinner size="xl" />
      </Flex>
    )
  }

  if (error) {
    return (
      <Box p={6}>
        <Text color="red.500">Có lỗi xảy ra khi tải dữ liệu dashboard</Text>
      </Box>
    )
  }

  if (!stats) {
    return (
      <Box p={6}>
        <Text>Không có dữ liệu để hiển thị</Text>
      </Box>
    )
  }

  const statusData = [
    { name: "Đã xử lý", value: Number(stats.processed_count) },
    { name: "Đang chờ", value: Number(stats.pending_count) },
    { name: "Bỏ qua", value: Number(stats.ignored_count) },
  ].filter((item) => item.value > 0)

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Heading size="lg">Dashboard Email Transactions</Heading>
        <select
          value={days}
          onChange={(e: any) => setDays(Number(e.target.value))}
          style={{
            maxWidth: "200px",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <option value={7}>7 ngày qua</option>
          <option value={30}>30 ngày qua</option>
          <option value={90}>90 ngày qua</option>
          <option value={365}>1 năm qua</option>
        </select>
      </Flex>

      {/* Summary Stats */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={6}
      >
        <StatCard
          title="Tổng giao dịch"
          value={Number(stats.total_transactions).toLocaleString()}
          helpText="Tất cả email transactions"
          color="blue"
        />
        <StatCard
          title="Tổng tiền"
          value={`${Number(stats.total_amount).toLocaleString()} VNĐ`}
          helpText="Tổng số tiền giao dịch"
          color="green"
        />
        <StatCard
          title="Tỷ lệ xử lý"
          value={`${Number(stats.processing_rate)}%`}
          helpText="Giao dịch đã được xử lý"
          color="purple"
        />
        <StatCard
          title="Đang chờ xử lý"
          value={Number(stats.pending_count).toLocaleString()}
          helpText="Cần xem xét"
          color="orange"
        />
      </Grid>

      {/* Charts Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
        {/* Transactions by Month */}
        <TransactionsByMonthChart
          data={
            stats.transactions_by_month as Array<{
              month: string
              count: number
            }>
          }
        />

        {/* Amount by Month */}
        <AmountByMonthChart
          data={
            stats.amount_by_month as Array<{ month: string; amount: number }>
          }
        />

        {/* Status Pie Chart */}
        <StatusPieChart data={statusData} />

        {/* Transaction Type Chart */}
        <TransactionTypeChart
          data={stats.transactions_by_type as Record<string, number>}
        />
      </Grid>

      {/* Top Merchants */}
      <TopMerchantsChart
        data={
          stats.top_merchants as Array<{
            merchant: string
            count: number
            total_amount: number
          }>
        }
      />
    </VStack>
  )
}
