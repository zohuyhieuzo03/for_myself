import { type TodoPublic, type TodoStatus } from "@/client"

export interface BaseKanbanProps {
  onTodoClick: (todo: TodoPublic) => void
  isSelected: (todo: TodoPublic) => boolean
}

export interface KanbanColumnProps extends BaseKanbanProps {
  status: TodoStatus
  title: string
  color: string
  bgColor: string
  todos: TodoPublic[]
  onAddTodo: (title: string, status: TodoStatus, scheduledDate?: string) => void
  displayDate?: Date
  overdueTodosList?: TodoPublic[]
}

export interface DraggableTodoCardProps {
  todo: TodoPublic
  onClick: () => void
  isSelected: (todo: TodoPublic) => boolean
  displayDate?: Date
  overdueTodosList?: TodoPublic[]
}
