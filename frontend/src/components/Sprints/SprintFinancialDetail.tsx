import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  FiActivity,
  FiArrowLeft,
  FiBarChart,
  FiCalendar,
  FiCreditCard,
  FiDollarSign,
  FiPieChart,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi"

import { SprintsService } from "@/client"

interface SprintFinancialDetailProps {
  sprintId: string
}

const SprintFinancialDetail = ({ sprintId }: SprintFinancialDetailProps) => {
  // Fetch sprint detail with all related financial data
  const {
    data: sprintDetail,
    isLoading: sprintLoading,
    error: sprintError,
  } = useQuery({
    queryKey: ["sprint-detail", sprintId],
    queryFn: () => SprintsService.readSprintDetail({ sprintId }),
  })

  if (sprintLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Sprint Financial Detail</Heading>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    )
  }

  if (sprintError || !sprintDetail) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Sprint Financial Detail</Heading>
          <Text color="red.500">Error loading sprint data</Text>
          <Link to="/sprint-finance/sprints">
            <Button variant="outline">Back to Sprints</Button>
          </Link>
        </VStack>
      </Container>
    )
  }

  // Extract data from sprintDetail
  const sprint = sprintDetail
  const sprintTransactions = sprintDetail.transactions || []
  const accounts = sprintDetail.accounts || []
  const categories = sprintDetail.categories || []
  const financialSummary = sprintDetail.financial_summary || {}

  // Use pre-calculated financial metrics from backend
  const totalIncome = Number(financialSummary.total_income) || 0
  const totalExpenses = Number(financialSummary.total_expenses) || 0
  const netCashFlow = Number(financialSummary.net_cash_flow) || 0
  const averageDailySpending = Number(financialSummary.average_daily_spending) || 0
  const totalAllocated = Number(financialSummary.total_allocated) || 0
  const budgetUtilization = Number(financialSummary.budget_utilization) || 0

  // Use pre-calculated spending data from backend
  const spendingByCategory = financialSummary.spending_by_category || {}
  const spendingByAccount = financialSummary.spending_by_account || {}

  // Calculate sprint progress
  const sprintStart = new Date(sprint.start_date)
  const sprintEnd = new Date(sprint.end_date)
  const today = new Date()
  const totalDays = Math.ceil(
    (sprintEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24),
  )
  const daysElapsed = Math.min(
    Math.ceil(
      (today.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24),
    ),
    totalDays,
  )
  const sprintProgress = Math.min((daysElapsed / totalDays) * 100, 100)

  return (
    <Container maxW="full" py={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack gap={4}>
            <Link to="/sprint-finance/sprints">
              <Button variant="ghost" size="sm">
                <FiArrowLeft />
              </Button>
            </Link>
            <VStack align="start" gap={1}>
              <Heading size="lg" color="fg.emphasized">
                Sprint Financial Detail
              </Heading>
              <HStack gap={2}>
                <Text fontSize="sm" color="gray.600">
                  {sprint.start_date} - {sprint.end_date}
                </Text>
                <Badge colorPalette={sprint.is_closed ? "red" : "green"}>
                  {sprint.is_closed ? "Closed" : "Active"}
                </Badge>
              </HStack>
            </VStack>
          </HStack>
        </HStack>

        {/* Sprint Progress */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <FiCalendar />
              <Heading size="md">Sprint Progress</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <VStack gap={4}>
              <HStack justify="space-between" w="full">
                <Text>
                  Progress: {daysElapsed}/{totalDays} days
                </Text>
                <Text fontWeight="bold">{sprintProgress.toFixed(1)}%</Text>
              </HStack>
              <Box w="full" bg="gray.200" rounded="full" h={2}>
                <Box
                  bg="blue.500"
                  h={2}
                  rounded="full"
                  transition="width 0.3s ease"
                  style={{ width: `${sprintProgress}%` }}
                />
              </Box>
              <HStack gap={8} fontSize="sm" color="gray.600">
                <Text>Start: {sprint.start_date}</Text>
                <Text>Payday: {sprint.payday_anchor}</Text>
                <Text>End: {sprint.end_date}</Text>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Key Financial Metrics */}
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          }}
          gap={4}
        >
          <Card.Root>
            <Card.Body>
              <VStack align="start" gap={2}>
                <HStack>
                  <FiDollarSign color="green" />
                  <Text fontSize="sm" color="gray.600">
                    Total Income
                  </Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {totalIncome.toLocaleString()} VND
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack align="start" gap={2}>
                <HStack>
                  <FiTrendingDown color="red" />
                  <Text fontSize="sm" color="gray.600">
                    Total Expenses
                  </Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">
                  {totalExpenses.toLocaleString()} VND
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack align="start" gap={2}>
                <HStack>
                  <FiTrendingUp color="blue" />
                  <Text fontSize="sm" color="gray.600">
                    Net Cash Flow
                  </Text>
                </HStack>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color={netCashFlow >= 0 ? "green.500" : "red.500"}
                >
                  {netCashFlow >= 0 ? "+" : ""}
                  {netCashFlow.toLocaleString()} VND
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack align="start" gap={2}>
                <HStack>
                  <FiActivity />
                  <Text fontSize="sm" color="gray.600">
                    Avg Daily Spending
                  </Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold">
                  {averageDailySpending.toLocaleString()} VND
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Grid>

        {/* Budget vs Actual */}
        {Number(totalAllocated) > 0 && (
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
            <Card.Root>
              <Card.Header>
                <HStack>
                  <FiTarget />
                  <Heading size="md">Budget vs Actual</Heading>
                </HStack>
              </Card.Header>
              <Card.Body>
                <VStack gap={4}>
                  <HStack justify="space-between" w="full">
                    <Text>
                      Allocated: {totalAllocated.toLocaleString()} VND
                    </Text>
                    <Text>
                      Spent: {totalExpenses.toLocaleString()} VND
                    </Text>
                  </HStack>
                  <Box w="full" bg="gray.200" rounded="full" h={2}>
                    <Box
                      bg={
                        budgetUtilization > 100
                          ? "red.500"
                          : budgetUtilization > 80
                            ? "orange.500"
                            : "green.500"
                      }
                      h={2}
                      rounded="full"
                      transition="width 0.3s ease"
                      style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                    />
                  </Box>
                  <Text fontSize="sm" color="gray.600">
                    {budgetUtilization.toFixed(1)}% of budget used
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <HStack>
                  <FiBarChart />
                  <Heading size="md">Spending by Category</Heading>
                </HStack>
              </Card.Header>
              <Card.Body>
                <VStack gap={2} align="stretch">
                  {Object.entries(spendingByCategory)
                    .sort(([, a], [, b]) => b.amount - a.amount)
                    .slice(0, 5)
                    .map(([categoryId, data]) => (
                      <HStack key={categoryId} justify="space-between">
                        <HStack gap={2}>
                          <Box w={3} h={3} bg="blue.500" rounded="full" />
                          <Text fontSize="sm">{data.name}</Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium">
                          {data.amount.toLocaleString()} VND
                        </Text>
                      </HStack>
                    ))}
                  {Object.keys(spendingByCategory).length === 0 && (
                    <Text color="gray.500" textAlign="center" py={4}>
                      No spending data for this sprint
                    </Text>
                  )}
                </VStack>
              </Card.Body>
            </Card.Root>
          </Grid>
        )}

        {/* Account Performance */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <FiCreditCard />
              <Heading size="md">Account Performance</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align="stretch">
              {Object.entries(spendingByAccount).length > 0 ? (
                Object.entries(spendingByAccount).map(([accountId, data]) => (
                  <Box
                    key={accountId}
                    p={4}
                    border="1px"
                    borderColor="gray.200"
                    rounded="md"
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="medium">{data.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        Type: {data.type}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Net Change
                      </Text>
                      <Text
                        fontWeight="bold"
                        color={data.amount >= 0 ? "green.500" : "red.500"}
                      >
                        {data.amount >= 0 ? "+" : ""}
                        {data.amount.toLocaleString()} VND
                      </Text>
                    </HStack>
                  </Box>
                ))
              ) : (
                <Text color="gray.500" textAlign="center" py={4}>
                  No account activity for this sprint
                </Text>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Recent Transactions */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <FiPieChart />
              <Heading size="md">Recent Transactions</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <VStack gap={2} align="stretch">
              {sprintTransactions.slice(0, 10).map((transaction: any) => {
                const category = categories.find(
                  (c: any) => c.id === transaction.category_id,
                )
                const account = accounts.find(
                  (a: any) => a.id === transaction.account_id,
                )

                return (
                  <HStack
                    key={transaction.id}
                    justify="space-between"
                    py={2}
                    borderBottom="1px"
                    borderColor="gray.100"
                  >
                    <VStack align="start" gap={1}>
                      <Text fontWeight="medium">
                        {transaction.merchant || "Unknown"}
                      </Text>
                      <HStack gap={2} fontSize="sm" color="gray.600">
                        <Text>{category?.name || "Uncategorized"}</Text>
                        <Text>•</Text>
                        <Text>{account?.name || "Unknown Account"}</Text>
                        <Text>•</Text>
                        <Text>{transaction.txn_date}</Text>
                      </HStack>
                    </VStack>
                    <VStack align="end" gap={1}>
                      <Text
                        fontWeight="bold"
                        color={
                          transaction.type === "in" ? "green.500" : "red.500"
                        }
                      >
                        {transaction.type === "in" ? "+" : "-"}
                        {transaction.amount.toLocaleString()} VND
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {transaction.currency}
                      </Text>
                    </VStack>
                  </HStack>
                )
              })}
              {sprintTransactions.length === 0 && (
                <Text color="gray.500" textAlign="center" py={4}>
                  No transactions for this sprint period
                </Text>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  )
}

export default SprintFinancialDetail
