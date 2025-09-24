import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  EmptyState,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useDndContext } from "@dnd-kit/core"
import { FiArchive, FiCheckSquare } from "react-icons/fi"

import {
  type TodoPublic,
  type TodoStatus,
  TodosService,
  type TodoUpdate,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import PendingTodos from "@/components/Pending/PendingTodos"
import AddTodo from "@/components/Todos/AddTodo"
import TodoDetailDialog from "@/components/Todos/TodoDetailDialog"
import { TodoActionsMenu } from "@/components/Todos/TodoActionsMenu"
import useCustomToast from "@/hooks/useCustomToast"
import { formatDateTimeShort, handleError } from "@/utils"

interface TodosKanbanProps {
  viewMode: "table" | "kanban"
  onViewModeChange: (mode: "table" | "kanban") => void
}

const STATUS_COLUMNS: Array<{
  status: TodoStatus
  title: string
  color: string
  bgColor: string
}> = [
  {
    status: "backlog",
    title: "Backlog",
    color: "white",
    bgColor: "purple.500",
  },
  { status: "todo", title: "To Do", color: "white", bgColor: "orange.500" },
  {
    status: "planning",
    title: "Planning",
    color: "white",
    bgColor: "blue.500",
  },
  { status: "doing", title: "Doing", color: "white", bgColor: "teal.500" },
  { status: "done", title: "Done", color: "white", bgColor: "green.500" },
]

// Higher number means higher priority for sorting (desc)
const PRIORITY_WEIGHT: Record<NonNullable<TodoPublic["priority"]>, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function compareTodosByPriority(a: TodoPublic, b: TodoPublic): number {
  const wa = a.priority ? PRIORITY_WEIGHT[a.priority] : 0
  const wb = b.priority ? PRIORITY_WEIGHT[b.priority] : 0
  if (wb !== wa) return wb - wa // higher priority first
  // fallback: newer first by created_at
  const ta = new Date(a.created_at).getTime()
  const tb = new Date(b.created_at).getTime()
  return tb - ta
}

function getTodosQueryOptions() {
  return {
    queryFn: () => TodosService.readTodos({ skip: 0, limit: 1000 }), // Get all todos for kanban
    queryKey: ["todos", "kanban"],
  }
}

function DraggableTodoCard({ todo, onOpen }: { todo: TodoPublic; onOpen: (todo: TodoPublic) => void }) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

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

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Only call API if todo is not already archived
    if (todo.status === "archived") return

    archiveTodoMutation.mutate({ id: todo.id, status: "archived" })
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onOpen(todo)}>
      <Card.Root
        size="sm"
        variant="outline"
        cursor="grab"
        _hover={{ shadow: "md" }}
        transition="all 0.2s"
        _active={{ cursor: "grabbing" }}
      >
        <Card.Body p={3}>
          <VStack align="stretch" gap={2}>
            <Flex justify="space-between" align="start">
              <Text
                fontWeight="medium"
                fontSize="sm"
                overflow="hidden"
                textOverflow="ellipsis"
                display="-webkit-box"
                style={{ WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                wordBreak="break-word"
              >
                {todo.title}
              </Text>
              <HStack gap={1}>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={handleArchive}
                  disabled={archiveTodoMutation.isPending}
                  title="Archive todo"
                >
                  <FiArchive fontSize="12px" />
                </Button>
                <TodoActionsMenu todo={todo} />
              </HStack>
            </Flex>

            {todo.description && (
              <Text
                fontSize="xs"
                color="gray.600"
                overflow="hidden"
                textOverflow="ellipsis"
                display="-webkit-box"
                style={{ WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
              >
                {todo.description}
              </Text>
            )}

            {/* Type, Priority and Estimate */}
            <HStack gap={2} flexWrap="wrap">
              {todo.type && (
                <Badge
                  size="sm"
                  colorPalette={
                    todo.type === "work" ? "blue" :
                    todo.type === "learning" ? "purple" :
                    todo.type === "daily_life" ? "green" :
                    todo.type === "health" ? "pink" :
                    todo.type === "finance" ? "yellow" :
                    todo.type === "personal" ? "orange" : "gray"
                  }
                  variant="subtle"
                >
                  {todo.type === "daily_life" ? "Daily Life" : 
                   todo.type === "health" ? "Health" :
                   todo.type === "finance" ? "Finance" :
                   todo.type === "personal" ? "Personal" :
                   todo.type === "learning" ? "Learning" :
                   todo.type === "work" ? "Work" :
                   todo.type === "task" ? "Task" : "Other"}
                </Badge>
              )}
              {todo.priority && (
                <Badge
                  size="sm"
                  colorPalette={
                    todo.priority === "urgent" ? "red" :
                    todo.priority === "high" ? "orange" :
                    todo.priority === "medium" ? "blue" : "gray"
                  }
                  variant="subtle"
                >
                  {todo.priority}
                </Badge>
              )}
              {todo.estimate_minutes && (
                <Badge size="sm" colorPalette="green" variant="subtle">
                  {todo.estimate_minutes}m
                </Badge>
              )}
            </HStack>

            {/* Checklist hidden in Kanban; available in Detail Dialog */}

            <HStack justify="space-between" fontSize="xs" color="gray.500">
              <Text>{formatDateTimeShort(todo.created_at)}</Text>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </div>
  )
}

function KanbanColumn({
  status,
  title,
  color,
  bgColor,
  todos,
  onOpen,
}: {
  status: TodoStatus
  title: string
  color: string
  bgColor: string
  todos: TodoPublic[]
  onOpen: (todo: TodoPublic) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })
  const { over } = useDndContext()
  const isOverColumn =
    isOver ||
    (over?.id != null && (over.id === status || todos.some((t) => t.id === (over.id as string))))

  return (
    <VStack align="stretch" gap={3} ref={setNodeRef}>
      <Box
        bg={bgColor}
        color={color}
        p={3}
        borderRadius="md"
        textAlign="center"
      >
        <HStack justify="center" gap={2}>
          <Text fontWeight="bold" fontSize="sm">
            {title}
          </Text>
          <Badge colorScheme="whiteAlpha" variant="solid">
            {todos.length}
          </Badge>
        </HStack>
      </Box>

      <VStack
        align="stretch"
        gap={2}
        flex="1"
        p={2}
        borderRadius="md"
        bg={isOverColumn ? "blue.50" : "transparent"}
        border={isOverColumn ? "2px dashed" : "2px dashed transparent"}
        borderColor={isOverColumn ? "blue.300" : "transparent"}
        transition="all 0.2s"
        ref={setNodeRef}
        minH="200px"
      >
        {todos.length === 0 ? (
          <Box
            p={4}
            border="2px dashed"
            borderColor="gray.200"
            borderRadius="md"
            textAlign="center"
          >
            <Text fontSize="sm" color="gray.500">
              {isOver ? "Drop here" : "No todos"}
            </Text>
          </Box>
        ) : (
          <SortableContext
            items={todos.map((todo) => todo.id)}
            strategy={verticalListSortingStrategy}
          >
            {todos.map((todo) => (
              <DraggableTodoCard key={todo.id} todo={todo} onOpen={onOpen} />
            ))}
          </SortableContext>
        )}
      </VStack>
    </VStack>
  )
}

export default function TodosKanban({
  viewMode,
  onViewModeChange,
  selectedId,
  onSelectedIdChange,
}: TodosKanbanProps & { selectedId: string | null; onSelectedIdChange: (id: string | null) => void }) {
  const { data, isLoading } = useQuery(getTodosQueryOptions())
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

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

  const todos = data?.data ?? []
  const selectedTodo = useMemo(() => todos.find((t) => t.id === selectedId) ?? null, [todos, selectedId])
  // Dialog open is derived from URL id via selectedTodo

  // Filter out archived todos
  const activeTodos = todos.filter((todo) => todo.status !== "archived")

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const todoId = active.id as string
    const overId = String(over.id)

    // Resolve target status whether dropping on column (status id) or on a card (todo id)
    let newStatus: TodoStatus | null = null
    if (STATUS_COLUMNS.some((c) => c.status === overId)) {
      newStatus = overId as TodoStatus
    } else {
      const overTodo = todos.find((t) => t.id === overId)
      if (!overTodo) return
      newStatus = (overTodo.status ?? "todo") as TodoStatus
    }

    // Find the todo to get current status
    const todo = todos.find((t) => t.id === todoId)
    if (!todo) return

    // Only call API if status actually changed
    if (!newStatus || todo.status === newStatus) return

    // Prevent moving to done if any checklist item is not completed
    if (
      newStatus === "done" &&
      (todo.checklist_items?.some((item) => !item.is_completed) ?? false)
    ) {
      handleError({
        message: "Complete all checklist items before marking as done.",
        status: 400,
        name: "ChecklistIncomplete",
      } as unknown as ApiError)
      return
    }

    updateTodoStatusMutation.mutate({ id: todoId, status: newStatus })
  }

  if (isLoading) {
    return <PendingTodos />
  }

  if (activeTodos.length === 0) {
    return (
      <Container maxW="full">
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Todo Kanban Board</Heading>
          <HStack gap={2}>
            <Button
              variant={viewMode === "table" ? "solid" : "outline"}
              onClick={() => onViewModeChange("table")}
            >
              Table View
            </Button>
            <Button
              variant={viewMode === "kanban" ? "solid" : "outline"}
              onClick={() => onViewModeChange("kanban")}
            >
              Kanban View
            </Button>
          </HStack>
        </Flex>

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

        <AddTodo />
      </Container>
    )
  }

  // Group active todos by status
  const todosByStatus = STATUS_COLUMNS.reduce(
    (acc, column) => {
      acc[column.status] = activeTodos
        .filter((todo) => todo.status === column.status)
        .sort(compareTodosByPriority)
      return acc
    },
    {} as Record<TodoStatus, TodoPublic[]>,
  )

  return (
    <Container maxW="full">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Todo Kanban Board</Heading>
        <HStack gap={2}>
          <Button
            variant={viewMode === "table" ? "solid" : "outline"}
            onClick={() => onViewModeChange("table")}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === "kanban" ? "solid" : "outline"}
            onClick={() => onViewModeChange("kanban")}
          >
            Kanban View
          </Button>
        </HStack>
      </Flex>

      <AddTodo />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Flex gap={4} overflowX="auto" pb={4}>
          {STATUS_COLUMNS.map((column) => (
            <Box key={column.status} minW="280px" flex="1">
              <KanbanColumn
                status={column.status}
                title={column.title}
                color={column.color}
                bgColor={column.bgColor}
                todos={todosByStatus[column.status]}
                onOpen={(todo) => {
                  onSelectedIdChange(todo.id)
                }}
              />
            </Box>
          ))}
        </Flex>

        <DragOverlay>
          {activeId ? (
            <Box
              bg="white"
              p={3}
              borderRadius="md"
              shadow="lg"
              border="1px solid"
              borderColor="gray.200"
              minW="280px"
            >
              <Text fontWeight="medium" fontSize="sm">
                {todos.find((todo) => todo.id === activeId)?.title}
              </Text>
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>
      {/* Todo Detail Dialog */}
      {selectedTodo && (
        <TodoDetailDialog
          open={!!selectedTodo}
          onOpenChange={(open) => {
            if (!open) onSelectedIdChange(null)
          }}
          todo={selectedTodo}
        />
      )}
    </Container>
  )
}
