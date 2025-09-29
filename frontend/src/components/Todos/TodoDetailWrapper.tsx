import { useEffect, useState } from "react"
import type { TodoPublic } from "@/client"
import TodoDetailDialog from "./TodoDetailDialog"

interface TodoDetailWrapperProps {
  selectedId: string | null
  todos: TodoPublic[]
  onClose: () => void
  onUpdate: () => void
}

export default function TodoDetailWrapper({
  selectedId,
  todos,
  onClose,
  onUpdate: _,
}: TodoDetailWrapperProps) {
  const [open, setOpen] = useState(!!selectedId)

  useEffect(() => {
    setOpen(!!selectedId)
  }, [selectedId])

  const selectedTodo = todos.find((t) => t.id === selectedId)

  if (!selectedTodo || !open) return null

  return (
    <TodoDetailDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          setOpen(false)
          onClose()
        }
      }}
      todo={selectedTodo}
    />
  )
}
