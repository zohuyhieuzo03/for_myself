import { 
  Container, 
  Heading, 
  Table, 
  VStack,
  Text,
  Badge,
  HStack
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FiCalendar } from "react-icons/fi"

import { SprintsService } from "@/client"
import AddSprint from "@/components/Sprints/AddSprint"
import { SprintActionsMenu } from "@/components/Sprints/SprintActionsMenu"

export const Route = createFileRoute("/_layout/sprint-finance/sprints")({
  component: SprintsPage,
})

function SprintsPage() {
  const { data: sprints, isLoading, error } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => SprintsService.readSprints(),
  })

  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Sprints</Heading>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Sprints</Heading>
          <Text color="red.500">Error loading sprints</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Sprints</Heading>
          <AddSprint />
        </HStack>

        {sprints?.data && sprints.data.length > 0 ? (
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Start Date</Table.ColumnHeader>
                <Table.ColumnHeader>End Date</Table.ColumnHeader>
                <Table.ColumnHeader>Payday Anchor</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sprints.data.map((sprint: any) => (
                <Table.Row key={sprint.id}>
                  <Table.Cell>{sprint.start_date}</Table.Cell>
                  <Table.Cell>{sprint.end_date}</Table.Cell>
                  <Table.Cell>{sprint.payday_anchor}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={sprint.is_closed ? "red" : "green"}>
                      {sprint.is_closed ? "Closed" : "Active"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <SprintActionsMenu sprint={sprint} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        ) : (
          <VStack gap={4} py={8}>
            <FiCalendar size="48px" color="gray" />
            <Text color="gray.500" textAlign="center">
              No sprints found. Create your first sprint to start managing your budget.
            </Text>
            <AddSprint />
          </VStack>
        )}
      </VStack>
    </Container>
  )
}