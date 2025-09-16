import {
  Badge,
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { MonthlyReportsService } from "@/client"

interface MonthFinancialDashboardProps {
  year?: number
  month?: number
}

export default function MonthFinancialDashboard({
  year: initialYear = new Date().getFullYear(),
  month: initialMonth = new Date().getMonth() + 1,
}: MonthFinancialDashboardProps) {
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)

  // Fetch monthly summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["monthly-summary", selectedYear, selectedMonth],
    queryFn: () =>
      MonthlyReportsService.getMonthlyFinancialSummary({
        year: selectedYear,
        month: selectedMonth,
      }),
  })

  // Fetch detailed report
  const { data: detailedReport, isLoading: detailedLoading } = useQuery({
    queryKey: ["monthly-detailed", selectedYear, selectedMonth],
    queryFn: () =>
      MonthlyReportsService.getMonthlyFinancialReport({
        year: selectedYear,
        month: selectedMonth,
      }),
  })

  const isLoading = summaryLoading || detailedLoading

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  return (
    <Box p={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={4}>
            Monthly Financial Report
          </Heading>

          <HStack gap={4}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              style={{
                maxWidth: "200px",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
              })}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              style={{
                maxWidth: "200px",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </HStack>
        </Box>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
          <Box
            p={6}
            bg="white"
            borderRadius="lg"
            shadow="sm"
            border="1px"
            borderColor="gray.200"
          >
            <Box>
              <Box fontSize="sm" color="gray.600" mb={1}>
                Total Income
              </Box>
              <Box fontSize="2xl" fontWeight="bold" color="green.500">
                {isLoading ? "..." : formatCurrency(summary?.total_income || 0)}
              </Box>
              <Box fontSize="sm" color="gray.500">
                {summary?.income_count || 0} transactions
              </Box>
            </Box>
          </Box>

          <Box
            p={6}
            bg="white"
            borderRadius="lg"
            shadow="sm"
            border="1px"
            borderColor="gray.200"
          >
            <Box>
              <Box fontSize="sm" color="gray.600" mb={1}>
                Total Expenses
              </Box>
              <Box fontSize="2xl" fontWeight="bold" color="red.500">
                {isLoading
                  ? "..."
                  : formatCurrency(summary?.total_expenses || 0)}
              </Box>
              <Box fontSize="sm" color="gray.500">
                {summary?.expense_count || 0} transactions
              </Box>
            </Box>
          </Box>

          <Box
            p={6}
            bg="white"
            borderRadius="lg"
            shadow="sm"
            border="1px"
            borderColor="gray.200"
          >
            <Box>
              <Box fontSize="sm" color="gray.600" mb={1}>
                Net Balance
              </Box>
              <Box
                fontSize="2xl"
                fontWeight="bold"
                color={
                  summary?.net_amount && summary.net_amount >= 0
                    ? "green.500"
                    : "red.500"
                }
              >
                {isLoading ? "..." : formatCurrency(summary?.net_amount || 0)}
              </Box>
              <Box fontSize="sm" color="gray.500">
                {summary?.net_amount && summary.net_amount >= 0
                  ? "Surplus"
                  : "Deficit"}
              </Box>
            </Box>
          </Box>
        </SimpleGrid>

        {/* Category Breakdown */}
        {summary?.category_breakdown &&
          Object.keys(summary.category_breakdown).length > 0 && (
            <Box
              p={6}
              bg="white"
              borderRadius="lg"
              shadow="sm"
              border="1px"
              borderColor="gray.200"
            >
              <Heading size="md" mb={4}>
                Expenses by Category
              </Heading>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Category</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">
                      Amount
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {Object.entries(summary.category_breakdown)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([category, amount]) => (
                      <Table.Row key={category}>
                        <Table.Cell>{category}</Table.Cell>
                        <Table.Cell textAlign="right" color="red.500">
                          {formatCurrency(amount as number)}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}

        {/* Account Breakdown */}
        {summary?.account_breakdown &&
          Object.keys(summary.account_breakdown).length > 0 && (
            <Box
              p={6}
              bg="white"
              borderRadius="lg"
              shadow="sm"
              border="1px"
              borderColor="gray.200"
            >
              <Heading size="md" mb={4}>
                Balance by Account
              </Heading>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Account</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">
                      Balance
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {Object.entries(summary.account_breakdown)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([account, amount]) => (
                      <Table.Row key={account}>
                        <Table.Cell>{account}</Table.Cell>
                        <Table.Cell
                          textAlign="right"
                          color={
                            (amount as number) >= 0 ? "green.500" : "red.500"
                          }
                        >
                          {formatCurrency(amount as number)}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}

        {/* Detailed Transactions */}
        {detailedReport && (
          <Box
            p={6}
            bg="white"
            borderRadius="lg"
            shadow="sm"
            border="1px"
            borderColor="gray.200"
          >
            <Heading size="md" mb={4}>
              Transaction Details
            </Heading>
            <VStack gap={4} align="stretch">
              {/* Incomes */}
              {detailedReport.incomes && detailedReport.incomes.length > 0 && (
                <Box>
                  <Heading size="sm" mb={2}>
                    Income
                  </Heading>
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                        <Table.ColumnHeader>Source</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">
                          Amount
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {detailedReport.incomes.map((income: any) => (
                        <Table.Row key={income.id}>
                          <Table.Cell>
                            {new Date(income.received_at).toLocaleDateString(
                              "vi-VN",
                            )}
                          </Table.Cell>
                          <Table.Cell>{income.source}</Table.Cell>
                          <Table.Cell textAlign="right" color="green.500">
                            {formatCurrency(income.net_amount)}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}

              {/* Transactions */}
              {detailedReport.transactions &&
                detailedReport.transactions.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={2}>
                      Transactions
                    </Heading>
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Date</Table.ColumnHeader>
                          <Table.ColumnHeader>Type</Table.ColumnHeader>
                          <Table.ColumnHeader>Category</Table.ColumnHeader>
                          <Table.ColumnHeader>Note</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">
                            Amount
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {detailedReport.transactions.map((txn: any) => (
                          <Table.Row key={txn.id}>
                            <Table.Cell>
                              {new Date(txn.txn_date).toLocaleDateString(
                                "vi-VN",
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <Badge
                                colorPalette={
                                  txn.type === "in" ? "green" : "red"
                                }
                              >
                                {txn.type === "in" ? "Income" : "Expense"}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>{txn.category?.name || "-"}</Table.Cell>
                            <Table.Cell>{txn.note || "-"}</Table.Cell>
                            <Table.Cell
                              textAlign="right"
                              color={
                                txn.type === "in" ? "green.500" : "red.500"
                              }
                            >
                              {formatCurrency(txn.amount)}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
