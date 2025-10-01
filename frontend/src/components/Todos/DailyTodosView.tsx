import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import React, { memo, useCallback, useMemo, useRef, useState } from "react"
import { FiCalendar, FiClock, FiPlus, FiRefreshCw, FiGrid, FiList, FiX } from "react-icons/fi"

import { type TodoCreate, type TodoPublic, type TodoStatus, TodosService, type TodoUpdate } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
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

// Status columns for kanban view
const STATUS_COLUMNS: Array<{
  status: TodoStatus
  title: string
  color: string
  bgColor: string
}> = [
  {
    status: "backlog",
    title: "Backlog",
    color: "white",
    bgColor: "purple.500",
  },
  { status: "todo", title: "To Do", color: "white", bgColor: "orange.500" },
  {
    status: "planning",
    title: "Planning",
    color: "white",
    bgColor: "blue.500",
  },
  { status: "doing", title: "Doing", color: "white", bgColor: "teal.500" },
  { status: "done", title: "Done", color: "white", bgColor: "green.500" },
]

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

// Lightweight drag preview component for kanban
const SimpleDragPreview = memo(({ title }: { title: string }) => (
  <Box
    bg="white"
    p={3}
    borderRadius="md"
    shadow="xl"
    border="2px solid"
    borderColor="blue.400"
    minW="280px"
    opacity={0.95}
    style={{
      transform: "rotate(3deg)",
    }}
  >
    <Text
      fontWeight="medium"
      fontSize="sm"
      overflow="hidden"
      textOverflow="ellipsis"
      display="-webkit-box"
      style={{ WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
    >
      {title}
    </Text>
  </Box>
))
SimpleDragPreview.displayName = "SimpleDragPreview"

// Draggable todo card for kanban view
const DraggableTodoCard = memo(
  ({
    todo,
    onClick,
    isSelected,
    displayDate,
    overdueTodosList,
  }: TodoCardComponentProps) => {
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
          bg={isSelected ? "blue.50" : "white"}
          borderColor={isSelected ? "blue.200" : "gray.200"}
          borderWidth={isSelected ? "2px" : "1px"}
        >
          <Card.Body p={3}>
            <VStack align="stretch" gap={2}>
              <Text
                fontWeight="bold"
                color={overdueTodosList.includes(todo) ? "red.600" : "inherit"}
                fontSize="sm"
                overflow="hidden"
                textOverflow="ellipsis"
                display="-webkit-box"
                style={{ WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                wordBreak="break-word"
              >
                {todo.title}
              </Text>
              
              <HStack gap={4} fontSize="xs" color="gray.600">
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
    prevProps.isSelected === nextProps.isSelected,
)
DraggableTodoCard.displayName = "DraggableTodoCard"

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
  overdueTodosList,
  onAddTodo,
}: {
  status: TodoStatus
  title: string
  color: string
  bgColor: string
  todos: TodoPublic[]
  onTodoClick: (todo: TodoPublic) => void
  isSelected: (todo: TodoPublic) => boolean
  displayDate: Date
  overdueTodosList: TodoPublic[]
  onAddTodo: (title: string, status: TodoStatus, scheduledDate: string) => void
}) {
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
      onAddTodo(newTitle.trim(), status, formatDate(displayDate))
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
                isSelected={isSelected(todo)}
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
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const {
    open: isPickerOpen,
    onOpen: onPickerOpen,
    onClose: onPickerClose,
  } = useDisclosure()
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

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

  // Mutation để update todo status cho kanban
  const updateTodoStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TodoStatus }) =>
      TodosService.updateTodoEndpoint({
        id,
        requestBody: { status } as TodoUpdate,
      }),
    onSuccess: () => {
      showSuccessToast("Todo status updated successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  // Mutation để create todo mới cho kanban
  const createTodoMutation = useMutation({
    mutationFn: (data: TodoCreate) =>
      TodosService.createTodoEndpoint({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Todo created successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
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

  // Drag handlers cho kanban
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over) return

      const todoId = active.id as string
      const overId = String(over.id)

      // Resolve target status whether dropping on column (status id) or on a card (todo id)
      let newStatus: TodoStatus | null = null
      if (STATUS_COLUMNS.some((c) => c.status === overId)) {
        newStatus = overId as TodoStatus
      } else {
        const allTodos = [...dailyTodosList, ...overdueTodosList, ...completedTodosList]
        const overTodo = allTodos.find((t) => t.id === overId)
        if (!overTodo) return
        newStatus = (overTodo.status ?? "todo") as TodoStatus
      }

      // Find the todo to get current status
      const allTodos = [...dailyTodosList, ...overdueTodosList, ...completedTodosList]
      const todo = allTodos.find((t) => t.id === todoId)
      if (!todo) return

      // Only call API if status actually changed
      if (!newStatus || todo.status === newStatus) return

      updateTodoStatusMutation.mutate({ id: todoId, status: newStatus })
    },
    [dailyTodosList, overdueTodosList, completedTodosList, updateTodoStatusMutation],
  )

  // Memoize drag preview todo
  const activeTodo = useMemo(() => {
    const allTodos = [...dailyTodosList, ...overdueTodosList, ...completedTodosList]
    return activeId ? allTodos.find((todo) => todo.id === activeId) : null
  }, [activeId, dailyTodosList, overdueTodosList, completedTodosList])

  // Group todos by status for kanban view
  const todosByStatus = useMemo(() => {
    const allTodos = [...dailyTodosList, ...overdueTodosList]
    return STATUS_COLUMNS.reduce(
      (acc, column) => {
        acc[column.status] = allTodos.filter((todo) => todo.status === column.status)
        return acc
      },
      {} as Record<TodoStatus, TodoPublic[]>,
    )
  }, [dailyTodosList, overdueTodosList])

  const isSelected = (todo: TodoPublic) => selectedId === todo.id

  // Handler để add todo mới từ kanban
  const handleAddTodo = useCallback(
    (title: string, status: TodoStatus, scheduledDate: string) => {
      createTodoMutation.mutate({
        title,
        description: "",
        status,
        scheduled_date: scheduledDate,
      })
    },
    [createTodoMutation],
  )

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
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Flex gap={4} overflowX="auto" pb={4}>
              {STATUS_COLUMNS.map((column) => (
                <Box key={column.status} minW="280px" flex="1">
                  <KanbanColumn
                    status={column.status}
                    title={column.title}
                    color={column.color}
                    bgColor={column.bgColor}
                    todos={todosByStatus[column.status]}
                    onTodoClick={handleTodoClick}
                    isSelected={isSelected}
                    displayDate={displayDate}
                    overdueTodosList={overdueTodosList}
                    onAddTodo={handleAddTodo}
                  />
                </Box>
              ))}
            </Flex>

            <DragOverlay dropAnimation={null}>
              {activeTodo ? <SimpleDragPreview title={activeTodo.title} /> : null}
            </DragOverlay>
          </DndContext>
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
