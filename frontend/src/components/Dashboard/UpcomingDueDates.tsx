import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { FiCalendar, FiClock, FiTarget } from "react-icons/fi"

import { TodosService, RoadmapService, ResourcesService } from "@/client"
import { formatDate } from "@/utils"

interface UpcomingItem {
  id: string
  title: string
  due_date: string
  type: "todo" | "milestone" | "subject"
  status?: string
  priority?: string
  resource_title?: string
}

export default function UpcomingDueDates() {
  // Fetch todos with due dates
  const { data: todosResponse } = useQuery({
    queryKey: ["todos", "upcoming-due"],
    queryFn: () => TodosService.readTodos({ limit: 100 }),
  })

  // Fetch roadmaps and their milestones with due dates
  const { data: roadmapsResponse } = useQuery({
    queryKey: ["roadmaps", "upcoming-due"],
    queryFn: () => RoadmapService.readRoadmaps(),
  })

  // Fetch resources and their subjects with due dates
  const { data: resourcesResponse } = useQuery({
    queryKey: ["resources", "upcoming-due"],
    queryFn: () => ResourcesService.readResources({ limit: 100 }),
  })

  // Combine and filter upcoming items
  const upcomingItems: UpcomingItem[] = []

  // Add todos with due dates
  if (todosResponse?.data) {
    todosResponse.data.forEach((todo) => {
      if (todo.due_date) {
        upcomingItems.push({
          id: todo.id,
          title: todo.title,
          due_date: todo.due_date,
          type: "todo",
          status: todo.status,
          priority: todo.priority,
        })
      }
    })
  }

  // Add milestones with due dates
  if (roadmapsResponse?.data) {
    roadmapsResponse.data.forEach((roadmap) => {
      if (roadmap.milestones) {
        roadmap.milestones.forEach((milestone) => {
          if (milestone.due_date) {
            upcomingItems.push({
              id: milestone.id,
              title: milestone.title,
              due_date: milestone.due_date,
              type: "milestone",
              status: milestone.status,
            })
          }
        })
      }
    })
  }

  // Add subjects with due dates
  if (resourcesResponse?.data) {
    resourcesResponse.data.forEach((resource) => {
      if (resource.subjects) {
        resource.subjects.forEach((subject) => {
          if (subject.due_date) {
            upcomingItems.push({
              id: subject.id,
              title: subject.title,
              due_date: subject.due_date,
              type: "subject",
              resource_title: resource.title,
            })
          }
        })
      }
    })
  }

  // Sort by due date (closest first)
  const sortedItems = upcomingItems.sort((a, b) => {
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  // Filter items due in next 7 days
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  const upcomingItemsFiltered = sortedItems.filter((item) => {
    const dueDate = new Date(item.due_date)
    return dueDate >= now && dueDate <= nextWeek
  })

  // Group by type for display
  const todos = upcomingItemsFiltered.filter((item) => item.type === "todo")
  const milestones = upcomingItemsFiltered.filter((item) => item.type === "milestone")
  const subjects = upcomingItemsFiltered.filter((item) => item.type === "subject")

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "green"
      case "in_progress":
        return "blue"
      case "blocked":
        return "red"
      case "pending":
        return "gray"
      default:
        return "gray"
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "red"
      case "medium":
        return "yellow"
      case "low":
        return "green"
      default:
        return "gray"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "todo":
        return <FiCalendar size={14} />
      case "milestone":
        return <FiTarget size={14} />
      case "subject":
        return <FiClock size={14} />
      default:
        return <FiCalendar size={14} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "todo":
        return "blue"
      case "milestone":
        return "purple"
      case "subject":
        return "orange"
      default:
        return "gray"
    }
  }

  const getItemLink = (item: UpcomingItem) => {
    switch (item.type) {
      case "todo":
        return `/todos?id=${item.id}`
      case "milestone":
        return `/roadmap`
      case "subject":
        return `/resources?id=${item.resource_title}`
      default:
        return "#"
    }
  }

  if (upcomingItemsFiltered.length === 0) {
    return (
      <Box p={6} border="1px" borderColor="gray.200" borderRadius="xl" bg="white">
        <VStack gap={4} align="stretch">
          <Flex align="center" gap={3}>
            <Box p={2} bg="gray.100" borderRadius="lg">
              <FiClock size={20} color="var(--chakra-colors-gray-600)" />
            </Box>
            <Heading size="md" color="gray.700">
              Upcoming Due Dates
            </Heading>
          </Flex>
          <Box textAlign="center" py={8}>
            <Text fontSize="sm" color="gray.500">
              No items due in the next 7 days 🎉
            </Text>
          </Box>
        </VStack>
      </Box>
    )
  }

  return (
    <Box p={6} border="1px" borderColor="gray.200" borderRadius="xl" bg="white">
      <VStack gap={4} align="stretch">
        <Flex align="center" gap={3}>
          <Box p={2} bg="red.100" borderRadius="lg">
            <FiClock size={20} color="var(--chakra-colors-red-600)" />
          </Box>
          <Heading size="md" color="gray.700">
            Upcoming Due Dates
          </Heading>
          <Badge colorScheme="red" size="lg" px={3} py={1}>
            {upcomingItemsFiltered.length}
          </Badge>
        </Flex>

        <VStack gap={3} align="stretch">
          {/* Todos */}
          {todos.map((todo) => (
            <Link key={todo.id} to={getItemLink(todo)}>
              <Box
                p={4}
                border="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                _hover={{ 
                  bg: "gray.50", 
                  borderColor: "blue.300",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                }}
                transition="all 0.2s"
              >
                <Flex justify="space-between" align="start">
                  <VStack align="start" gap={2} flex={1}>
                    <HStack gap={3} align="start">
                      <Box p={2} bg={`${getTypeColor(todo.type)}.100`} borderRadius="md">
                        <Box color={`${getTypeColor(todo.type)}.600`}>
                          {getTypeIcon(todo.type)}
                        </Box>
                      </Box>
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                          {todo.title}
                        </Text>
                        <HStack gap={1} wrap="wrap">
                          <Badge colorScheme={getStatusColor(todo.status)} size="sm">
                            {todo.status}
                          </Badge>
                          {todo.priority && (
                            <Badge colorScheme={getPriorityColor(todo.priority)} size="sm">
                              {todo.priority}
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                    <Text fontSize="xs" color="red.600" fontWeight="medium">
                      Due: {formatDate(new Date(todo.due_date))}
                    </Text>
                  </VStack>
                </Flex>
              </Box>
            </Link>
          ))}

          {/* Milestones */}
          {milestones.map((milestone) => (
            <Link key={milestone.id} to={getItemLink(milestone)}>
              <Box
                p={4}
                border="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                _hover={{ 
                  bg: "gray.50", 
                  borderColor: "purple.300",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                }}
                transition="all 0.2s"
              >
                <Flex justify="space-between" align="start">
                  <VStack align="start" gap={2} flex={1}>
                    <HStack gap={3} align="start">
                      <Box p={2} bg={`${getTypeColor(milestone.type)}.100`} borderRadius="md">
                        <Box color={`${getTypeColor(milestone.type)}.600`}>
                          {getTypeIcon(milestone.type)}
                        </Box>
                      </Box>
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                          {milestone.title}
                        </Text>
                        <HStack gap={1} wrap="wrap">
                          <Badge colorScheme={getStatusColor(milestone.status)} size="sm">
                            {milestone.status}
                          </Badge>
                        </HStack>
                      </VStack>
                    </HStack>
                    <Text fontSize="xs" color="red.600" fontWeight="medium">
                      Due: {formatDate(new Date(milestone.due_date))}
                    </Text>
                  </VStack>
                </Flex>
              </Box>
            </Link>
          ))}

          {/* Subjects */}
          {subjects.map((subject) => (
            <Link key={subject.id} to={getItemLink(subject)}>
              <Box
                p={4}
                border="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                _hover={{ 
                  bg: "gray.50", 
                  borderColor: "orange.300",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                }}
                transition="all 0.2s"
              >
                <Flex justify="space-between" align="start">
                  <VStack align="start" gap={2} flex={1}>
                    <HStack gap={3} align="start">
                      <Box p={2} bg={`${getTypeColor(subject.type)}.100`} borderRadius="md">
                        <Box color={`${getTypeColor(subject.type)}.600`}>
                          {getTypeIcon(subject.type)}
                        </Box>
                      </Box>
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                          {subject.title}
                        </Text>
                        {subject.resource_title && (
                          <Text fontSize="xs" color="gray.500">
                            in {subject.resource_title}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <Text fontSize="xs" color="red.600" fontWeight="medium">
                      Due: {formatDate(new Date(subject.due_date))}
                    </Text>
                  </VStack>
                </Flex>
              </Box>
            </Link>
          ))}
        </VStack>
      </VStack>
    </Box>
  )
}
