import {
  Badge,
  Box,
  Card,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  useDndContext,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { memo, useCallback, useRef, useState } from "react"
import { FiPlus, FiX } from "react-icons/fi"

import { formatDate } from "@/utils"

import type { KanbanColumnProps } from "./kanbanTypes"
import DraggableTodoCard from "./DraggableTodoCard"

// Kanban column component
const KanbanColumn = memo(function KanbanColumn({
  status,
  title,
  color,
  bgColor,
  todos,
  onTodoClick,
  isSelected,
  displayDate,
  overdueTodosList = [],
  onAddTodo,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })
  const { over } = useDndContext()
  const isOverColumn =
    isOver ||
    (over?.id != null &&
      (over.id === status || todos.some((t) => t.id === (over.id as string))))

  const handleAddClick = useCallback(() => {
    setIsAdding(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleSubmit = useCallback(() => {
    if (newTitle.trim()) {
      const scheduledDate = displayDate ? formatDate(displayDate) : undefined
      onAddTodo(newTitle.trim(), status, scheduledDate)
      setNewTitle("")
      setIsAdding(false)
    }
  }, [newTitle, onAddTodo, status, displayDate])

  const handleCancel = useCallback(() => {
    setNewTitle("")
    setIsAdding(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ignore Enter key when composing (e.g., typing Vietnamese)
      if (e.nativeEvent.isComposing) {
        return
      }

      if (e.key === "Enter") {
        handleSubmit()
      } else if (e.key === "Escape") {
        handleCancel()
      }
    },
    [handleSubmit, handleCancel],
  )

  return (
    <VStack align="stretch" gap={3} ref={setNodeRef}>
      <Box bg={bgColor} color={color} p={3} borderRadius="md">
        <HStack justify="space-between">
          <HStack gap={2}>
            <Text fontWeight="bold" fontSize="sm">
              {title}
            </Text>
            <Badge colorScheme="whiteAlpha" variant="solid">
              {todos.length}
            </Badge>
          </HStack>
          <IconButton
            aria-label="Add todo"
            size="xs"
            variant="ghost"
            colorScheme="whiteAlpha"
            onClick={handleAddClick}
          >
            <FiPlus />
          </IconButton>
        </HStack>
      </Box>

      <VStack
        align="stretch"
        gap={2}
        flex="1"
        p={2}
        borderRadius="md"
        bg={isOverColumn ? "blue.50" : "transparent"}
        border={isOverColumn ? "2px dashed" : "2px dashed transparent"}
        borderColor={isOverColumn ? "blue.300" : "transparent"}
        transition="all 0.2s"
        ref={setNodeRef}
        minH="200px"
      >
        {/* Add Todo Input */}
        {isAdding && (
          <Card.Root size="sm" variant="outline">
            <Card.Body p={3}>
              <HStack gap={2}>
                <Input
                  ref={inputRef}
                  placeholder="Enter todo title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  size="sm"
                  autoFocus
                />
                <IconButton
                  aria-label="Cancel"
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={handleCancel}
                >
                  <FiX />
                </IconButton>
              </HStack>
            </Card.Body>
          </Card.Root>
        )}

        {todos.length === 0 && !isAdding ? (
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
          <SortableContext
            items={todos.map((todo) => todo.id)}
            strategy={verticalListSortingStrategy}
          >
            {todos.map((todo) => (
              <DraggableTodoCard
                key={todo.id}
                todo={todo}
                onClick={() => onTodoClick(todo)}
                isSelected={isSelected}
                displayDate={displayDate}
                overdueTodosList={overdueTodosList}
              />
            ))}
          </SortableContext>
        )}
      </VStack>
    </VStack>
  )
})

export default KanbanColumn
