import { Badge, Box, Text, VStack } from "@chakra-ui/react"
import { FiTarget } from "react-icons/fi"

import type { RoadmapMilestonePublic } from "@/client"
import { formatDate } from "@/utils"

interface MilestoneCardProps {
  milestone: RoadmapMilestonePublic
  showActions?: boolean
}

export default function MilestoneCard({ 
  milestone
}: MilestoneCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green"
      case "in_progress":
        return "blue"
      case "blocked":
        return "red"
      default:
        return "gray"
    }
  }

  return (
    <Box
      p={3}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
    >
      <VStack align="stretch" gap={2}>
        <Box>
          <Text fontWeight="semibold" fontSize="sm">
            {milestone.title}
          </Text>
          {milestone.description && (
            <Text fontSize="xs" color="gray.600">
              {milestone.description}
            </Text>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <FiTarget size={12} />
          <Badge colorPalette={getStatusColor(milestone.status || "pending")} size="xs">
            {(milestone.status || "pending").replace("_", " ")}
          </Badge>
        </Box>

        {(milestone.target_date || milestone.due_date) && (
          <Box fontSize="xs" color="gray.500">
            {milestone.target_date && (
              <Text>Target: {formatDate(new Date(milestone.target_date))}</Text>
            )}
            {milestone.due_date && (
              <Text>Due: {formatDate(new Date(milestone.due_date))}</Text>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  )
}
