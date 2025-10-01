import { Box } from "@chakra-ui/react"
import { DndContext, DragOverlay } from "@dnd-kit/core"
import { useMemo } from "react"

import type { TodoPublic } from "@/client"
import KanbanColumn from "./shared/KanbanColumn"
import { STATUS_COLUMNS } from "./shared/kanbanConstants"
import SimpleDragPreview from "./shared/SimpleDragPreview"
import { useKanbanDragDrop } from "./shared/useKanbanDragDrop"
import { useKanbanMutations } from "./shared/useKanbanMutations"

interface DailyTodosKanbanProps {
  displayDate: Date
  dailyTodosList: TodoPublic[]
  overdueTodosList: TodoPublic[]
  onTodoClick: (todo: TodoPublic) => void
  isSelected: (todo: TodoPublic) => boolean
}

export default function DailyTodosKanban({
  displayDate,
  dailyTodosList,
  overdueTodosList,
  onTodoClick,
  isSelected,
}: DailyTodosKanbanProps) {
  const { handleAddTodo } = useKanbanMutations()
  const { sensors, activeTodo, handleDragStart, handleDragEnd } =
    useKanbanDragDrop(dailyTodosList, overdueTodosList)

  // Group todos by status for kanban view
  const todosByStatus = useMemo(() => {
    const allTodos = [...dailyTodosList, ...overdueTodosList]
    return STATUS_COLUMNS.reduce(
      (acc, column) => {
        acc[column.status] = allTodos.filter(
          (todo) => todo.status === column.status,
        )
        return acc
      },
      {} as Record<string, TodoPublic[]>,
    )
  }, [dailyTodosList, overdueTodosList])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box display="flex" gap={4} overflowX="auto" pb={4}>
        {STATUS_COLUMNS.map((column) => (
          <Box key={column.status} minW="280px" flex="1">
            <KanbanColumn
              status={column.status}
              title={column.title}
              color={column.color}
              bgColor={column.bgColor}
              todos={todosByStatus[column.status] || []}
              onTodoClick={onTodoClick}
              isSelected={isSelected}
              displayDate={displayDate}
              overdueTodosList={overdueTodosList}
              onAddTodo={handleAddTodo}
            />
          </Box>
        ))}
      </Box>

      <DragOverlay dropAnimation={null}>
        {activeTodo ? <SimpleDragPreview title={activeTodo.title} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
