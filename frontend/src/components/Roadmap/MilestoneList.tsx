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
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import {
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiEdit,
  FiMenu,
  FiPlus,
  FiTrash2,
} from "react-icons/fi"
import type {
  MilestoneReorderRequest,
  RoadmapMilestonePublic,
  TodoCreate,
  TodoPublic,
  ResourceCreate,
  ResourceUpdate,
  ResourcePublic,
  ResourceSubjectCreate,
  ResourceSubjectUpdate,
} from "@/client"
import { RoadmapService, ResourcesService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import TodoCard from "../Todos/TodoCard"
import TodoDetailDialog from "../Todos/TodoDetailDialog"
import { TodoForm } from "../Todos/TodoForm"
import { ResourceForm } from "../Resources/ResourceForm"
import { ResourceSubjectForm } from "../Resources/ResourceSubjectForm"
import { MilestoneForm } from "./MilestoneForm"

interface MilestoneListProps {
  roadmapId: string
}

interface SortableMilestoneItemProps {
  milestone: RoadmapMilestonePublic
  onEdit: (milestone: RoadmapMilestonePublic) => void
  onDelete: (milestoneId: string) => void
  isDeleting: boolean
  roadmapId: string
}

function SortableMilestoneItem({
  milestone,
  onEdit,
  onDelete,
  isDeleting,
  roadmapId,
}: SortableMilestoneItemProps) {
  const [showTodos, setShowTodos] = useState(false)
  const [isTodoFormOpen, setIsTodoFormOpen] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<TodoPublic | null>(null)
  const [showResources, setShowResources] = useState(false)
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourcePublic | null>(null)
  const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<string | null>(null)
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  // Query todos for this milestone
  const { data: todosResponse, isLoading: todosLoading } = useQuery({
    queryKey: ["milestone-todos", milestone.id],
    queryFn: () => {
      console.log("Fetching todos for milestone:", milestone.id)
      return RoadmapService.readMilestoneTodos({
        roadmapId,
        milestoneId: milestone.id,
      })
    },
    enabled: showTodos || isTodoFormOpen,
  })

  const todos = todosResponse?.data || []
  console.log(
    "Todos for milestone:",
    milestone.id,
    "count:",
    todos.length,
    "data:",
    todos,
  )

  // Query resources for this milestone
  const { data: resourcesResponse, isLoading: resourcesLoading } = useQuery({
    queryKey: ["milestone-resources", milestone.id],
    queryFn: () => {
      console.log("Fetching resources for milestone:", milestone.id)
      return ResourcesService.readResources({
        milestoneId: milestone.id,
      })
    },
    enabled: showResources || isResourceFormOpen,
  })

  const resources = resourcesResponse?.data || []
  console.log(
    "Resources for milestone:",
    milestone.id,
    "count:",
    resources.length,
    "data:",
    resources,
  )

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: (todoData: TodoCreate) =>
      RoadmapService.createMilestoneTodo({
        roadmapId,
        milestoneId: milestone.id,
        requestBody: todoData,
      }),
    onSuccess: (data) => {
      console.log("Todo created successfully:", data)
      queryClient.invalidateQueries({
        queryKey: ["milestone-todos", milestone.id],
      })
      setIsTodoFormOpen(false)
      setShowTodos(true) // Auto-expand todos section after creating
      showSuccessToast("Todo created successfully!")
    },
    onError: (error: any) => {
      console.error("Failed to create todo:", error)
      showErrorToast("Failed to create todo")
    },
  })

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: (data: ResourceCreate) => ResourcesService.createResource({ 
      requestBody: { ...data, milestone_id: milestone.id }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-resources", milestone.id] })
      setIsResourceFormOpen(false)
      setShowResources(true) // Auto-expand resources section after creating
      showSuccessToast("Resource created successfully!")
    },
    onError: () => {
      showErrorToast("Failed to create resource")
    },
  })

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResourceUpdate }) =>
      ResourcesService.updateResource({ resourceId: id, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-resources", milestone.id] })
      setIsResourceFormOpen(false)
      setEditingResource(null)
      showSuccessToast("Resource updated successfully!")
    },
    onError: () => {
      showErrorToast("Failed to update resource")
    },
  })

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => ResourcesService.deleteResource({ resourceId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-resources", milestone.id] })
      showSuccessToast("Resource deleted successfully!")
    },
    onError: () => {
      showErrorToast("Failed to delete resource")
    },
  })

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: ({ resourceId, data }: { resourceId: string; data: ResourceSubjectCreate }) =>
      ResourcesService.createResourceSubject({ resourceId, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-resources", milestone.id] })
      setIsSubjectFormOpen(false)
      showSuccessToast("Subject created successfully!")
    },
    onError: () => {
      showErrorToast("Failed to create subject")
    },
  })

  // Update subject mutation
  const updateSubjectMutation = useMutation({
    mutationFn: ({ subjectId, data }: { subjectId: string; data: ResourceSubjectUpdate }) =>
      ResourcesService.updateResourceSubject({ subjectId, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-resources", milestone.id] })
      setIsSubjectFormOpen(false)
      setEditingSubject(null)
      showSuccessToast("Subject updated successfully!")
    },
    onError: () => {
      showErrorToast("Failed to update subject")
    },
  })

  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: (subjectId: string) => ResourcesService.deleteResourceSubject({ subjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-resources", milestone.id] })
      showSuccessToast("Subject deleted successfully!")
    },
    onError: () => {
      showErrorToast("Failed to delete subject")
    },
  })

  // Toggle subject completion mutation
  const toggleSubjectMutation = useMutation({
    mutationFn: ({ subjectId, isCompleted }: { subjectId: string; isCompleted: boolean }) =>
      ResourcesService.updateResourceSubject({
        subjectId,
        requestBody: { is_completed: isCompleted },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-resources", milestone.id] })
    },
    onError: () => {
      showErrorToast("Failed to update subject")
    },
  })

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
      case "pending":
        return "gray"
      case "in_progress":
        return "blue"
      case "completed":
        return "green"
      case "blocked":
        return "red"
      default:
        return "gray"
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
          <Text>
            Target: {new Date(milestone.target_date).toLocaleDateString()}
          </Text>
        </Flex>
      )}

      {/* Todo section */}
      <Box mt={3} pt={3} borderTop="1px" borderColor="gray.200">
        <Flex justify="space-between" align="center" mb={2}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTodos(!showTodos)}
          >
            {showTodos ? <FiChevronDown /> : <FiChevronRight />}
            Todos ({todos.length})
          </Button>
          <Button size="sm" onClick={() => setIsTodoFormOpen(true)}>
            <FiPlus />
            Add Todo
          </Button>
        </Flex>

        {showTodos && (
          <VStack align="stretch" gap={2}>
            {todosLoading ? (
              <Text fontSize="sm" color="gray.500">
                Loading todos...
              </Text>
            ) : todos.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                No todos yet
              </Text>
            ) : (
              todos.map((todo: TodoPublic) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  compact={true}
                  onClick={() => setSelectedTodo(todo)}
                />
              ))
            )}
          </VStack>
        )}

        {/* Todo Form Modal */}
        <TodoForm
          isOpen={isTodoFormOpen}
          onClose={() => setIsTodoFormOpen(false)}
          onSubmit={createTodoMutation.mutate}
          isLoading={createTodoMutation.isPending}
          initialData={{ milestone_id: milestone.id }}
          title={`Add Todo to ${milestone.title}`}
        />

        {/* Todo Detail Dialog */}
        {selectedTodo && (
          <TodoDetailDialog
            open={!!selectedTodo}
            onOpenChange={(open) => {
              if (!open) setSelectedTodo(null)
            }}
            todo={selectedTodo}
          />
        )}
      </Box>

      {/* Resources Section */}
      <Box mt={3} pt={3} borderTop="1px" borderColor="gray.200">
        <Flex justify="space-between" align="center" mb={2}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowResources(!showResources)}
          >
            {showResources ? <FiChevronDown /> : <FiChevronRight />}
            Resources ({resources.length})
          </Button>
          <Button size="sm" onClick={() => setIsResourceFormOpen(true)}>
            <FiPlus />
            Add Resource
          </Button>
        </Flex>

        {showResources && (
          <VStack align="stretch" gap={2}>
            {resourcesLoading ? (
              <Text fontSize="sm" color="gray.500">
                Loading resources...
              </Text>
            ) : resources.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                No resources yet
              </Text>
            ) : (
              resources.map((resource: ResourcePublic) => (
                <Box
                  key={resource.id}
                  p={3}
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="white"
                >
                  <Flex justify="space-between" align="start" mb={2}>
                    <Box flex="1">
                      <Text fontWeight="medium" fontSize="sm">
                        {resource.title}
                      </Text>
                      {resource.description && (
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          {resource.description}
                        </Text>
                      )}
                      {resource.url && (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <Button size="xs" mt={2}>
                            Open Link
                          </Button>
                        </a>
                      )}
                    </Box>
                    <HStack>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setEditingResource(resource)
                          setIsResourceFormOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this resource?")) {
                            deleteResourceMutation.mutate(resource.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </Flex>

                  {/* Subjects */}
                  {resource.subjects && resource.subjects.length > 0 && (
                    <Box mt={2} pt={2} borderTop="1px" borderColor="gray.100">
                      <Text fontSize="xs" fontWeight="medium" mb={1}>
                        Subjects ({resource.subjects.filter(s => s.is_completed).length}/{resource.subjects.length})
                      </Text>
                      <VStack align="stretch" gap={1}>
                        {resource.subjects
                          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                          .map((subject) => (
                            <Flex key={subject.id} align="center" gap={2}>
                              <input
                                type="checkbox"
                                checked={subject.is_completed}
                                onChange={(e) => toggleSubjectMutation.mutate({ 
                                  subjectId: subject.id, 
                                  isCompleted: e.target.checked 
                                })}
                                style={{ marginRight: "8px" }}
                              />
                              <Text
                                fontSize="xs"
                                textDecoration={subject.is_completed ? "line-through" : "none"}
                                color={subject.is_completed ? "gray.500" : "inherit"}
                                flex="1"
                              >
                                {subject.title}
                              </Text>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => {
                                  setEditingSubject(subject.id)
                                  setIsSubjectFormOpen(true)
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this subject?")) {
                                    deleteSubjectMutation.mutate(subject.id)
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </Flex>
                          ))}
                      </VStack>
                    </Box>
                  )}
                </Box>
              ))
            )}
          </VStack>
        )}

        {/* Resource Form Modal */}
        <ResourceForm
          isOpen={isResourceFormOpen}
          onClose={() => {
            setIsResourceFormOpen(false)
            setEditingResource(null)
          }}
          onSubmit={(data) => {
            if (editingResource) {
              updateResourceMutation.mutate({ id: editingResource.id, data: data as ResourceUpdate })
            } else {
              createResourceMutation.mutate(data as ResourceCreate)
            }
          }}
          initialData={editingResource || undefined}
          isEditing={!!editingResource}
          milestoneId={milestone.id}
        />

        {/* Subject Form Modal */}
        <ResourceSubjectForm
          isOpen={isSubjectFormOpen}
          onClose={() => {
            setIsSubjectFormOpen(false)
            setEditingSubject(null)
            setSelectedResourceId(null)
          }}
          onSubmit={(data) => {
            if (editingSubject) {
              updateSubjectMutation.mutate({ subjectId: editingSubject, data: data as ResourceSubjectUpdate })
            } else if (selectedResourceId) {
              createSubjectMutation.mutate({ resourceId: selectedResourceId, data: data as ResourceSubjectCreate })
            }
          }}
          isEditing={!!editingSubject}
        />
      </Box>
    </Box>
  )
}

export function MilestoneList({ roadmapId }: MilestoneListProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] =
    useState<RoadmapMilestonePublic | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const {
    data: milestones,
    isLoading,
    error,
  } = useQuery({
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
      RoadmapService.reorderMilestones({
        roadmapId,
        requestBody: reorderRequest,
      }),
    onMutate: async (reorderRequest) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["milestones", roadmapId] })

      // Snapshot the previous value
      const previousMilestones = queryClient.getQueryData([
        "milestones",
        roadmapId,
      ])

      // Optimistically update the query data
      if (
        previousMilestones &&
        typeof previousMilestones === "object" &&
        previousMilestones !== null &&
        "data" in previousMilestones
      ) {
        const currentData = (previousMilestones as any)
          .data as RoadmapMilestonePublic[]
        const newOrder = reorderRequest.milestone_ids
          .map((id) => currentData.find((m) => m.id === id))
          .filter(Boolean) as RoadmapMilestonePublic[]

        queryClient.setQueryData(["milestones", roadmapId], {
          ...previousMilestones,
          data: newOrder,
        })
      }

      return { previousMilestones }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousMilestones) {
        queryClient.setQueryData(
          ["milestones", roadmapId],
          context.previousMilestones,
        )
      }
      showErrorToast("Failed to reorder milestones")
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["milestones", roadmapId] })
      queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] })
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

      // This will trigger onMutate for optimistic update
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
                  roadmapId={roadmapId}
                />
              ))}
            </VStack>
          </SortableContext>
        </DndContext>
      ) : (
        <Box textAlign="center" py={8} color="gray.500">
          <Text>
            No milestones yet. Add your first milestone to get started!
          </Text>
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
