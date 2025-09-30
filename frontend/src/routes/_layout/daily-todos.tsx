import { Container, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { TodosService } from "@/client"
import DailyTodosView from "@/components/Todos/DailyTodosView"
import TaskTypeAnalysis from "@/components/Todos/TaskTypeAnalysis"
import { formatDate } from "@/utils"

export const Route = createFileRoute("/_layout/daily-todos")({
  component: DailyTodosPage,
})

function DailyTodosPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [displayDate] = useState(new Date())

  // Query để lấy todos cho ngày hiện tại
  const { data: dailyTodos } = useQuery({
    queryKey: ["todos", "daily", formatDate(displayDate)],
    queryFn: () =>
      TodosService.readDailyTodos({ date: formatDate(displayDate) }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })

  // Query để lấy overdue todos
  const { data: overdueTodos } = useQuery({
    queryKey: ["todos", "overdue"],
    queryFn: () => TodosService.readOverdueTodos(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })

  // Query để lấy completed todos cho ngày được chọn
  const { data: completedTodos } = useQuery({
    queryKey: ["todos", "completed", formatDate(displayDate)],
    queryFn: () =>
      TodosService.readCompletedDailyTodos({ date: formatDate(displayDate) }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })

  const dailyTodosList = dailyTodos?.data ?? []
  const overdueTodosList = overdueTodos?.data ?? []
  const completedTodosList = completedTodos?.data ?? []
  const allActiveTodos = [...dailyTodosList, ...overdueTodosList]

  return (
    <VStack gap={6} align="stretch" w="full">
      {/* Task Type Analysis */}
      {(allActiveTodos.length > 0 || completedTodosList.length > 0) && (
        <Container maxW="container.xl" py={6} pb={0}>
          <TaskTypeAnalysis
            todos={allActiveTodos}
            completedTodos={completedTodosList}
            title="Daily Task Analysis"
          />
        </Container>
      )}

      {/* Daily Todos View */}
      <DailyTodosView
        selectedId={selectedId}
        onSelectedIdChange={setSelectedId}
      />
    </VStack>
  )
}
