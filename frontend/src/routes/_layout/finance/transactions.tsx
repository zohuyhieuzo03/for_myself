import {
  Badge,
  Button,
  Container,
  Heading,
  HStack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { FiTrendingUp, FiArrowUp, FiArrowDown } from "react-icons/fi"

import {
  AccountsService,
  CategoriesService,
  TransactionsService,
} from "@/client"
import AddTransaction from "@/components/Transactions/AddTransaction"
import { TransactionActionsMenu } from "@/components/Transactions/TransactionActionsMenu"

export const Route = createFileRoute("/_layout/finance/transactions")({
  component: TransactionsPage,
})

type SortDirection = "asc" | "desc" | null

function TransactionsPage() {
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  
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

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesService.readCategories(),
  })

  // Sort transactions by date
  const sortedTransactions = useMemo(() => {
    if (!transactions?.data) {
      return []
    }

    return [...transactions.data].sort((a, b) => {
      const dateA = new Date(a.txn_date)
      const dateB = new Date(b.txn_date)
      
      if (sortDirection === "asc") {
        return dateA.getTime() - dateB.getTime()
      } else {
        // Default to desc (newest first)
        return dateB.getTime() - dateA.getTime()
      }
    })
  }, [transactions?.data, sortDirection])

  const handleSort = () => {
    if (sortDirection === "desc") {
      setSortDirection("asc") // Switch to oldest first
    } else if (sortDirection === "asc") {
      setSortDirection(null) // No sorting
    } else {
      setSortDirection("desc") // Back to newest first
    }
  }

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Transactions</Heading>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Transactions</Heading>
          <Text color="red.500">Error loading transactions</Text>
        </VStack>
      </Container>
    )
  }

  const accountsList =
    accounts?.data?.map((acc: any) => ({ id: acc.id, name: acc.name })) || []
  const categoriesList =
    categories?.data?.map((cat: any) => ({ id: cat.id, name: cat.name })) || []

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Transactions</Heading>
          <AddTransaction
            accounts={accountsList}
            categories={categoriesList}
          />
        </HStack>

        {sortedTransactions && sortedTransactions.length > 0 ? (
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>
                  <HStack gap={2}>
                    <Text>Date</Text>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleSort}
                      colorPalette="gray"
                    >
                      {sortDirection === null && <FiArrowUp />}
                      {sortDirection === "asc" && <FiArrowUp />}
                      {sortDirection === "desc" && <FiArrowDown />}
                    </Button>
                  </HStack>
                </Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Amount</Table.ColumnHeader>
                <Table.ColumnHeader>Merchant</Table.ColumnHeader>
                <Table.ColumnHeader>Account</Table.ColumnHeader>
                <Table.ColumnHeader>Category</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sortedTransactions.map((transaction: any) => {
                const account = accounts?.data?.find(
                  (acc: any) => acc.id === transaction.account_id,
                )
                const category = categories?.data?.find(
                  (cat: any) => cat.id === transaction.category_id,
                )

                return (
                  <Table.Row key={transaction.id}>
                    <Table.Cell>{transaction.txn_date}</Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={
                          transaction.type === "in" ? "green" : "red"
                        }
                      >
                        {transaction.type === "in" ? "Income" : "Expense"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text
                        color={
                          transaction.type === "in" ? "green.500" : "red.500"
                        }
                        fontWeight="bold"
                      >
                        {transaction.type === "in" ? "+" : "-"}
                        {transaction.amount.toLocaleString("vi-VN")}{" "}
                        {transaction.currency}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>{transaction.merchant || "-"}</Table.Cell>
                    <Table.Cell>{account?.name || "-"}</Table.Cell>
                    <Table.Cell>{category?.name || "-"}</Table.Cell>
                    <Table.Cell>
                      <TransactionActionsMenu
                        transaction={transaction}
                        accounts={accountsList}
                        categories={categoriesList}
                      />
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table.Root>
        ) : (
          <VStack gap={4} py={8}>
            <FiTrendingUp size="48px" color="gray" />
            <Text color="gray.500" textAlign="center">
              No transactions found. Create your first transaction to start
              tracking your spending.
            </Text>
            <AddTransaction
              accounts={accountsList}
              categories={categoriesList}
            />
          </VStack>
        )}
      </VStack>
    </Container>
  )
}
