import {
  Box,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Area,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { CategoriesService, GmailService } from "@/client"

const CHART_COLORS = [
  "#3182CE",
  "#805AD5",
  "#38A169",
  "#D69E2E",
  "#DD6B20",
  "#E53E3E",
  "#319795",
  "#718096",
]

type FilterType = "all" | "month" | "last7" | "last30" | "custom"

export default function EmailTransactionsDashboard() {
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [year, setYear] = useState<number | "all">("all")
  const [month, setMonth] = useState<number | "all">("all")
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")

  const { data: connections } = useQuery({
    queryKey: ["gmail-connections"],
    queryFn: () => GmailService.getGmailConnections(),
    staleTime: 5 * 60 * 1000,
  })

  const connectionId = connections?.data?.[0]?.id

  const { data: dashboard } = useQuery({
    queryKey: [
      "email-txn-dashboard",
      { connectionId, year, month },
    ],
    enabled: Boolean(connectionId),
    queryFn: () =>
      GmailService.getEmailTransactionsDashboard({
        connectionId: connectionId!,
        year: year === "all" ? undefined : (year as number),
        month: month === "all" ? undefined : (month as number),
      }),
    placeholderData: (prev) => prev,
  })

  // Range-based aggregation using raw transactions
  const { data: rangeAgg } = useQuery({
    queryKey: [
      "email-txn-range-agg",
      { connectionId, filterType, customStart, customEnd },
    ],
    enabled:
      Boolean(connectionId) &&
      (filterType === "last7" || filterType === "last30" || filterType === "custom"),
    queryFn: async () => {
      // determine start/end
      let start: Date
      let end: Date
      const today = new Date()
      if (filterType === "last7") {
        end = today
        start = new Date()
        start.setDate(end.getDate() - 6)
      } else if (filterType === "last30") {
        end = today
        start = new Date()
        start.setDate(end.getDate() - 29)
      } else {
        start = customStart ? new Date(customStart) : new Date("1970-01-01")
        end = customEnd ? new Date(customEnd) : today
      }
      // normalize to midnight
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      // helpers
      const startOfWeek = (d: Date) => {
        const date = new Date(d)
        const day = date.getDay() || 7
        if (day !== 1) date.setHours(-24 * (day - 1), 0, 0, 0)
        date.setHours(0, 0, 0, 0)
        return date
      }
      const weekKey = (d: Date) => {
        const yearStart = new Date(d.getFullYear(), 0, 1)
        const days = Math.floor((Number(d) - Number(yearStart)) / (24 * 3600 * 1000))
        const week = Math.ceil((days + yearStart.getDay() + 1) / 7)
        return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`
      }

      // fetch categories to map id->name
      const categories = await CategoriesService.readCategories({ skip: 0, limit: 1000 })
      const catMap = new Map<string, string>()
      categories.data.forEach((c: any) => catMap.set(c.id, c.name))

      // fetch transactions across connections (first one only for now)
      const allTx: any[] = []
      if (connectionId) {
        const resp = await GmailService.getEmailTransactions({
          connectionId,
          skip: 0,
          limit: 10000,
        })
        allTx.push(...resp.data)
      }

      const inRange = allTx.filter((t: any) => {
        const dt = new Date(t.received_at)
        return dt >= start && dt <= end && typeof t.amount === "number"
      })

      // aggregate by display mode
      let monthly: { label: string; value: number }[] = []
      if (filterType === "last7") {
        // group by day
        const map = new Map<string, number>()
        for (let i = 0; i < 7; i++) {
          const d = new Date(start)
          d.setDate(start.getDate() + i)
          const key = d.toISOString().slice(0, 10)
          map.set(key, 0)
        }
        inRange.forEach((t: any) => {
          const key = new Date(t.received_at).toISOString().slice(0, 10)
          map.set(key, (map.get(key) || 0) + (t.amount || 0))
        })
        monthly = Array.from(map.entries()).map(([label, value]) => ({ label, value }))
      } else if (filterType === "last30") {
        // group by week
        const map = new Map<string, number>()
        let cursor = startOfWeek(start)
        while (cursor <= end) {
          const key = weekKey(cursor)
          map.set(key, 0)
          const next = new Date(cursor)
          next.setDate(cursor.getDate() + 7)
          cursor = next
        }
        inRange.forEach((t: any) => {
          const key = weekKey(startOfWeek(new Date(t.received_at)))
          map.set(key, (map.get(key) || 0) + (t.amount || 0))
        })
        monthly = Array.from(map.entries()).map(([label, value]) => ({ label, value }))
      } else {
        // default monthly
        const byMonthMap = new Map<string, number>()
        inRange.forEach((t: any) => {
          const dt = new Date(t.received_at)
          const key = `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}`
          byMonthMap.set(key, (byMonthMap.get(key) || 0) + (t.amount || 0))
        })
        monthly = Array.from(byMonthMap.entries())
          .sort((a, b) => (a[0] < b[0] ? -1 : 1))
          .map(([label, value]) => ({ label, value }))
      }

      // aggregate by category
      const byCatMap = new Map<string, number>()
      inRange.forEach((t: any) => {
        const name = t.category_id ? catMap.get(t.category_id) || "Uncategorized" : "Uncategorized"
        byCatMap.set(name, (byCatMap.get(name) || 0) + (t.amount || 0))
      })
      const byCategory = Array.from(byCatMap.entries()).map(([name, value]) => ({ name, value }))

      return { monthly, byCategory, start: start.toISOString(), end: end.toISOString() }
    },
    placeholderData: (prev) => prev,
  })

  const barData = useMemo(() => {
    if (filterType === "last7" || filterType === "last30" || filterType === "custom") {
      return rangeAgg?.monthly ?? []
    }
    return (dashboard?.monthly ?? []).map((m) => ({
      label: `${m.year}/${m.month?.toString().padStart(2, "0")}`,
      value: Number(m.total_amount ?? 0),
    }))
  }, [dashboard, rangeAgg, filterType])

  const pieData = useMemo(() => {
    const arr =
      filterType === "last7" || filterType === "last30" || filterType === "custom"
        ? (rangeAgg?.byCategory ?? []).map((d: any) => ({ name: d.name, value: Number(d.value || 0) }))
        : (dashboard?.by_category ?? []).map((c) => ({
            name: c.category_name ?? "Uncategorized",
            value: Number(c.total_amount ?? 0),
          }))

    return arr
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [dashboard, rangeAgg, filterType])

  const years = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => y - i)
  }, [])

  function DateRangeControls() {
    return (
      <HStack gap={3}>
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

        {filterType === "custom" && (
          <HStack gap={2}>
            <input
              aria-label="Start date"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{ height: 32, paddingInline: 8 }}
            />
            <input
              aria-label="End date"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{ height: 32, paddingInline: 8 }}
            />
          </HStack>
        )}
      </HStack>
    )
  }

  return (
    <Container maxW="6xl" py={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Email Transactions Dashboard</Heading>
        <HStack gap={3}>
          <DateRangeControls />
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as "bar" | "line")}
            style={{ height: 32, paddingInline: 8 }}
            aria-label="Chart type"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
          </select>
        </HStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <HStack justify="space-between" mb={3}>
            <Heading size="sm">Monthly totals</Heading>
            <Box fontSize="xs" color="gray.600">VND</Box>
          </HStack>
          <Box height="260px">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 24, left: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={10} />
                  <YAxis fontSize={10} allowDecimals={false} width={72} tickFormatter={(v: any) => `${Number(v).toLocaleString()}₫`} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()}₫`, "Total"]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={`bar-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <ComposedChart data={barData} margin={{ top: 8, right: 16, bottom: 24, left: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={10} />
                  <YAxis fontSize={10} allowDecimals={false} width={72} tickFormatter={(v: any) => `${Number(v).toLocaleString()}₫`} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()}₫`, "Total"]} />
                  <Area type="monotone" dataKey="value" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.2} />
                  <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </Box>
        </Box>

        <Box borderWidth="1px" borderRadius="md" p={4}>
          <HStack justify="space-between" mb={3}>
            <Heading size="sm">By category</Heading>
            <Box fontSize="xs" color="gray.600">VND</Box>
          </HStack>
          <HStack align="start" gap={6}>
            <Box height="260px" w="260px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                    {pieData.map((_, i) => (
                      <Cell key={`slice-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${Number(v).toLocaleString()}₫`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <VStack align="start" gap={2}>
              {pieData.length === 0 ? (
                <Box fontSize="sm">No data</Box>
              ) : (
                pieData.map((d, i) => (
                  <HStack key={d.name} gap={2}>
                    <Box w="10px" h="10px" borderRadius="2px" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <Box fontSize="sm">{d.name}: {Number(d.value).toLocaleString()}₫</Box>
                  </HStack>
                ))
              )}
            </VStack>
          </HStack>
        </Box>
      </SimpleGrid>
    </Container>
  )
}


