import {
  Container,
  Heading,
  HStack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FiTrendingUp } from "react-icons/fi"

import { IncomesService } from "@/client"
import AddIncome from "@/components/Incomes/AddIncome"
import { IncomeActionsMenu } from "@/components/Incomes/IncomeActionsMenu"

export const Route = createFileRoute("/_layout/finance/incomes")({
  component: IncomesPage,
})

function IncomesPage() {
  const {
    data: incomes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => IncomesService.readIncomes(),
  })

  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Incomes</Heading>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Incomes</Heading>
          <Text color="red.500">Error loading incomes</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Incomes</Heading>
          <AddIncome />
        </HStack>

        {incomes?.data && incomes.data.length > 0 ? (
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Received Date</Table.ColumnHeader>
                <Table.ColumnHeader>Source</Table.ColumnHeader>
                <Table.ColumnHeader>Amount</Table.ColumnHeader>
                <Table.ColumnHeader>Currency</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {incomes.data.map((income: any) => {
                return (
                  <Table.Row key={income.id}>
                    <Table.Cell>{income.received_at}</Table.Cell>
                    <Table.Cell>{income.source}</Table.Cell>
                    <Table.Cell>
                      <Text fontWeight="bold" color="green.600">
                        {Number(income.amount ?? 0).toLocaleString("vi-VN")} {" "}
                        {income.currency}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>{income.currency}</Table.Cell>
                    <Table.Cell>
                      <IncomeActionsMenu
                        income={income}
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
              No incomes found. Create your first income to start tracking your
              earnings.
            </Text>
            <AddIncome />
          </VStack>
        )}
      </VStack>
    </Container>
  )
}
