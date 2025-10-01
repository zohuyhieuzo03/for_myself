import type { TodoPublic } from "@/client"
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArchive,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiPlay,
} from "react-icons/fi"

export interface StatusConfig {
  color: string
  icon: React.ComponentType<{ size?: number }>
  label: string
}

export interface PriorityConfig {
  color: string
  icon: React.ComponentType<{ size?: number }>
  label: string
}

export interface TypeConfig {
  label: string
  colorPalette: string
}

// Task type configuration
export const TASK_TYPE_CONFIG: Record<
  NonNullable<TodoPublic["type"]>,
  TypeConfig
> = {
  work: { label: "Work", colorPalette: "blue" },
  learning: { label: "Learning", colorPalette: "purple" },
  daily_life: { label: "Daily Life", colorPalette: "green" },
  health: { label: "Health", colorPalette: "pink" },
  finance: { label: "Finance", colorPalette: "yellow" },
  personal: { label: "Personal", colorPalette: "orange" },
  task: { label: "Task", colorPalette: "gray" },
  other: { label: "Other", colorPalette: "gray" },
}

// Priority configuration for Kanban badges
export const PRIORITY_CONFIG: Record<
  NonNullable<TodoPublic["priority"]>,
  { colorPalette: string }
> = {
  urgent: { colorPalette: "red" },
  high: { colorPalette: "orange" },
  medium: { colorPalette: "blue" },
  low: { colorPalette: "gray" },
}

// Priority weight for sorting (higher number = higher priority)
export const PRIORITY_WEIGHT: Record<
  NonNullable<TodoPublic["priority"]>,
  number
> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export const getStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case "backlog":
      return { color: "gray", icon: FiArchive, label: "Backlog" }
    case "todo":
      return { color: "blue", icon: FiClock, label: "Todo" }
    case "planning":
      return { color: "purple", icon: FiInfo, label: "Planning" }
    case "doing":
      return { color: "orange", icon: FiPlay, label: "Doing" }
    case "done":
      return { color: "green", icon: FiCheckCircle, label: "Done" }
    case "archived":
      return { color: "red", icon: FiArchive, label: "Archived" }
    default:
      return { color: "gray", icon: FiClock, label: status }
  }
}

export const getPriorityConfig = (priority: string): PriorityConfig => {
  switch (priority) {
    case "low":
      return { color: "green", icon: FiInfo, label: "Low" }
    case "medium":
      return { color: "yellow", icon: FiAlertCircle, label: "Medium" }
    case "high":
      return { color: "orange", icon: FiAlertTriangle, label: "High" }
    case "urgent":
      return { color: "red", icon: FiAlertTriangle, label: "Urgent" }
    default:
      return { color: "gray", icon: FiInfo, label: priority }
  }
}
