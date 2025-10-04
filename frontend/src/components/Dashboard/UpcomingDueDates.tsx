import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { FiCalendar, FiClock, FiTarget } from "react-icons/fi"

import { ResourcesService, RoadmapService, TodosService } from "@/client"
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
  const [visibleItems, setVisibleItems] = useState(5)

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

  // Add todos with due dates (excluding completed and archived)
  if (todosResponse?.data) {
    todosResponse.data.forEach((todo) => {
      if (todo.due_date && todo.status !== "done" && todo.status !== "archived") {
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

  // Add milestones with due dates (excluding done and archived)
  if (roadmapsResponse?.data) {
    roadmapsResponse.data.forEach((roadmap) => {
      if (roadmap.milestones) {
        roadmap.milestones.forEach((milestone) => {
          if (milestone.due_date && milestone.status !== "completed" && milestone.status !== "blocked") {
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

  // Add subjects with due dates (excluding done and archived)
  if (resourcesResponse?.data) {
    resourcesResponse.data.forEach((resource) => {
      if (resource.subjects) {
        resource.subjects.forEach((subject) => {
          if (subject.due_date && subject.is_completed === false) {
            upcomingItems.push({
              id: subject.id,
              title: subject.title,
              due_date: subject.due_date,
              type: "subject",
              resource_title: resource.title,
              status: subject.is_completed ? "completed" : "pending",
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

  // Get visible items
  const visibleUpcomingItems = upcomingItemsFiltered.slice(0, visibleItems)
  const hasMoreItems = upcomingItemsFiltered.length > visibleItems

  const handleShowMore = () => {
    setVisibleItems((prev) => Math.min(prev + 5, upcomingItemsFiltered.length))
  }

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
      <Box
        p={6}
        border="1px"
        borderColor="gray.200"
        borderRadius="xl"
        bg="white"
      >
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

        <VStack gap={2} align="stretch">
          {/* Render visible items */}
          {visibleUpcomingItems.map((item) => (
            <Link key={item.id} to={getItemLink(item)}>
              <Box
                p={3}
                border="1px"
                borderColor="gray.200"
                borderRadius="md"
                bg="white"
                _hover={{
                  bg: "gray.50",
                  borderColor: `${getTypeColor(item.type)}.300`,
                  transform: "translateY(-1px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
                transition="all 0.2s"
              >
                <HStack gap={3} align="center" justify="space-between">
                  <HStack gap={2} align="center" flex={1} minW={0}>
                    <Box
                      p={1.5}
                      bg={`${getTypeColor(item.type)}.100`}
                      borderRadius="sm"
                      flexShrink={0}
                    >
                      <Box color={`${getTypeColor(item.type)}.600`}>
                        {getTypeIcon(item.type)}
                      </Box>
                    </Box>
                    <VStack align="start" gap={0.5} flex={1} minW={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.800"
                        title={item.title}
                      >
                        {item.title}
                      </Text>
                      <HStack gap={1} wrap="wrap">
                        {item.status && (
                          <Badge
                            colorScheme={getStatusColor(item.status)}
                            size="xs"
                            fontSize="xs"
                            px={1.5}
                            py={0.5}
                          >
                            {item.status}
                          </Badge>
                        )}
                        {item.priority && (
                          <Badge
                            colorScheme={getPriorityColor(item.priority)}
                            size="xs"
                            fontSize="xs"
                            px={1.5}
                            py={0.5}
                          >
                            {item.priority}
                          </Badge>
                        )}
                      </HStack>
                      {item.resource_title && (
                        <Text fontSize="xs" color="gray.500">
                          in {item.resource_title}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  <Text 
                    fontSize="xs" 
                    color="red.600" 
                    fontWeight="medium"
                    flexShrink={0}
                    textAlign="right"
                  >
                    {formatDate(new Date(item.due_date))}
                  </Text>
                </HStack>
              </Box>
            </Link>
          ))}

          {/* Show More Button */}
          {hasMoreItems && (
            <Button
              variant="outline"
              colorScheme="gray"
              size="sm"
              onClick={handleShowMore}
              mt={2}
            >
              Show More ({upcomingItemsFiltered.length - visibleItems} remaining)
            </Button>
          )}
        </VStack>
      </VStack>
    </Box>
  )
}
