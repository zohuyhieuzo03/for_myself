import {
  Badge,
  Container,
  Heading,
  HStack,
  IconButton,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FiTarget } from "react-icons/fi"
import { AllocationRulesService, SprintsService } from "@/client"
import AddAllocationRule from "@/components/AllocationRules/AddAllocationRule"
import DeleteAllocationRule from "@/components/AllocationRules/DeleteAllocationRule"
import EditAllocationRule from "@/components/AllocationRules/EditAllocationRule"
import { MenuContent, MenuRoot, MenuTrigger } from "@/components/ui/menu"

export const Route = createFileRoute(
  "/_layout/sprint-finance/allocation-rules",
)({
  component: AllocationRulesPage,
})

const AllocationRuleActionsMenu = ({
  allocationRule,
  sprints,
}: {
  allocationRule: any
  sprints: Array<{ id: string; start_date: string; end_date: string }>
}) => (
  <MenuRoot>
    <MenuTrigger asChild>
      <IconButton variant="ghost" color="inherit">
        <BsThreeDotsVertical />
      </IconButton>
    </MenuTrigger>
    <MenuContent>
      <EditAllocationRule allocationRule={allocationRule} sprints={sprints} />
      <DeleteAllocationRule id={allocationRule.id} />
    </MenuContent>
  </MenuRoot>
)

function AllocationRulesPage() {
  const {
    data: allocationRules,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allocation-rules"],
    queryFn: () => AllocationRulesService.readAllocationRules(),
  })

  const { data: sprints } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => SprintsService.readSprints(),
  })

  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Allocation Rules</Heading>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Allocation Rules</Heading>
          <Text color="red.500">Error loading allocation rules</Text>
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
          <Heading>Allocation Rules</Heading>
          <AddAllocationRule sprints={sprintsList} />
        </HStack>

        {allocationRules?.data && allocationRules.data.length > 0 ? (
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Group</Table.ColumnHeader>
                <Table.ColumnHeader>Percentage</Table.ColumnHeader>
                <Table.ColumnHeader>Sprint</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {allocationRules.data.map((rule: any) => {
                const sprint = sprints?.data?.find(
                  (s: any) => s.id === rule.sprint_id,
                )

                return (
                  <Table.Row key={rule.id}>
                    <Table.Cell>
                      <Badge
                        colorPalette={
                          rule.grp === "needs"
                            ? "green"
                            : rule.grp === "wants"
                              ? "blue"
                              : "purple"
                        }
                      >
                        {rule.grp.charAt(0).toUpperCase() +
                          rule.grp.slice(1).replace("_", " ")}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontWeight="bold">{rule.percent}%</Text>
                    </Table.Cell>
                    <Table.Cell>
                      {sprint
                        ? `${sprint.start_date} - ${sprint.end_date}`
                        : "-"}
                    </Table.Cell>
                    <Table.Cell>
                      <AllocationRuleActionsMenu
                        allocationRule={rule}
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
            <FiTarget size="48px" color="gray" />
            <Text color="gray.500" textAlign="center">
              No allocation rules found. Create your first allocation rule to
              set budget percentages.
            </Text>
            <AddAllocationRule sprints={sprintsList} />
          </VStack>
        )}
      </VStack>
    </Container>
  )
}
