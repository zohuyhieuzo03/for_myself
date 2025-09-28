import { Badge, Box, Button, Flex, Heading, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiCalendar, FiEdit, FiTarget, FiTrash2 } from "react-icons/fi"

import type { RoadmapPublic } from "@/client"

interface RoadmapCardProps {
  roadmap: RoadmapPublic
  onEdit?: (roadmap: RoadmapPublic) => void
  onDelete?: (roadmap: RoadmapPublic) => void
}

export function RoadmapCard({ roadmap, onEdit, onDelete }: RoadmapCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "gray"
      case "in_progress":
        return "blue"
      case "completed":
        return "green"
      case "on_hold":
        return "yellow"
      case "cancelled":
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
        return "blue"
      case "high":
        return "orange"
      case "critical":
        return "red"
      default:
        return "gray"
    }
  }

  return (
    <Box
      p={6}
      borderWidth={1}
      borderRadius="lg"
      _hover={{ shadow: "md" }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="start" mb={4}>
        <Box flex={1}>
          <Link to="/roadmap" search={{ id: roadmap.id }}>
            <Heading size="md" mb={2} _hover={{ color: "blue.500" }}>
              {roadmap.title}
            </Heading>
          </Link>
          {roadmap.description && (
            <Text color="gray.600" mb={3}>
              {roadmap.description}
            </Text>
          )}
        </Box>
        <Flex gap={2}>
          <Badge colorScheme={getStatusColor(roadmap.status || "planning")}>
            {(roadmap.status || "planning").replace("_", " ")}
          </Badge>
          <Badge colorScheme={getPriorityColor(roadmap.priority || "medium")}>
            {roadmap.priority || "medium"}
          </Badge>
        </Flex>
      </Flex>

      {/* Progress */}
      <Box mb={4}>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="sm" color="gray.600">
            Progress
          </Text>
          <Text fontSize="sm" fontWeight="medium">
            {roadmap.progress_percentage || 0}%
          </Text>
        </Flex>
        <Box
          w="100%"
          h="8px"
          bg="gray.200"
          borderRadius="4px"
          overflow="hidden"
        >
          <Box
            w={`${roadmap.progress_percentage || 0}%`}
            h="100%"
            bg="blue.500"
            transition="width 0.3s"
          />
        </Box>
      </Box>

      {/* Dates */}
      <Flex gap={4} mb={4} fontSize="sm" color="gray.600">
        {roadmap.start_date && (
          <Flex align="center" gap={1}>
            <FiCalendar />
            <Text>
              Start: {new Date(roadmap.start_date).toLocaleDateString()}
            </Text>
          </Flex>
        )}
        {roadmap.target_date && (
          <Flex align="center" gap={1}>
            <FiTarget />
            <Text>
              Target: {new Date(roadmap.target_date).toLocaleDateString()}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Actions */}
      <Flex justify="space-between" align="center">
        <Text fontSize="sm" color="gray.500">
          {roadmap.milestones?.length || 0} milestones
        </Text>
        <Flex gap={2}>
          {onEdit && (
            <Button size="sm" variant="ghost" onClick={() => onEdit(roadmap)}>
              <FiEdit />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={() => onDelete(roadmap)}
            >
              <FiTrash2 />
              Delete
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
