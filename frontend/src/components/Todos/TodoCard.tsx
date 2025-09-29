import { Badge, Box, Button, HStack, Text, VStack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { FiX, FiCalendar } from "react-icons/fi"

import { type TodoPublic, TodosService, type TodoUpdate } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { formatDateTimeShort, formatDate, handleError } from "@/utils"

interface TodoCardProps {
  todo: TodoPublic
  onClick?: () => void
  compact?: boolean
  showUnlinkButton?: boolean
  onUnlink?: () => void
}

export default function TodoCard({
  todo,
  onClick,
  compact = false,
  showUnlinkButton = false,
  onUnlink,
}: TodoCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

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

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      await TodosService.updateTodoEndpoint({
        id: todo.id,
        requestBody: { parent_id: null } as TodoUpdate,
      })
    },
    onSuccess: () => {
      showSuccessToast("Todo unlinked successfully.")
      onUnlink?.()
    },
    onError: (err: ApiError) => handleError(err),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
      queryClient.invalidateQueries({ queryKey: ["todos", todo.id] })
    },
  })

  const handleUnlink = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering onClick
    unlinkMutation.mutate()
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

  if (compact) {
    return (
      <Box
        cursor="pointer"
        onClick={handleClick}
        transition="all 0.2s"
        _hover={{
          bg: "gray.50",
        }}
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        bg="white"
        p={2}
        width="100%"
      >
        <HStack justify="space-between" align="center">
          <VStack gap={0} align="start" flex={1}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {todo.title}
            </Text>
            <VStack gap={1} align="start">
              <HStack gap={2}>
                <Badge
                  colorPalette={getStatusColor(todo.status || "todo")}
                  size="xs"
                >
                  {todo.status || "todo"}
                </Badge>
                <Badge
                  colorPalette={getPriorityColor(todo.priority || "medium")}
                  size="xs"
                  variant="subtle"
                >
                  {todo.priority || "medium"}
                </Badge>
              </HStack>
              {todo.scheduled_date && (
                <HStack gap={1} align="center">
                  <FiCalendar size={12} color="var(--chakra-colors-blue-500)" />
                  <Text fontSize="xs" color="blue.500" fontWeight="medium">
                    {formatDate(new Date(todo.scheduled_date))}
                  </Text>
                </HStack>
              )}
            </VStack>
          </VStack>
          {showUnlinkButton && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={handleUnlink}
              loading={unlinkMutation.isPending}
              p={1}
              minW="auto"
              h="auto"
            >
              <FiX size={12} />
            </Button>
          )}
        </HStack>
      </Box>
    )
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
            <Text
              fontSize="sm"
              fontWeight="medium"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {todo.title}
            </Text>
            {todo.description && (
              <Text
                fontSize="xs"
                color="gray.600"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {todo.description}
              </Text>
            )}
          </VStack>
          <VStack gap={1} align="end">
            <HStack gap={1}>
              <Badge
                colorPalette={getStatusColor(todo.status || "todo")}
                size="sm"
              >
                {todo.status || "todo"}
              </Badge>
              <Badge
                colorPalette={getPriorityColor(todo.priority || "medium")}
                size="sm"
                variant="subtle"
              >
                {todo.priority || "medium"}
              </Badge>
            </HStack>
            {showUnlinkButton && (
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={handleUnlink}
                loading={unlinkMutation.isPending}
                p={1}
                minW="auto"
                h="auto"
              >
                <FiX size={12} />
              </Button>
            )}
          </VStack>
        </HStack>

        {/* Footer with type, estimate, and scheduled date */}
        <HStack justify="space-between" align="center">
          <Text fontSize="xs" color="gray.500">
            {todo.type || "task"}
          </Text>
          <HStack gap={2}>
            {todo.estimate_minutes && (
              <Text fontSize="xs" color="gray.500">
                {todo.estimate_minutes}m
              </Text>
            )}
            {todo.scheduled_date && (
              <HStack gap={1} align="center">
                <FiCalendar size={12} color="var(--chakra-colors-blue-500)" />
                <Text fontSize="xs" color="blue.500" fontWeight="medium">
                  {formatDate(new Date(todo.scheduled_date))}
                </Text>
              </HStack>
            )}
          </HStack>
        </HStack>

        {/* Created date */}
        <Text fontSize="xs" color="gray.400">
          {formatDateTimeShort(todo.created_at)}
        </Text>
      </VStack>
    </Box>
  )
}
