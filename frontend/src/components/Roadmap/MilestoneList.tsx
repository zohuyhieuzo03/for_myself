import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  IconButton,
} from "@chakra-ui/react"
import { FiEdit, FiTrash2, FiCalendar, FiMenu } from "react-icons/fi"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { RoadmapService } from "@/client"
import type { RoadmapMilestonePublic, MilestoneReorderRequest } from "@/client"
import { MilestoneForm } from "./MilestoneForm"
import useCustomToast from "@/hooks/useCustomToast"

interface MilestoneListProps {
  roadmapId: string
}

interface SortableMilestoneItemProps {
  milestone: RoadmapMilestonePublic
  onEdit: (milestone: RoadmapMilestonePublic) => void
  onDelete: (milestoneId: string) => void
  isDeleting: boolean
}

function SortableMilestoneItem({ milestone, onEdit, onDelete, isDeleting }: SortableMilestoneItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

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
    <Box
      ref={setNodeRef}
      style={style}
      p={4}
      borderWidth={1}
      borderRadius="md"
      bg={isDragging ? "gray.50" : "white"}
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
          <Box
            cursor="grab"
            p={2}
            _hover={{ bg: "gray.100" }}
            {...attributes}
            {...listeners}
          >
            <FiMenu />
          </Box>
          <IconButton
            aria-label="Edit milestone"
            size="sm"
            variant="ghost"
            onClick={() => onEdit(milestone)}
          >
            <FiEdit />
          </IconButton>
          <IconButton
            aria-label="Delete milestone"
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => onDelete(milestone.id)}
            loading={isDeleting}
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
  )
}

export function MilestoneList({ roadmapId }: MilestoneListProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<RoadmapMilestonePublic | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { data: milestones, isLoading, error } = useQuery({
    queryKey: ["milestones", roadmapId],
    queryFn: () => RoadmapService.readMilestones({ roadmapId, limit: 1000 }), // Increase limit to get more milestones
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

  const reorderMutation = useMutation({
    mutationFn: (reorderRequest: MilestoneReorderRequest) =>
      RoadmapService.reorderMilestones({ roadmapId, requestBody: reorderRequest }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", roadmapId] })
      queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] })
    },
    onError: () => {
      showErrorToast("Failed to reorder milestones")
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !milestones?.data) return

    const oldIndex = milestones.data.findIndex((item) => item.id === active.id)
    const newIndex = milestones.data.findIndex((item) => item.id === over.id)

    if (oldIndex !== newIndex) {
      const newOrder = arrayMove(milestones.data, oldIndex, newIndex)
      const milestoneIds = newOrder.map((milestone) => milestone.id)
      
      reorderMutation.mutate({ milestone_ids: milestoneIds })
    }
  }

  if (isLoading) return <div>Loading milestones...</div>
  if (error) return <div>Error loading milestones</div>

  return (
    <Box>
      {milestones?.data && milestones.data.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={milestones.data.map((milestone) => milestone.id)}
            strategy={verticalListSortingStrategy}
          >
            <VStack gap={4} align="stretch">
              {milestones.data.map((milestone) => (
                <SortableMilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </VStack>
          </SortableContext>
        </DndContext>
      ) : (
        <Box textAlign="center" py={8} color="gray.500">
          <Text>No milestones yet. Add your first milestone to get started!</Text>
        </Box>
      )}


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
