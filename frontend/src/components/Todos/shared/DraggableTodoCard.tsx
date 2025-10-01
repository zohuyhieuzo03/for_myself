import { Badge, Card, HStack, Text, VStack } from "@chakra-ui/react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { memo, useMemo } from "react"

import { formatDate } from "@/utils"
import {
  getPriorityConfig,
  getStatusConfig,
  TASK_TYPE_CONFIG,
} from "@/utils/todoHelpers"

import type { DraggableTodoCardProps } from "./kanbanTypes"

// Draggable todo card for kanban view
const DraggableTodoCard = memo(
  ({
    todo,
    onClick,
    isSelected,
    displayDate,
    overdueTodosList = [],
  }: DraggableTodoCardProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: todo.id })

    const style = useMemo(
      () => ({
        transform: CSS.Transform.toString(transform),
        transition: transition || undefined,
        opacity: isDragging ? 0.5 : 1,
        willChange: isDragging ? "transform" : "auto",
      }),
      [transform, transition, isDragging],
    )

    const statusConfig = getStatusConfig(todo.status || "todo")
    const priorityConfig = getPriorityConfig(todo.priority || "medium")
    const StatusIcon = statusConfig.icon
    const PriorityIcon = priorityConfig.icon

    const isOverdue = overdueTodosList?.includes(todo) ?? false
    const showDate =
      displayDate && isOverdue
        ? "Overdue"
        : displayDate
          ? formatDate(displayDate)
          : undefined

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onClick}
      >
        <Card.Root
          size="sm"
          variant="outline"
          cursor="grab"
          _hover={{ shadow: "md" }}
          transition="box-shadow 0.2s"
          _active={{ cursor: "grabbing" }}
          bg={isSelected(todo) ? "blue.50" : "white"}
          borderColor={isSelected(todo) ? "blue.200" : "gray.200"}
          borderWidth={isSelected(todo) ? "2px" : "1px"}
        >
          <Card.Body p={3}>
            <VStack align="stretch" gap={2}>
              <Text
                fontWeight="bold"
                color={isOverdue ? "red.600" : "inherit"}
                fontSize="sm"
                overflow="hidden"
                textOverflow="ellipsis"
                display="-webkit-box"
                style={{ WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                wordBreak="break-word"
              >
                {todo.title}
              </Text>

              {todo.description ? (
                <Text
                  fontSize="xs"
                  color="gray.600"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  display="-webkit-box"
                  style={{ WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                >
                  {todo.description}
                </Text>
              ) : null}

              {showDate || todo.estimate_minutes ? (
                <HStack gap={4} fontSize="xs" color="gray.600">
                  {showDate ? (
                    <HStack gap={1}>
                      <Text>{showDate}</Text>
                    </HStack>
                  ) : null}
                  {todo.estimate_minutes ? (
                    <HStack gap={1}>
                      <Text>{todo.estimate_minutes}m</Text>
                    </HStack>
                  ) : null}
                </HStack>
              ) : null}

              <HStack gap={2} flexWrap="wrap">
                <Badge
                  colorPalette={statusConfig.color}
                  size="sm"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <StatusIcon size={12} />
                  {statusConfig.label}
                </Badge>
                <Badge
                  colorPalette={priorityConfig.color}
                  size="sm"
                  variant="subtle"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <PriorityIcon size={12} />
                  {priorityConfig.label}
                </Badge>
                {todo.type && TASK_TYPE_CONFIG[todo.type] ? (
                  <Badge
                    size="sm"
                    colorPalette={TASK_TYPE_CONFIG[todo.type].colorPalette}
                    variant="subtle"
                  >
                    {TASK_TYPE_CONFIG[todo.type].label}
                  </Badge>
                ) : null}
              </HStack>

              <HStack justify="space-between" fontSize="xs" color="gray.500">
                <Text>{new Date(todo.created_at).toLocaleDateString()}</Text>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </div>
    )
  },
  (prevProps, nextProps) =>
    prevProps.todo.id === nextProps.todo.id &&
    prevProps.todo.title === nextProps.todo.title &&
    prevProps.todo.status === nextProps.todo.status &&
    prevProps.todo.priority === nextProps.todo.priority &&
    prevProps.todo.type === nextProps.todo.type &&
    prevProps.isSelected(prevProps.todo) ===
      nextProps.isSelected(nextProps.todo),
)

DraggableTodoCard.displayName = "DraggableTodoCard"

export default DraggableTodoCard
