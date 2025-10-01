import { type TodoStatus } from "@/client"

// Status columns for kanban view
export const STATUS_COLUMNS: Array<{
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
