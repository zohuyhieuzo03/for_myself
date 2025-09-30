import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"
import {
  FiBook,
  FiBriefcase,
  FiCheckSquare,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiHeart,
  FiHome,
  FiMoreHorizontal,
  FiUser,
} from "react-icons/fi"

import type { TodoPublic, TodoType } from "@/client"

interface TaskTypeAnalysisProps {
  todos: TodoPublic[]
  completedTodos?: TodoPublic[]
  title?: string
}

interface TypeStats {
  type: TodoType
  count: number
  label: string
  color: string
  icon: typeof FiBriefcase
}

const TYPE_CONFIG: Record<
  TodoType,
  { label: string; color: string; icon: typeof FiBriefcase }
> = {
  work: { label: "Work", color: "blue", icon: FiBriefcase },
  learning: { label: "Learning", color: "purple", icon: FiBook },
  daily_life: { label: "Daily Life", color: "green", icon: FiHome },
  task: { label: "Task", color: "gray", icon: FiCheckSquare },
  personal: { label: "Personal", color: "orange", icon: FiUser },
  health: { label: "Health", color: "pink", icon: FiHeart },
  finance: { label: "Finance", color: "yellow", icon: FiDollarSign },
  other: { label: "Other", color: "gray", icon: FiMoreHorizontal },
}

export default function TaskTypeAnalysis({
  todos,
  completedTodos = [],
  title = "Task Analysis",
}: TaskTypeAnalysisProps) {
  const [isOpen, setIsOpen] = useState(true)

  const typeStats = useMemo(() => {
    const stats = new Map<TodoType, number>()

    todos.forEach((todo) => {
      const type = todo.type || "task"
      stats.set(type, (stats.get(type) || 0) + 1)
    })

    const result: TypeStats[] = []
    stats.forEach((count, type) => {
      const config = TYPE_CONFIG[type]
      result.push({
        type,
        count,
        label: config.label,
        color: config.color,
        icon: config.icon,
      })
    })

    // Sort by count descending
    return result.sort((a, b) => b.count - a.count)
  }, [todos])

  const statusStats = useMemo(() => {
    const doneCount = completedTodos.filter(
      (todo) => todo.status === "done",
    ).length
    const archivedCount = completedTodos.filter(
      (todo) => todo.status === "archived",
    ).length
    const totalCompleted = doneCount + archivedCount
    const activeTasks = todos.length
    const totalTasks = activeTasks + totalCompleted

    return {
      doneCount,
      archivedCount,
      totalCompleted,
      activeTasks,
      totalTasks,
    }
  }, [todos, completedTodos])

  if (statusStats.totalTasks === 0) {
    return null
  }

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
    >
      {/* Header with Toggle Button */}
      <Flex justify="space-between" align="center" mb={4}>
        <HStack gap={4}>
          <Heading size="md">{title}</Heading>
          <HStack gap={2}>
            <Badge colorScheme="green" px={2} py={1}>
              Done: {statusStats.doneCount}
            </Badge>
            <Badge colorScheme="purple" px={2} py={1}>
              Archived: {statusStats.archivedCount}
            </Badge>
            <Badge colorScheme="blue" px={2} py={1}>
              Total: {statusStats.totalTasks}
            </Badge>
          </HStack>
        </HStack>
        <Button size="sm" variant="ghost" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
          {isOpen ? "Hide" : "Show"}
        </Button>
      </Flex>

      {/* Collapsible Content */}
      {isOpen && (
        <VStack gap={4} align="stretch">
          {/* Task Type Grid */}
          <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={3}>
            {typeStats.map((stat) => {
              const Icon = stat.icon
              const percentage = (
                (stat.count / statusStats.activeTasks) *
                100
              ).toFixed(1)

              return (
                <GridItem key={stat.type}>
                  <Box
                    p={4}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={`${stat.color}.200`}
                    bg={`${stat.color}.50`}
                    _hover={{
                      borderColor: `${stat.color}.300`,
                      shadow: "sm",
                    }}
                    transition="all 0.2s"
                  >
                    <HStack justify="space-between" mb={2}>
                      <Icon
                        size={20}
                        color={`var(--chakra-colors-${stat.color}-600)`}
                      />
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color={`${stat.color}.700`}
                      >
                        {stat.count}
                      </Text>
                    </HStack>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={1}
                      color="gray.700"
                    >
                      {stat.label}
                    </Text>
                    <Flex align="center" gap={2}>
                      <Box
                        flex={1}
                        h="4px"
                        bg="gray.200"
                        borderRadius="full"
                        overflow="hidden"
                      >
                        <Box
                          h="full"
                          bg={`${stat.color}.500`}
                          w={`${percentage}%`}
                          transition="width 0.3s"
                        />
                      </Box>
                      <Text fontSize="xs" color="gray.600" minW="45px">
                        {percentage}%
                      </Text>
                    </Flex>
                  </Box>
                </GridItem>
              )
            })}
          </Grid>

          {/* Summary Stats */}
          <Box pt={4} borderTopWidth="1px" borderColor="gray.200">
            <Grid
              templateColumns="repeat(auto-fit, minmax(150px, 1fr))"
              gap={3}
            >
              <Box>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Active Tasks
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="gray.700">
                  {statusStats.activeTasks}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Completed Today
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  {statusStats.totalCompleted}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Completion Rate
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                  {statusStats.totalTasks > 0
                    ? (
                        (statusStats.totalCompleted / statusStats.totalTasks) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </Text>
              </Box>
            </Grid>
          </Box>
        </VStack>
      )}
    </Box>
  )
}
