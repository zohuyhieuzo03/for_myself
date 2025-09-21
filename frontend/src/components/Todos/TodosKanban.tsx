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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiCheckSquare, FiArchive } from "react-icons/fi"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { TodosService, type TodoPublic, type TodoUpdate, type TodoStatus } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import PendingTodos from "@/components/Pending/PendingTodos"
import AddTodo from "@/components/Todos/AddTodo"
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
  { status: "backlog", title: "Backlog", color: "white", bgColor: "purple.500" },
  { status: "todo", title: "To Do", color: "white", bgColor: "orange.500" },
  { status: "planning", title: "Planning", color: "white", bgColor: "blue.500" },
  { status: "done", title: "Done", color: "white", bgColor: "green.500" },
]

function getTodosQueryOptions() {
  return {
    queryFn: () => TodosService.readTodos({ skip: 0, limit: 1000 }), // Get all todos for kanban
    queryKey: ["todos", "kanban"],
  }
}

function DraggableTodoCard({ todo }: { todo: TodoPublic }) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
              <Text fontWeight="medium" fontSize="sm" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
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
              <Text fontSize="xs" color="gray.600" overflow="hidden" textOverflow="ellipsis" display="-webkit-box" style={{ WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                {todo.description}
              </Text>
            )}
            
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
  todos 
}: { 
  status: TodoStatus
  title: string
  color: string
  bgColor: string
  todos: TodoPublic[]
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <VStack align="stretch" gap={3} minH="400px" ref={setNodeRef}>
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
        bg={isOver ? "blue.50" : "transparent"}
        border={isOver ? "2px dashed" : "2px dashed transparent"}
        borderColor={isOver ? "blue.300" : "transparent"}
        transition="all 0.2s"
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
          <SortableContext items={todos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
            {todos.map((todo) => (
              <DraggableTodoCard key={todo.id} todo={todo} />
            ))}
          </SortableContext>
        )}
      </VStack>
    </VStack>
  )
}

export default function TodosKanban({ viewMode, onViewModeChange }: TodosKanbanProps) {
  const { data, isLoading } = useQuery(getTodosQueryOptions())
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
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
  
  // Filter out archived todos
  const activeTodos = todos.filter(todo => todo.status !== "archived")

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const todoId = active.id as string
    const newStatus = over.id as TodoStatus

    // Find the todo to get current status
    const todo = todos.find(t => t.id === todoId)
    if (!todo) return

    // Only call API if status actually changed
    if (todo.status === newStatus) return

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
  const todosByStatus = STATUS_COLUMNS.reduce((acc, column) => {
    acc[column.status] = activeTodos.filter(todo => todo.status === column.status)
    return acc
  }, {} as Record<TodoStatus, TodoPublic[]>)

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
                {todos.find(todo => todo.id === activeId)?.title}
              </Text>
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Container>
  )
}
