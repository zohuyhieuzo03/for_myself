import {
  Badge,
  Box,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { FiCalendar, FiTarget, FiClock } from "react-icons/fi"

import { TodosService, RoadmapService, ResourcesService } from "@/client"

export default function DashboardStats() {
  // Fetch todos with due dates
  const { data: todosResponse } = useQuery({
    queryKey: ["todos", "stats"],
    queryFn: () => TodosService.readTodos({ limit: 100 }),
  })

  // Fetch roadmaps and their milestones with due dates
  const { data: roadmapsResponse } = useQuery({
    queryKey: ["roadmaps", "stats"],
    queryFn: () => RoadmapService.readRoadmaps(),
  })

  // Fetch resources and their subjects with due dates
  const { data: resourcesResponse } = useQuery({
    queryKey: ["resources", "stats"],
    queryFn: () => ResourcesService.readResources({ limit: 100 }),
  })

  // Calculate stats
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  let todosDue = 0
  let milestonesDue = 0
  let subjectsDue = 0
  let totalTodos = 0
  let totalMilestones = 0
  let totalSubjects = 0

  // Count todos
  if (todosResponse?.data) {
    totalTodos = todosResponse.data.length
    todosDue = todosResponse.data.filter((todo) => {
      if (!todo.due_date) return false
      const dueDate = new Date(todo.due_date)
      return dueDate >= now && dueDate <= nextWeek
    }).length
  }

  // Count milestones
  if (roadmapsResponse?.data) {
    roadmapsResponse.data.forEach((roadmap) => {
      if (roadmap.milestones) {
        totalMilestones += roadmap.milestones.length
        milestonesDue += roadmap.milestones.filter((milestone) => {
          if (!milestone.due_date) return false
          const dueDate = new Date(milestone.due_date)
          return dueDate >= now && dueDate <= nextWeek
        }).length
      }
    })
  }

  // Count subjects
  if (resourcesResponse?.data) {
    resourcesResponse.data.forEach((resource) => {
      if (resource.subjects) {
        totalSubjects += resource.subjects.length
        subjectsDue += resource.subjects.filter((subject) => {
          if (!subject.due_date) return false
          const dueDate = new Date(subject.due_date)
          return dueDate >= now && dueDate <= nextWeek
        }).length
      }
    })
  }

  const totalDue = todosDue + milestonesDue + subjectsDue

  return (
    <Box>
      <VStack gap={6} align="stretch">
        {/* Total Due Count - Prominent Display */}
        <Box textAlign="center" p={6} bg="red.50" borderRadius="xl" border="1px" borderColor="red.200">
          <Text fontSize="4xl" fontWeight="bold" color="red.600" mb={1}>
            {totalDue}
          </Text>
          <Text fontSize="lg" color="red.600" fontWeight="medium">
            Items Due in 7 Days
          </Text>
        </Box>

        {/* Stats Cards */}
        <VStack gap={3} align="stretch">
          {/* Todos Card */}
          <Box p={4} border="1px" borderColor="blue.200" borderRadius="lg" bg="blue.50">
            <HStack justify="space-between" align="center">
              <HStack gap={3} align="center">
                <Box p={2} bg="blue.100" borderRadius="md">
                  <FiCalendar size={20} color="var(--chakra-colors-blue-600)" />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">Todos</Text>
                  <Text fontSize="xs" color="gray.500">{totalTodos} total</Text>
                </VStack>
              </HStack>
              {todosDue > 0 && (
                <Badge colorScheme="red" size="lg" px={3} py={1}>
                  {todosDue} due
                </Badge>
              )}
            </HStack>
          </Box>

          {/* Milestones Card */}
          <Box p={4} border="1px" borderColor="purple.200" borderRadius="lg" bg="purple.50">
            <HStack justify="space-between" align="center">
              <HStack gap={3} align="center">
                <Box p={2} bg="purple.100" borderRadius="md">
                  <FiTarget size={20} color="var(--chakra-colors-purple-600)" />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">Milestones</Text>
                  <Text fontSize="xs" color="gray.500">{totalMilestones} total</Text>
                </VStack>
              </HStack>
              {milestonesDue > 0 && (
                <Badge colorScheme="red" size="lg" px={3} py={1}>
                  {milestonesDue} due
                </Badge>
              )}
            </HStack>
          </Box>

          {/* Subjects Card */}
          <Box p={4} border="1px" borderColor="orange.200" borderRadius="lg" bg="orange.50">
            <HStack justify="space-between" align="center">
              <HStack gap={3} align="center">
                <Box p={2} bg="orange.100" borderRadius="md">
                  <FiClock size={20} color="var(--chakra-colors-orange-600)" />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">Subjects</Text>
                  <Text fontSize="xs" color="gray.500">{totalSubjects} total</Text>
                </VStack>
              </HStack>
              {subjectsDue > 0 && (
                <Badge colorScheme="red" size="lg" px={3} py={1}>
                  {subjectsDue} due
                </Badge>
              )}
            </HStack>
          </Box>
        </VStack>
      </VStack>
    </Box>
  )
}
