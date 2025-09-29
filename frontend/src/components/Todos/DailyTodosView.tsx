import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiCalendar, FiClock, FiPlus, FiRefreshCw } from "react-icons/fi"

import { type TodoPublic, TodosService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import TodoDetailWrapper from "@/components/Todos/TodoDetailWrapper"
import TodoSchedulePicker from "@/components/Todos/TodoSchedulePicker"
// removed DialogTrigger import since not used after simplifying dialog structure
import useCustomToast from "@/hooks/useCustomToast"
import { formatDate, handleError } from "@/utils"
import { getPriorityConfig, getStatusConfig } from "@/utils/todoHelpers"

interface DailyTodosViewProps {
  selectedId: string | null
  onSelectedIdChange: (id: string | null) => void
  pickerMode?: boolean
}

export default function DailyTodosView({
  selectedId,
  onSelectedIdChange,
  pickerMode = false,
}: DailyTodosViewProps) {
  const [displayDate, setDisplayDate] = useState(new Date())
  const [pickerDate, setPickerDate] = useState(new Date())
  const [showOverdue] = useState(true)
  const {
    open: isPickerOpen,
    onOpen: onPickerOpen,
    onClose: onPickerClose,
  } = useDisclosure()
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // Query để lấy todos cho ngày được chọn
  const { data: dailyTodos } = useQuery({
    queryKey: ["todos", "daily", formatDate(displayDate)],
    queryFn: () =>
      TodosService.readDailyTodos({ date: formatDate(displayDate) }),
    enabled: !pickerMode,
  })

  // Query để lấy overdue todos
  const { data: overdueTodos } = useQuery({
    queryKey: ["todos", "overdue"],
    queryFn: () => TodosService.readOverdueTodos(),
    enabled: showOverdue && !pickerMode,
  })

  // Mutation để rollover overdue todos
  const rolloverMutation = useMutation({
    mutationFn: () => TodosService.rolloverTodosEndpoint(),
    onSuccess: (data) => {
      showSuccessToast(`Rolled over ${data.count} overdue todos to today`)
      // Refresh all queries
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  // Mutation để update todo status - để khi cần thiết
  // const updateStatusMutation = useMutation({
  //   mutationFn: ({ id, status }: { id: string; status: any }) =>
  //     TodosService.updateTodoEndpoint({
  //       id,
  //       requestBody: { status } as TodoUpdate,
  //     }),
  //   onSuccess: () => {
  //     showSuccessToast("Todo updated successfully")
  //     queryClient.invalidateQueries({ queryKey: ["todos"] })
  //   },
  //   onError: (err: ApiError) => {
  //     handleError(err)
  //   },
  // })

  const dailyTodosList = dailyTodos?.data ?? []
  const overdueTodosList = overdueTodos?.data ?? []

  const handleTodoClick = (todo: TodoPublic) => {
    if (pickerMode) {
      selectedId !== todo.id
        ? onSelectedIdChange(todo.id)
        : onSelectedIdChange(null)
    } else {
      onSelectedIdChange(todo.id)
    }
  }

  // const handleDateChange = (date: Date) => {
  //   setSelectedDate(date)
  // }

  const isSelected = (todo: TodoPublic) => selectedId === todo.id

  const TodoCardComponent = ({
    todo,
    onClick,
    isSelected,
  }: {
    todo: TodoPublic
    onClick: () => void
    isSelected: boolean
  }) => {
    const statusConfig = getStatusConfig(todo.status || "todo")
    const priorityConfig = getPriorityConfig(todo.priority || "medium")
    const StatusIcon = statusConfig.icon
    const PriorityIcon = priorityConfig.icon

    return (
      <Box
        cursor="pointer"
        onClick={onClick}
        bg={isSelected ? "blue.50" : "white"}
        borderColor={isSelected ? "blue.200" : "gray.200"}
        borderWidth={isSelected ? "2px" : "1px"}
        _hover={{
          bg: isSelected ? "blue.50" : "gray.50",
          borderColor: "blue.300",
        }}
        p={4}
        borderRadius="md"
        w="full"
      >
        <Flex justify="space-between" align="center">
          <VStack align="start" gap={1} flex={1}>
            <Text
              fontWeight="bold"
              color={overdueTodosList.includes(todo) ? "red.600" : "inherit"}
            >
              {todo.title}
            </Text>
            <HStack gap={4} fontSize="sm" color="gray.600">
              <HStack gap={1}>
                <FiCalendar />
                <Text>
                  {overdueTodosList.includes(todo)
                    ? "Overdue"
                    : formatDate(displayDate)}
                </Text>
              </HStack>
              {todo.estimate_minutes && (
                <HStack gap={1}>
                  <FiClock />
                  <Text>{todo.estimate_minutes}m</Text>
                </HStack>
              )}
            </HStack>
          </VStack>

          <HStack gap={2}>
            <Badge
              colorPalette={statusConfig.color}
              size="sm"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <StatusIcon size={14} />
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
              <PriorityIcon size={14} />
              {priorityConfig.label}
            </Badge>
          </HStack>
        </Flex>
      </Box>
    )
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" mb={2}>
              Daily Todos
            </Heading>
            <Text color="gray.600">
              Manage your scheduled todos for each day
            </Text>
          </Box>

          {!pickerMode && (
            <HStack gap={2}>
              <Button
                variant="outline"
                onClick={() => {
                  setPickerDate(displayDate)
                  onPickerOpen()
                }}
              >
                <FiCalendar style={{ marginRight: "8px" }} />
                Schedule Todo
              </Button>
              {overdueTodosList.length > 0 && (
                <Button
                  colorScheme="orange"
                  variant="outline"
                  onClick={() => rolloverMutation.mutate()}
                  loading={rolloverMutation.isPending}
                >
                  <FiRefreshCw style={{ marginRight: "8px" }} />
                  Rollover Overdue ({overdueTodosList.length})
                </Button>
              )}
            </HStack>
          )}
        </Flex>

        {/* Overdue Todos Section */}
        {showOverdue && overdueTodosList.length > 0 && (
          <Box>
            <Flex align="center" mb={4}>
              <Badge
                colorScheme="red"
                variant="subtle"
                px={2}
                py={1}
                borderRadius="md"
              >
                Overdue ({overdueTodosList.length})
              </Badge>
              <Text ml={2} fontSize="sm" color="gray.600">
                Todos from previous days that need attention
              </Text>
            </Flex>

            <VStack gap={2}>
              {overdueTodosList.map((todo) => (
                <TodoCardComponent
                  key={todo.id}
                  todo={todo}
                  onClick={() => handleTodoClick(todo)}
                  isSelected={isSelected(todo)}
                />
              ))}
            </VStack>
          </Box>
        )}

        {/* Daily Todos Section */}
        <Box>
          <Flex align="center" gap={2} mb={4}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const prev = new Date(displayDate)
                prev.setDate(prev.getDate() - 1)
                setDisplayDate(prev)
              }}
            >
              ←
            </Button>

            <Text fontWeight="bold" fontSize="lg">
              {formatDate(displayDate)}
            </Text>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const next = new Date(displayDate)
                next.setDate(next.getDate() + 1)
                setDisplayDate(next)
              }}
            >
              →
            </Button>

            {dailyTodosList.length > 0 && (
              <Badge
                colorScheme="blue"
                variant="subtle"
                ml={2}
                px={2}
                py={1}
                borderRadius="md"
              >
                {dailyTodosList.length} todos
              </Badge>
            )}
          </Flex>

          <VStack gap={2}>
            {dailyTodosList.length === 0 ? (
              <Box p={8} textAlign="center" color="gray.500">
                <Text mb={4}>No todos scheduled for this day</Text>
                {!pickerMode && (
                  <Button
                    onClick={() => {
                      setPickerDate(displayDate)
                      onPickerOpen()
                    }}
                  >
                    <FiPlus style={{ marginRight: "8px" }} />
                    Schedule a Todo
                  </Button>
                )}
              </Box>
            ) : (
              dailyTodosList.map((todo) => (
                <TodoCardComponent
                  key={todo.id}
                  todo={todo}
                  onClick={() => handleTodoClick(todo)}
                  isSelected={isSelected(todo)}
                />
              ))
            )}
          </VStack>
        </Box>

        {/* Schedule Todo Dialog */}
        <TodoSchedulePicker
          open={isPickerOpen}
          onClose={onPickerClose}
          selectedDate={pickerDate}
          onDateChange={setPickerDate}
          mode="schedule_existing"
        />

        {/* Todo Detail Dialog */}
        <TodoDetailWrapper
          selectedId={selectedId}
          todos={[...dailyTodosList, ...overdueTodosList]}
          onClose={() => onSelectedIdChange(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["todos"] })
          }}
        />
      </VStack>
    </Container>
  )
}
