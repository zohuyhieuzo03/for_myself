import {
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useCallback, useMemo, useState } from "react"

import type { TodoPublic, TodoStatus } from "@/client"

import { STATUS_COLUMNS } from "./kanbanConstants"
import { useKanbanMutations } from "./useKanbanMutations"

export function useKanbanDragDrop(
  todos: TodoPublic[],
  overdueTodosList: TodoPublic[] = [],
) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { updateTodoStatusMutation } = useKanbanMutations()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
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
        const allTodos = [...todos, ...overdueTodosList]
        const overTodo = allTodos.find((t) => t.id === overId)
        if (!overTodo) return
        newStatus = (overTodo.status ?? "todo") as TodoStatus
      }

      // Find the todo to get current status
      const allTodos = [...todos, ...overdueTodosList]
      const todo = allTodos.find((t) => t.id === todoId)
      if (!todo) return

      // Only call API if status actually changed
      if (!newStatus || todo.status === newStatus) return

      // Prevent moving to done if any checklist item is not completed
      if (
        newStatus === "done" &&
        (todo.checklist_items?.some((item) => !item.is_completed) ?? false)
      ) {
        console.warn("Complete all checklist items before marking as done.")
        return
      }

      updateTodoStatusMutation.mutate({ id: todoId, status: newStatus })
    },
    [todos, overdueTodosList, updateTodoStatusMutation],
  )

  // Memoize drag preview todo
  const activeTodo = useMemo(() => {
    const allTodos = [...todos, ...overdueTodosList]
    return activeId ? allTodos.find((todo) => todo.id === activeId) : null
  }, [activeId, todos, overdueTodosList])

  return {
    sensors,
    activeId,
    activeTodo,
    handleDragStart,
    handleDragEnd,
  }
}
