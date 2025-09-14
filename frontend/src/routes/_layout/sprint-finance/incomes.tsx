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

import { IncomesService, SprintsService } from "@/client"
import AddIncome from "@/components/Incomes/AddIncome"
import { IncomeActionsMenu } from "@/components/Incomes/IncomeActionsMenu"

export const Route = createFileRoute("/_layout/sprint-finance/incomes")({
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

  const { data: sprints } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => SprintsService.readSprints(),
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

  const sprintsList =
    sprints?.data?.map((sprint: any) => ({
      id: sprint.id,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
    })) || []

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Incomes</Heading>
          <AddIncome sprints={sprintsList} />
        </HStack>

        {incomes?.data && incomes.data.length > 0 ? (
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Received Date</Table.ColumnHeader>
                <Table.ColumnHeader>Source</Table.ColumnHeader>
                <Table.ColumnHeader>Gross Amount</Table.ColumnHeader>
                <Table.ColumnHeader>Net Amount</Table.ColumnHeader>
                <Table.ColumnHeader>Currency</Table.ColumnHeader>
                <Table.ColumnHeader>Sprint</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {incomes.data.map((income: any) => {
                const sprint = sprints?.data?.find(
                  (s: any) => s.id === income.sprint_id,
                )

                return (
                  <Table.Row key={income.id}>
                    <Table.Cell>{income.received_at}</Table.Cell>
                    <Table.Cell>{income.source}</Table.Cell>
                    <Table.Cell>
                      <Text fontWeight="bold" color="gray.600">
                        {income.gross_amount.toLocaleString("vi-VN")}{" "}
                        {income.currency}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontWeight="bold" color="green.500">
                        {income.net_amount.toLocaleString("vi-VN")}{" "}
                        {income.currency}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>{income.currency}</Table.Cell>
                    <Table.Cell>
                      {sprint
                        ? `${sprint.start_date} - ${sprint.end_date}`
                        : "-"}
                    </Table.Cell>
                    <Table.Cell>
                      <IncomeActionsMenu
                        income={income}
                        sprints={sprintsList}
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
            <AddIncome sprints={sprintsList} />
          </VStack>
        )}
      </VStack>
    </Container>
  )
}
