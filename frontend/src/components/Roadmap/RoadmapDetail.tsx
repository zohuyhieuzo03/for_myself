import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import {
  FiArrowLeft,
  FiCalendar,
  FiEdit,
  FiPlus,
  FiTarget,
  FiTrash2,
} from "react-icons/fi"
import type { RoadmapPublic } from "@/client"
import { RoadmapService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { MilestoneForm } from "./MilestoneForm"
import { MilestoneList } from "./MilestoneList"
import RoadmapForm from "./RoadmapForm"

interface RoadmapDetailProps {
  roadmapId: string
}

export function RoadmapDetail({ roadmapId }: RoadmapDetailProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false)
  const [editingRoadmap, setEditingRoadmap] = useState<RoadmapPublic | null>(
    null,
  )

  const {
    data: roadmap,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["roadmap", roadmapId],
    queryFn: () => RoadmapService.readRoadmap({ roadmapId }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => RoadmapService.deleteRoadmap({ roadmapId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] })
      showSuccessToast("Roadmap deleted successfully!")
    },
  })

  const handleEdit = () => {
    if (roadmap) {
      setEditingRoadmap(roadmap)
      setIsFormOpen(true)
    }
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this roadmap?")) {
      deleteMutation.mutate()
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingRoadmap(null)
    queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] })
    showSuccessToast("Roadmap updated successfully!")
  }

  const handleMilestoneFormSuccess = () => {
    setIsMilestoneFormOpen(false)
    queryClient.invalidateQueries({ queryKey: ["milestones", roadmapId] })
    queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] })
    showSuccessToast("Milestone created successfully!")
  }

  if (isLoading) return <div>Loading...</div>
  if (error || !roadmap) return <div>Error loading roadmap</div>

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
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={4}>
          <Link to="/roadmap" search={{ id: undefined }}>
            <IconButton aria-label="Back to roadmaps" variant="ghost">
              <FiArrowLeft />
            </IconButton>
          </Link>
          <Heading size="lg">{roadmap.title}</Heading>
        </HStack>
        <HStack gap={2}>
          <Button onClick={handleEdit} variant="outline">
            <FiEdit />
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            colorScheme="red"
            variant="outline"
            loading={deleteMutation.isPending}
          >
            <FiTrash2 />
            Delete
          </Button>
        </HStack>
      </Flex>

      {/* Status and Priority */}
      <Flex gap={2} mb={4}>
        <Badge
          colorScheme={getStatusColor(roadmap.status || "planning")}
          size="lg"
        >
          {(roadmap.status || "planning").replace("_", " ")}
        </Badge>
        <Badge
          colorScheme={getPriorityColor(roadmap.priority || "medium")}
          size="lg"
        >
          {roadmap.priority || "medium"}
        </Badge>
      </Flex>

      {/* Description */}
      {roadmap.description && (
        <Text mb={6} color="gray.600">
          {roadmap.description}
        </Text>
      )}

      {/* Progress */}
      <Box mb={6}>
        <Flex justify="space-between" mb={2}>
          <Text fontSize="lg" fontWeight="medium">
            Progress
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            {roadmap.progress_percentage || 0}%
          </Text>
        </Flex>
        <Box
          w="100%"
          h="12px"
          bg="gray.200"
          borderRadius="6px"
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
      <VStack gap={2} align="stretch" mb={8}>
        {roadmap.start_date && (
          <Flex align="center" gap={2}>
            <FiCalendar />
            <Text>
              Start Date: {new Date(roadmap.start_date).toLocaleDateString()}
            </Text>
          </Flex>
        )}
        {roadmap.target_date && (
          <Flex align="center" gap={2}>
            <FiTarget />
            <Text>
              Target Date: {new Date(roadmap.target_date).toLocaleDateString()}
            </Text>
          </Flex>
        )}
        {roadmap.completed_date && (
          <Flex align="center" gap={2}>
            <FiCalendar />
            <Text>
              Completed Date:{" "}
              {new Date(roadmap.completed_date).toLocaleDateString()}
            </Text>
          </Flex>
        )}
      </VStack>

      {/* Milestones */}
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Milestones</Heading>
          <Button
            colorScheme="blue"
            size="sm"
            onClick={() => setIsMilestoneFormOpen(true)}
          >
            <FiPlus />
            Add Milestone
          </Button>
        </Flex>
        <MilestoneList roadmapId={roadmapId} />
      </Box>

      {/* Edit Form Modal */}
      <RoadmapForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        roadmap={editingRoadmap || undefined}
      />

      {/* Milestone Form Modal */}
      <MilestoneForm
        isOpen={isMilestoneFormOpen}
        onClose={() => setIsMilestoneFormOpen(false)}
        onSuccess={handleMilestoneFormSuccess}
        roadmapId={roadmapId}
      />
    </Box>
  )
}
