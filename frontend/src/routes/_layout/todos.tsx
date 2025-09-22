import {
  Badge,
  Button,
  Container,
  EmptyState,
  Flex,
  Heading,
  HStack,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiCheckSquare, FiArchive } from "react-icons/fi"
import { z } from "zod"

import { TodosService, type TodoUpdate, type TodoStatus } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import PendingTodos from "@/components/Pending/PendingTodos"
import AddTodo from "@/components/Todos/AddTodo"
import { TodoActionsMenu } from "@/components/Todos/TodoActionsMenu"
import TodosKanban from "@/components/Todos/TodosKanban"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import useCustomToast from "@/hooks/useCustomToast"
import { formatDateTimeShort, handleError } from "@/utils"

const todosSearchSchema = z.object({
  page: z.number().optional().catch(1),
  view: z.enum(["table", "kanban"]).catch("kanban"),
})

const PER_PAGE = 5

function getTodosQueryOptions({ page }: { page: number | undefined }) {
  const currentPage = page || 1
  return {
    queryFn: () =>
      TodosService.readTodos({ skip: (currentPage - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["todos", { page: currentPage }],
  }
}

export const Route = createFileRoute("/_layout/todos")({
  component: Todos,
  validateSearch: (search) => todosSearchSchema.parse(search),
})

function TodosTable() {
  const navigate = useNavigate()
  const { page, view } = Route.useSearch()
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getTodosQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })


  const archiveTodoMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TodoStatus }) =>
      TodosService.updateTodoEndpoint({
        id,
        requestBody: { status } as TodoUpdate,
      }),
    onSuccess: () => {
      showSuccessToast("Todo archived successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  const handleArchiveTodo = (id: string) => {
    // Find the todo to check current status
    const todo = allTodos.find(t => t.id === id)
    if (!todo) return
    
    // Only call API if todo is not already archived
    if (todo.status === "archived") return
    
    archiveTodoMutation.mutate({ id, status: "archived" })
  }

  const setPage = (page: number) => {
    navigate({
      to: "/todos",
      search: { page, view },
    })
  }

  const setView = (newView: "table" | "kanban") => {
    navigate({
      to: "/todos",
      search: { page: newView === "table" ? page : undefined, view: newView },
    })
  }

  const allTodos = data?.data ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingTodos />
  }

  if (allTodos.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiCheckSquare />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any todos yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new todo to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Todo Management</Heading>
        <HStack gap={2}>
          <Button
            variant={view === "table" ? "solid" : "outline"}
            onClick={() => setView("table")}
          >
            Table View
          </Button>
          <Button
            variant={view === "kanban" ? "solid" : "outline"}
            onClick={() => setView("kanban")}
          >
            Kanban View
          </Button>
        </HStack>
      </Flex>
      
      <AddTodo />
      
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">ID</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Title</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Description</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Status</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Created At</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Updated At</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {allTodos?.map((todo) => (
            <Table.Row key={todo.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="sm">
                {todo.id}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {todo.title}
              </Table.Cell>
              <Table.Cell
                color={!todo.description ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {todo.description || "N/A"}
              </Table.Cell>
              <Table.Cell>
                <Badge
                  colorScheme={
                    todo.status === "done" 
                      ? "green" 
                      : todo.status === "archived" 
                      ? "gray" 
                      : todo.status === "planning"
                      ? "blue"
                      : todo.status === "backlog"
                      ? "purple"
                      : "orange"
                  }
                  bg={
                    todo.status === "done" 
                      ? "green.500" 
                      : todo.status === "archived" 
                      ? "gray.500" 
                      : todo.status === "planning"
                      ? "blue.500"
                      : todo.status === "backlog"
                      ? "purple.500"
                      : "orange.500"
                  }
                  color="white"
                >
                  {todo.status === "done" 
                    ? "Done" 
                    : todo.status === "archived" 
                    ? "Archived" 
                    : todo.status === "planning"
                    ? "Planning"
                    : todo.status === "backlog"
                    ? "Backlog"
                    : "Todo"}
                </Badge>
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {formatDateTimeShort(todo.created_at)}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {formatDateTimeShort(todo.updated_at)}
              </Table.Cell>
              <Table.Cell>
                <HStack gap={1}>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="gray"
                    onClick={() => handleArchiveTodo(todo.id)}
                    disabled={archiveTodoMutation.isPending}
                    title="Archive todo"
                  >
                    <FiArchive fontSize="12px" />
                  </Button>
                  <TodoActionsMenu todo={todo} />
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Todos() {
  const navigate = useNavigate()
  const { view, page } = Route.useSearch()
  
  const setView = (newView: "table" | "kanban") => {
    navigate({
      to: "/todos",
      search: { page: newView === "table" ? page : undefined, view: newView },
    })
  }
  
  if (view === "kanban") {
    return <TodosKanban viewMode={view} onViewModeChange={setView} />
  }
  
  return (
    <Container maxW="full">
      <TodosTable />
    </Container>
  )
}
