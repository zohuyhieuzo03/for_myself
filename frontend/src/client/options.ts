import type { TodoStatus, TodoPriority, TodoType } from "./types.gen"

export const TODO_STATUS_OPTIONS: Array<{ value: TodoStatus; label: string }> = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "doing", label: "Doing" },
  { value: "planning", label: "Planning" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
]

export const TODO_PRIORITY_OPTIONS: Array<{ value: TodoPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

export const TODO_TYPE_OPTIONS: Array<{ value: TodoType; label: string }> = [
  { value: "work", label: "Work" },
  { value: "learning", label: "Learning" },
  { value: "daily_life", label: "Daily Life" },
  { value: "task", label: "Task" },
  { value: "personal", label: "Personal" },
  { value: "health", label: "Health" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Other" },
]