import {
  Badge,
  Box,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { type TodoPublic } from "@/client"
import { formatDateTimeShort } from "@/utils"

interface TodoCardProps {
  todo: TodoPublic
  onClick?: () => void
}

export default function TodoCard({ todo, onClick }: TodoCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Navigate to todos page with this todo selected
      navigate({
        to: "/todos",
        search: { view: "kanban", id: todo.id },
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "backlog":
        return "gray"
      case "todo":
        return "blue"
      case "planning":
        return "purple"
      case "doing":
        return "orange"
      case "done":
        return "green"
      case "archived":
        return "red"
      default:
        return "gray"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "green"
      case "medium":
        return "yellow"
      case "high":
        return "orange"
      case "urgent":
        return "red"
      default:
        return "gray"
    }
  }

  return (
    <Box
      cursor="pointer"
      onClick={handleClick}
      transition="all 0.2s"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "md",
        bg: "gray.50",
      }}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
      p={3}
      width="100%"
    >
        <VStack gap={2} align="stretch">
          {/* Header with status and priority */}
          <HStack justify="space-between" align="start">
            <VStack gap={1} align="start" flex={1}>
              <Text fontSize="sm" fontWeight="medium" style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {todo.title}
              </Text>
              {todo.description && (
                <Text fontSize="xs" color="gray.600" style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {todo.description}
                </Text>
              )}
            </VStack>
            <VStack gap={1} align="end">
              <Badge colorPalette={getStatusColor(todo.status || "todo")} size="sm">
                {todo.status || "todo"}
              </Badge>
              <Badge colorPalette={getPriorityColor(todo.priority || "medium")} size="sm" variant="subtle">
                {todo.priority || "medium"}
              </Badge>
            </VStack>
          </HStack>

          {/* Footer with type and estimate */}
          <HStack justify="space-between" align="center">
            <Text fontSize="xs" color="gray.500">
              {todo.type || "task"}
            </Text>
            {todo.estimate_minutes && (
              <Text fontSize="xs" color="gray.500">
                {todo.estimate_minutes}m
              </Text>
            )}
          </HStack>

          {/* Created date */}
          <Text fontSize="xs" color="gray.400">
            {formatDateTimeShort(todo.created_at)}
          </Text>
        </VStack>
    </Box>
  )
}
