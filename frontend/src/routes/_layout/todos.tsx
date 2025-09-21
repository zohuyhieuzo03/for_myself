import {
  Badge,
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiCheckSquare } from "react-icons/fi"
import { z } from "zod"

import { TodosService, type TodoUpdate, type TodoStatus } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import PendingTodos from "@/components/Pending/PendingTodos"
import AddTodo from "@/components/Todos/AddTodo"
import { TodoActionsMenu } from "@/components/Todos/TodoActionsMenu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import useCustomToast from "@/hooks/useCustomToast"
import { formatDateTimeShort, handleError } from "@/utils"

const todosSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getTodosQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      TodosService.readTodos({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["todos", { page }],
  }
}

export const Route = createFileRoute("/_layout/todos")({
  component: Todos,
  validateSearch: (search) => todosSearchSchema.parse(search),
})

function TodosTable() {
  const navigate = useNavigate()
  const { page } = Route.useSearch()
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getTodosQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const updateTodoStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TodoStatus }) =>
      TodosService.updateTodoEndpoint({
        id,
        requestBody: { status } as TodoUpdate,
      }),
    onSuccess: () => {
      showSuccessToast("Todo status updated successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  const handleToggleTodo = (id: string, currentStatus: TodoStatus) => {
    const newStatus = currentStatus === "done" ? "todo" : "done"
    updateTodoStatusMutation.mutate({ id, status: newStatus })
  }

  const setPage = (page: number) => {
    navigate({
      to: "/todos",
      search: { page },
    })
  }

  const todos = data?.data ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingTodos />
  }

  if (todos.length === 0) {
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
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="xs">Done</Table.ColumnHeader>
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
          {todos?.map((todo) => (
            <Table.Row key={todo.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell>
                <Checkbox
                  checked={todo.status === "done"}
                  onCheckedChange={() =>
                    handleToggleTodo(todo.id, todo.status || "todo")
                  }
                  disabled={updateTodoStatusMutation.isPending}
                  colorScheme="green"
                  size="md"
                />
              </Table.Cell>
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
                <TodoActionsMenu todo={todo} />
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
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Todo Management
      </Heading>
      <AddTodo />
      <TodosTable />
    </Container>
  )
}
