import { 
  Box, 
  Card, 
  Container, 
  Grid, 
  HStack, 
  Heading, 
  Text,
  VStack 
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiCalendar,
  FiCreditCard,
  FiTag,
  FiTarget
} from "react-icons/fi"

import { 
  SprintsService, 
  AccountsService, 
  CategoriesService, 
  TransactionsService,
  IncomesService,
  AllocationRulesService 
} from "@/client"

const FinancialDashboard = () => {
  // Fetch data for dashboard
  const { data: sprints } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => SprintsService.readSprints(),
  })

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => AccountsService.readAccounts(),
  })

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesService.readCategories(),
  })

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => TransactionsService.readTransactions(),
  })

  const { data: incomes } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => IncomesService.readIncomes(),
  })

  const { data: allocationRules } = useQuery({
    queryKey: ["allocation-rules"],
    queryFn: () => AllocationRulesService.readAllocationRules(),
  })

  // Calculate summary statistics
  const totalIncome = incomes?.data?.reduce((sum: number, income: any) => sum + income.net_amount, 0) || 0
  const totalExpenses = transactions?.data?.filter((t: any) => t.type === "out").reduce((sum: number, txn: any) => sum + txn.amount, 0) || 0
  const netWorth = totalIncome - totalExpenses
  const activeSprints = sprints?.data?.filter((sprint: any) => !sprint.is_closed).length || 0
  const activeAccounts = accounts?.data?.filter((account: any) => account.is_active).length || 0
  const envelopeCategories = categories?.data?.filter((category: any) => category.is_envelope).length || 0
  const totalAllocationRules = allocationRules?.data?.length || 0

  // Calculate spending by category group
  const spendingByGroup = categories?.data?.reduce((acc: Record<string, number>, category: any) => {
    const categoryTransactions = transactions?.data?.filter(
      (t: any) => t.category_id === category.id && t.type === "out"
    ) || []
    const categorySpending = categoryTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    
    if (!acc[category.grp]) {
      acc[category.grp] = 0
    }
    acc[category.grp] += categorySpending
    
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <Container maxW="full" py={6}>
      <VStack gap={6} align="stretch">
        <Heading size="lg" color="fg.emphasized">
          Financial Dashboard
        </Heading>

        {/* Summary Stats */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
          <Card.Root>
            <Card.Body>
              <HStack>
                <FiDollarSign size="24px" color="green" />
                <Box>
                  <Text fontSize="sm" color="gray.600">Total Income</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {totalIncome.toLocaleString('vi-VN')} VND
                  </Text>
                  <Text fontSize="xs" color="gray.500">Net amount received</Text>
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <HStack>
                <FiTrendingDown size="24px" color="red" />
                <Box>
                  <Text fontSize="sm" color="gray.600">Total Expenses</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="red.500">
                    {totalExpenses.toLocaleString('vi-VN')} VND
                  </Text>
                  <Text fontSize="xs" color="gray.500">Total spending</Text>
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <HStack>
                <FiTrendingUp size="24px" color={netWorth >= 0 ? "green" : "red"} />
                <Box>
                  <Text fontSize="sm" color="gray.600">Net Worth</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={netWorth >= 0 ? "green.500" : "red.500"}>
                    {netWorth.toLocaleString('vi-VN')} VND
                  </Text>
                  <Text fontSize="xs" color="gray.500">Income - Expenses</Text>
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <HStack>
                <FiCalendar size="24px" color="blue" />
                <Box>
                  <Text fontSize="sm" color="gray.600">Active Sprints</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {activeSprints}
                  </Text>
                  <Text fontSize="xs" color="gray.500">Open budget periods</Text>
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>
        </Grid>

        {/* Account & Category Overview */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
          <Card.Root>
            <Card.Header>
              <Heading size="md">Account Overview</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={3} align="stretch">
                <HStack justify="space-between">
                  <HStack>
                    <FiCreditCard size="20px" />
                    <Text>Active Accounts</Text>
                  </HStack>
                  <Text fontWeight="bold">{activeAccounts}</Text>
                </HStack>
                <HStack justify="space-between">
                  <HStack>
                    <FiTag size="20px" />
                    <Text>Envelope Categories</Text>
                  </HStack>
                  <Text fontWeight="bold">{envelopeCategories}</Text>
                </HStack>
                <HStack justify="space-between">
                  <HStack>
                    <FiTarget size="20px" />
                    <Text>Allocation Rules</Text>
                  </HStack>
                  <Text fontWeight="bold">{totalAllocationRules}</Text>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="md">Spending by Category Group</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={3} align="stretch">
                {Object.entries(spendingByGroup).map(([group, amount]: [string, any]) => (
                  <HStack key={group} justify="space-between">
                    <Text textTransform="capitalize">{group.replace('_', ' ')}</Text>
                    <Text fontWeight="bold" color="red.500">
                      {amount.toLocaleString('vi-VN')} VND
                    </Text>
                  </HStack>
                ))}
                {Object.keys(spendingByGroup).length === 0 && (
                  <Text color="gray.500" textAlign="center">
                    No spending data available
                  </Text>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        </Grid>

        {/* Recent Activity */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">Recent Transactions</Heading>
          </Card.Header>
          <Card.Body>
            {transactions?.data?.slice(0, 5).map((transaction: any) => (
              <HStack key={transaction.id} justify="space-between" py={2} borderBottom="1px" borderColor="gray.200">
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium">{transaction.merchant || "Unknown"}</Text>
                  <Text fontSize="sm" color="gray.600">{transaction.txn_date}</Text>
                </VStack>
                <VStack align="end" gap={1}>
                  <Text 
                    fontWeight="bold" 
                    color={transaction.type === "in" ? "green.500" : "red.500"}
                  >
                    {transaction.type === "in" ? "+" : "-"}{transaction.amount.toLocaleString('vi-VN')} VND
                  </Text>
                  <Text fontSize="sm" color="gray.600">{transaction.currency}</Text>
                </VStack>
              </HStack>
            ))}
            {(!transactions?.data || transactions.data.length === 0) && (
              <Text color="gray.500" textAlign="center" py={4}>
                No transactions found
              </Text>
            )}
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  )
}

export default FinancialDashboard
