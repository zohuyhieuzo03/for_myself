import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
} from "@chakra-ui/react"
import {
  DndContext,
  DragOverlay,
} from "@dnd-kit/core"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { type TodoPublic, TodosService } from "@/client"
import PendingTodos from "@/components/Pending/PendingTodos"
import TodoDetailDialog from "@/components/Todos/TodoDetailDialog"
import { STATUS_COLUMNS } from "@/components/Todos/shared/kanbanConstants"
import KanbanColumn from "@/components/Todos/shared/KanbanColumn"
import SimpleDragPreview from "@/components/Todos/shared/SimpleDragPreview"
import { useKanbanDragDrop } from "@/components/Todos/shared/useKanbanDragDrop"
import { useKanbanMutations } from "@/components/Todos/shared/useKanbanMutations"
import { PRIORITY_WEIGHT } from "@/utils/todoHelpers"

interface TodosKanbanProps {
  viewMode: "table" | "kanban"
  onViewModeChange: (mode: "table" | "kanban") => void
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


export default function TodosKanban({
  viewMode,
  onViewModeChange,
  selectedId,
  onSelectedIdChange,
}: TodosKanbanProps & {
  selectedId: string | null
  onSelectedIdChange: (id: string | null) => void
}) {
  const { data, isLoading } = useQuery(getTodosQueryOptions())
  const { handleAddTodo } = useKanbanMutations()
  
  const todos = data?.data ?? []
  const selectedTodo = useMemo(
    () => todos.find((t) => t.id === selectedId) ?? null,
    [todos, selectedId],
  )

  // Filter out archived todos and group by status - memoized
  const activeTodos = useMemo(
    () => todos.filter((todo) => todo.status !== "archived"),
    [todos],
  )

  const { sensors, activeTodo, handleDragStart, handleDragEnd } = useKanbanDragDrop(
    activeTodos,
    []
  )

  // Memoize onOpen handler
  const handleOpenTodo = useMemo(
    () => (todo: TodoPublic) => {
      onSelectedIdChange(todo.id)
    },
    [onSelectedIdChange],
  )

  // Group active todos by status - memoized
  const todosByStatus = useMemo(
    () =>
      STATUS_COLUMNS.reduce(
        (acc, column) => {
          acc[column.status] = activeTodos
            .filter((todo) => todo.status === column.status)
            .sort(compareTodosByPriority)
          return acc
        },
        {} as Record<string, TodoPublic[]>,
      ),
    [activeTodos],
  )

  if (isLoading) {
    return <PendingTodos />
  }

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
                todos={todosByStatus[column.status] || []}
                onTodoClick={handleOpenTodo}
                isSelected={(todo) => todo.id === selectedId}
                onAddTodo={handleAddTodo}
              />
            </Box>
          ))}
        </Flex>

        <DragOverlay dropAnimation={null}>
          {activeTodo ? <SimpleDragPreview title={activeTodo.title} /> : null}
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
