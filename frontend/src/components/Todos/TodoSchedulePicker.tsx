import {
  Button,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Flex,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiCalendar, FiCheck, FiPlus } from "react-icons/fi"
import { Calendar } from "react-date-range"

import { TodosService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import AddTodo from "@/components/Todos/AddTodo"
import useCustomToast from "@/hooks/useCustomToast"
import { formatDate, handleError } from "@/utils"
import "react-date-range/dist/styles.css"
import "react-date-range/dist/theme/default.css"

interface TodoSchedulePickerProps {
  open: boolean
  onClose: () => void
  selectedDate: Date
  onDateChange: (date: Date) => void
  mode?: "schedule_existing" | "create_new"
}

export default function TodoSchedulePicker({
  open,
  onClose,
  selectedDate,
  onDateChange,
  mode = "create_new",
}: TodoSchedulePickerProps) {
  const [currentMode, setCurrentMode] = useState<"schedule_existing" | "create_new">(mode)
  const [selectedTodoIds, setSelectedTodoIds] = useState<string[]>([])
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // Query để lấy tất cả todos available cho scheduling
  const { data: availableTodos } = useQuery({
    queryKey: ["todos", "available_for_schedule"],
    queryFn: () => TodosService.readTodos({
      skip: 0,
      limit: 100,
    }),
    enabled: currentMode === "schedule_existing",
  })

  // Mutation để schedule todo cho ngày được chọn
  const scheduleMutation = useMutation({
    mutationFn: ({ todoId, date }: { todoId: string; date: string }) =>
      TodosService.scheduleTodoEndpoint({
        id: todoId,
        date: date,
      }),
    onSuccess: () => {
      showSuccessToast("Todo scheduled successfully")
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const todosList = availableTodos?.data ?? []

  const handleScheduleMultiple = () => {
    const targetDate = formatDate(selectedDate)
    
    if (selectedTodoIds.length === 0) {
      return
    }

    // Schedule multiple todos
    const promises = selectedTodoIds.map(todoId =>
      scheduleMutation.mutateAsync({ todoId, date: targetDate })
    )

    Promise.all(promises)
      .then(() => {
        setSelectedTodoIds([])
        onClose()
      })
      .catch(() => {
        // Error handling done in mutation
      })
  }

  const handleScheduleSingle = (todoId: string) => {
    const targetDate = formatDate(selectedDate)
    scheduleMutation.mutate(
      { todoId, date: targetDate },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  const handleTodoSelection = (todoId: string) => {
    setSelectedTodoIds(prev => 
      prev.includes(todoId) 
        ? prev.filter(id => id !== todoId)
        : [...prev, todoId]
    )
  }

  return (
    <DialogRoot open={open} onOpenChange={(e) => e.open ? undefined : onClose()}>
      <DialogContent maxW="600px" minW="500px" mx="auto" my={8}>
        <DialogHeader>
          <DialogTitle>
            <HStack gap={3}>
              <Box p={2} bg="blue.50" borderRadius="md">
                <FiCalendar color="blue.600" size={20} />
              </Box>
              <VStack align="start" gap={0}>
                <Text fontSize="xl" fontWeight="bold">Schedule Todos</Text>
                <Text fontSize="sm" color="gray.600">
                  Choose tasks to schedule for {formatDate(selectedDate)}
                </Text>
              </VStack>
            </HStack>
          </DialogTitle>
        </DialogHeader>
        
        <Box px={4} pb={4}>
          <VStack gap={6} align="stretch">
            {/* Calendar Section */}
            <Box>
              <Text fontWeight="bold" mb={3}>Select Date</Text>
              <Box p={2} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                <Calendar
                  date={selectedDate}
                  onChange={(date) => onDateChange(date || selectedDate)}
                  showDateDisplay={false}
                  color="#3182ce"
                />
              </Box>
            </Box>

            {/* Mode Toggle */}
            <Box>
              <Text fontWeight="bold" mb={3}>Choose Action:</Text>
              <HStack gap={2}>
                <Button
                  size="md"
                  variant={currentMode === "create_new" ? "solid" : "outline"}
                  colorScheme={currentMode === "create_new" ? "purple" : "gray"}
                  onClick={() => setCurrentMode("create_new")}
                  flex={1}
                  leftIcon={<FiPlus />}
                >
                  Create New Todo
                </Button>
                <Button
                  size="md"
                  variant={currentMode === "schedule_existing" ? "solid" : "outline"}
                  colorScheme={currentMode === "schedule_existing" ? "green" : "gray"}
                  onClick={() => setCurrentMode("schedule_existing")}
                  flex={1}
                  leftIcon={<FiCalendar />}
                >
                  Schedule Existing
                </Button>
              </HStack>
            </Box>

            {/* Selected Date Display */}
            <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
              <HStack>
                <FiCalendar color="var(--chakra-colors-blue-600)" />
                <Text fontWeight="bold" color="blue.700">
                  Scheduling for: {formatDate(selectedDate)}
                </Text>
              </HStack>
            </Box>

            {/* Content based on mode */}
            {currentMode === "create_new" ? (
              <Box>
                <Text fontWeight="bold" mb={3}>Create New Todo</Text>
                <AddTodo 
                  defaultScheduledDate={selectedDate}
                  onClose={onClose}
                />
              </Box>
            ) : (
              <Box>
                <Flex justify="space-between" align="center" mb={4}>
                  <HStack gap={2}>
                    <Text fontWeight="bold" fontSize="lg">Available Todos</Text>
                    <Badge colorScheme="gray" variant="subtle">
                      {todosList.filter(todo => todo.status && !["done", "archived"].includes(todo.status) && !todo.scheduled_date).length}
                    </Badge>
                  </HStack>
                  {selectedTodoIds.length > 0 && (
                    <Badge colorScheme="green" variant="solid" fontSize="sm">
                      {selectedTodoIds.length} selected
                    </Badge>
                  )}
                </Flex>

                {todosList.length === 0 ? (
                  <Box p={6} textAlign="center" color="gray.500" bg="gray.50" borderRadius="md">
                    <FiCalendar size={32} color="gray" style={{ margin: "0 auto 8px" }} />
                    <Text fontWeight="medium">No todos available</Text>
                    <Text fontSize="sm" mt={1}>
                      Only unscheduled todos are shown. Done/archived todos are excluded.
                    </Text>
                  </Box>
                ) : (
                  <VStack gap={3} maxH="400px" overflowY="auto" p={1}>
                    {todosList
                      .filter(todo => todo.status && !["done", "archived"].includes(todo.status) && !todo.scheduled_date)
                      .map((todo) => (
                      <Box
                        key={todo.id}
                        p={3}
                        border="1px solid"
                        borderColor={selectedTodoIds.includes(todo.id) ? "blue.300" : "gray.200"}
                        bg={selectedTodoIds.includes(todo.id) ? "blue.50" : "white"}
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => handleTodoSelection(todo.id)}
                        transition="all 0.2s"
                        _hover={{
                          borderColor: "blue.200",
                          bg: selectedTodoIds.includes(todo.id) ? "blue.100" : "gray.50"
                        }}
                        w="full"
                      >
                        <Flex justify="space-between" align="center">
                          <Text fontWeight="bold" flex={1}>
                            {todo.title}
                          </Text>
                          <HStack gap={2}>
                            <Badge colorScheme="gray" variant="subtle">
                              {todo.status}
                            </Badge>
                            {selectedTodoIds.includes(todo.id) && (
                              <FiCheck color="var(--chakra-colors-blue-600)" />
                            )}
                          </HStack>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            )}
          </VStack>
        </Box>

        <DialogFooter px={4} py={3}>
          <HStack gap={2}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            
            {currentMode === "schedule_existing" && (
              <HStack gap={3}>
                <Button
                  variant="outline"
                  loading={scheduleMutation.isPending}
                  onClick={() => handleScheduleSingle(selectedTodoIds[0])}
                  disabled={selectedTodoIds.length !== 1}
                  leftIcon={<FiCalendar />}
                >
                  Schedule Selected ({selectedTodoIds.length})
                </Button>
                
                <Button
                  colorScheme="green"
                  loading={scheduleMutation.isPending}
                  onClick={handleScheduleMultiple}
                  disabled={selectedTodoIds.length === 0}
                  leftIcon={<FiCheck />}
                >
                  Schedule All ({selectedTodoIds.length})
                </Button>
              </HStack>
            )}
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}