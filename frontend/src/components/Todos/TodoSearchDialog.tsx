import { Button } from "@chakra-ui/react"
import { useState } from "react"
import { FiSearch } from "react-icons/fi"

import type { TodoPublic } from "@/client"
import TodoSearch from "@/components/Todos/TodoSearch"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"

interface TodoSearchDialogProps {
  onSelectTodo: (todo: TodoPublic) => void
  excludeIds?: string[]
  placeholder?: string
  triggerText?: string
  title?: string
  maxHeight?: string
}

export default function TodoSearchDialog({
  onSelectTodo,
  excludeIds = [],
  placeholder = "Search todos...",
  triggerText = "Search",
  title = "Select Todo",
  maxHeight = "500px",
}: TodoSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectTodo = (todo: TodoPublic) => {
    onSelectTodo(todo)
    setIsOpen(false)
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FiSearch style={{ marginRight: "8px" }} />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent maxW="600px" maxH="80vh">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <TodoSearch
            onSelectTodo={handleSelectTodo}
            excludeIds={excludeIds}
            placeholder={placeholder}
            maxHeight={maxHeight}
          />
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}
