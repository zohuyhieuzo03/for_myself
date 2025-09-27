import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  IconButton,
} from "@chakra-ui/react"
import { FiEdit, FiTrash2, FiPlus, FiCalendar } from "react-icons/fi"

import { RoadmapService } from "@/client"
import type { RoadmapMilestonePublic } from "@/client"
import { MilestoneForm } from "./MilestoneForm"
import useCustomToast from "@/hooks/useCustomToast"

interface MilestoneListProps {
  roadmapId: string
}

export function MilestoneList({ roadmapId }: MilestoneListProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<RoadmapMilestonePublic | null>(null)

  const { data: milestones, isLoading, error } = useQuery({
    queryKey: ["milestones", roadmapId],
    queryFn: () => RoadmapService.readMilestones({ roadmapId }),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ milestoneId }: { milestoneId: string }) =>
      RoadmapService.deleteMilestone({ roadmapId, milestoneId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", roadmapId] })
      queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] })
      showSuccessToast("Milestone deleted successfully!")
    },
  })

  const handleEdit = (milestone: RoadmapMilestonePublic) => {
    setEditingMilestone(milestone)
    setIsFormOpen(true)
  }

  const handleDelete = (milestoneId: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      deleteMutation.mutate({ milestoneId })
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingMilestone(null)
    queryClient.invalidateQueries({ queryKey: ["milestones", roadmapId] })
    queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] })
    showSuccessToast("Milestone saved successfully!")
  }

  if (isLoading) return <div>Loading milestones...</div>
  if (error) return <div>Error loading milestones</div>

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "gray"
      case "in_progress": return "blue"
      case "completed": return "green"
      case "blocked": return "red"
      default: return "gray"
    }
  }

  return (
    <Box>
      {milestones?.data && milestones.data.length > 0 ? (
        <VStack gap={4} align="stretch">
          {milestones.data.map((milestone) => (
            <Box
              key={milestone.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              _hover={{ shadow: "sm" }}
            >
              <Flex justify="space-between" align="start" mb={2}>
                <Box flex={1}>
                  <Heading size="sm" mb={1}>
                    {milestone.title}
                  </Heading>
                  {milestone.description && (
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      {milestone.description}
                    </Text>
                  )}
                </Box>
                <HStack gap={2}>
                  <Badge colorScheme={getStatusColor(milestone.status || "pending")}>
                    {(milestone.status || "pending").replace("_", " ")}
                  </Badge>
                  <IconButton
                    aria-label="Edit milestone"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(milestone)}
                  >
                    <FiEdit />
                  </IconButton>
                  <IconButton
                    aria-label="Delete milestone"
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDelete(milestone.id)}
                    loading={deleteMutation.isPending}
                  >
                    <FiTrash2 />
                  </IconButton>
                </HStack>
              </Flex>
              
              {milestone.target_date && (
                <Flex align="center" gap={1} fontSize="sm" color="gray.600">
                  <FiCalendar />
                  <Text>Target: {new Date(milestone.target_date).toLocaleDateString()}</Text>
                </Flex>
              )}
            </Box>
          ))}
        </VStack>
      ) : (
        <Box textAlign="center" py={8} color="gray.500">
          <Text>No milestones yet. Add your first milestone to get started!</Text>
        </Box>
      )}

      {/* Add Milestone Button */}
      <Flex justify="center" mt={4}>
        <Button
          onClick={() => setIsFormOpen(true)}
          colorScheme="blue"
          variant="outline"
        >
          <FiPlus />
          Add Milestone
        </Button>
      </Flex>

      {/* Milestone Form Modal */}
      <MilestoneForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        roadmapId={roadmapId}
        milestone={editingMilestone || undefined}
      />
    </Box>
  )
}
