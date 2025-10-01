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
import React, { useState } from "react"
import { FiCalendar, FiClock, FiPlus, FiRefreshCw, FiGrid, FiList } from "react-icons/fi"

import { type TodoPublic, TodosService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import DailyTodosKanban from "@/components/Todos/DailyTodosKanban"
import TodoDetailWrapper from "@/components/Todos/TodoDetailWrapper"
import TodoSchedulePicker from "@/components/Todos/TodoSchedulePicker"
// removed DialogTrigger import since not used after simplifying dialog structure
import useCustomToast from "@/hooks/useCustomToast"
import { formatDate, handleError } from "@/utils"
import {
  getPriorityConfig,
  getStatusConfig,
  TASK_TYPE_CONFIG,
} from "@/utils/todoHelpers"


interface DailyTodosViewProps {
  selectedId: string | null
  onSelectedIdChange: (id: string | null) => void
  pickerMode?: boolean
  displayDate?: Date
  onDisplayDateChange?: (date: Date) => void
}

interface TodoCardComponentProps {
  todo: TodoPublic
  onClick: () => void
  isSelected: boolean
  displayDate: Date
  overdueTodosList: TodoPublic[]
}


const TodoCardComponent = ({
  todo,
  onClick,
  isSelected,
  displayDate,
  overdueTodosList,
}: TodoCardComponentProps) => {
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
          {todo.type && TASK_TYPE_CONFIG[todo.type] && (
            <Badge
              size="sm"
              colorPalette={TASK_TYPE_CONFIG[todo.type].colorPalette}
              variant="subtle"
            >
              {TASK_TYPE_CONFIG[todo.type].label}
            </Badge>
          )}
        </HStack>
      </Flex>
    </Box>
  )
}

export default function DailyTodosView({
  selectedId,
  onSelectedIdChange,
  pickerMode = false,
  displayDate: propDisplayDate,
  onDisplayDateChange,
}: DailyTodosViewProps) {
  // Use prop displayDate if provided, otherwise use local state
  const [localDisplayDate, setLocalDisplayDate] = useState(new Date())
  const displayDate = propDisplayDate ?? localDisplayDate
  const setDisplayDate = onDisplayDateChange ?? setLocalDisplayDate

  const [pickerDate, setPickerDate] = useState(new Date())
  const [showOverdue] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  
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
    placeholderData: (previousData: any) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })

  // Query để lấy overdue todos
  const { data: overdueTodos } = useQuery({
    queryKey: ["todos", "overdue"],
    queryFn: () => TodosService.readOverdueTodos(),
    enabled: showOverdue && !pickerMode,
    placeholderData: (previousData: any) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })

  // Query để lấy completed todos cho ngày được chọn
  const { data: completedTodos } = useQuery({
    queryKey: ["todos", "completed", formatDate(displayDate)],
    queryFn: () =>
      TodosService.readCompletedDailyTodos({ date: formatDate(displayDate) }),
    enabled: !pickerMode,
    placeholderData: (previousData: any) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })

  // Mutation để rollover overdue todos
  const rolloverMutation = useMutation({
    mutationFn: () => TodosService.rolloverTodosEndpoint(),
    onSuccess: (data) => {
      showSuccessToast(`Rolled over ${data.count} overdue todos to today`)
      // Refresh all queries
      queryClient.invalidateQueries({ queryKey: ["todos", "daily"] })
      queryClient.invalidateQueries({ queryKey: ["todos", "overdue"] })
      queryClient.invalidateQueries({ queryKey: ["todos", "completed"] })
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
  const completedTodosList = completedTodos?.data ?? []

  const handleTodoClick = (todo: TodoPublic) => {
    if (pickerMode) {
      selectedId !== todo.id
        ? onSelectedIdChange(todo.id)
        : onSelectedIdChange(null)
    } else {
      onSelectedIdChange(todo.id)
    }
  }

  const isSelected = (todo: TodoPublic) => selectedId === todo.id

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
              <HStack gap={1}>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "solid" : "outline"}
                  onClick={() => setViewMode("list")}
                >
                  <FiList />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "kanban" ? "solid" : "outline"}
                  onClick={() => setViewMode("kanban")}
                >
                  <FiGrid />
                </Button>
              </HStack>
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

        {/* Date Navigation */}
        <Flex align="center" gap={2} justify="center">
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
        </Flex>

        {/* Content based on view mode */}
        {viewMode === "kanban" ? (
          <DailyTodosKanban
            displayDate={displayDate}
            dailyTodosList={dailyTodosList}
            overdueTodosList={overdueTodosList}
            onTodoClick={handleTodoClick}
            isSelected={isSelected}
          />
        ) : (
          <VStack gap={6} align="stretch">
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
                      displayDate={displayDate}
                      overdueTodosList={overdueTodosList}
                    />
                  ))}
                </VStack>
              </Box>
            )}

            {/* Daily Todos Section */}
            <Box>
              <Flex align="center" gap={2} mb={4}>
                <Text fontWeight="bold" fontSize="lg">
                  Daily Todos
                </Text>
                {dailyTodosList.length > 0 && (
                  <Badge
                    colorScheme="blue"
                    variant="subtle"
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
                      displayDate={displayDate}
                      overdueTodosList={overdueTodosList}
                    />
                  ))
                )}
              </VStack>
            </Box>

            {/* Completed Todos Section */}
            <Box>
              <Flex align="center" gap={2} mb={4}>
                <Badge
                  colorScheme="green"
                  variant="subtle"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  Completed ({completedTodosList.length})
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  Todos completed or archived on this day
                </Text>
              </Flex>

              {completedTodosList.length > 0 && (
                <VStack gap={2}>
                  {completedTodosList.map((todo) => (
                    <Box
                      key={todo.id}
                      cursor="pointer"
                      onClick={() => handleTodoClick(todo)}
                      bg={isSelected(todo) ? "green.50" : "white"}
                      borderColor={isSelected(todo) ? "green.200" : "gray.200"}
                      borderWidth={isSelected(todo) ? "2px" : "1px"}
                      _hover={{
                        bg: isSelected(todo) ? "green.50" : "gray.50",
                        borderColor: "green.300",
                      }}
                      p={4}
                      borderRadius="md"
                      w="full"
                      opacity={0.8}
                    >
                      <Flex justify="space-between" align="center">
                        <VStack align="start" gap={1} flex={1}>
                          <Text
                            fontWeight="bold"
                            textDecoration="line-through"
                            color="gray.600"
                          >
                            {todo.title}
                          </Text>
                          <HStack gap={4} fontSize="sm" color="gray.500">
                            <HStack gap={1}>
                              <FiCalendar />
                              <Text>{formatDate(displayDate)}</Text>
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
                            colorPalette={
                              getStatusConfig(todo.status || "done").color
                            }
                            size="sm"
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            {React.createElement(
                              getStatusConfig(todo.status || "done").icon,
                              { size: 14 },
                            )}
                            {getStatusConfig(todo.status || "done").label}
                          </Badge>
                          <Badge
                            colorPalette={
                              getPriorityConfig(todo.priority || "medium").color
                            }
                            size="sm"
                            variant="subtle"
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            {React.createElement(
                              getPriorityConfig(todo.priority || "medium").icon,
                              { size: 14 },
                            )}
                            {getPriorityConfig(todo.priority || "medium").label}
                          </Badge>
                          {todo.type && TASK_TYPE_CONFIG[todo.type] && (
                            <Badge
                              size="sm"
                              colorPalette={TASK_TYPE_CONFIG[todo.type].colorPalette}
                              variant="subtle"
                            >
                              {TASK_TYPE_CONFIG[todo.type].label}
                            </Badge>
                          )}
                        </HStack>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        )}

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
          todos={[
            ...dailyTodosList,
            ...overdueTodosList,
            ...completedTodosList,
          ]}
          onClose={() => onSelectedIdChange(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["todos"] })
          }}
        />
      </VStack>
    </Container>
  )
}
