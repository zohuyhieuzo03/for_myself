import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronRight,
  FiEdit,
  FiExternalLink,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi"
import type {
  ResourcePublic,
  ResourceSubjectPublic,
  TodoCreate,
  TodoPublic,
} from "@/client"
import { ResourcesService, TodosService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import TodoCard from "../Todos/TodoCard"
import TodoDetailDialog from "../Todos/TodoDetailDialog"
import { ResourceForm } from "./ResourceForm"
import { ResourceSubjectForm } from "./ResourceSubjectForm"

interface ResourceDetailProps {
  resourceId: string
}

interface SubjectItemProps {
  subject: ResourceSubjectPublic
  onToggle: (subjectId: string, isCompleted: boolean) => void
  onEdit: (subjectId: string) => void
  onDelete: (subjectId: string) => void
}

function SubjectItem({
  subject,
  onToggle,
  onEdit,
  onDelete,
}: SubjectItemProps) {
  const [showTodos, setShowTodos] = useState(false)
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [newTodoTitle, setNewTodoTitle] = useState("")
  const [selectedTodo, setSelectedTodo] = useState<TodoPublic | null>(null)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Query todos for this subject
  const { data: todosResponse, isLoading: todosLoading } = useQuery({
    queryKey: ["subject-todos", subject.id],
    queryFn: () => TodosService.readTodosBySubject({ subjectId: subject.id }),
    enabled: showTodos || isAddingTodo,
  })

  const todos = todosResponse?.data || []

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: (todoData: TodoCreate) =>
      TodosService.createTodoEndpoint({
        requestBody: { ...todoData, subject_id: subject.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subject-todos", subject.id],
      })
      setShowTodos(true) // Auto-expand todos section after creating
      showSuccessToast("Todo created successfully!")
      setNewTodoTitle("")
      setIsAddingTodo(false)
    },
    onError: () => {
      showErrorToast("Failed to create todo")
    },
  })

  return (
    <Card.Root size="sm" variant="outline" mb={4}>
      <Card.Body p={4}>
        {/* Subject Header */}
        <Flex align="center" justify="space-between" mb={3}>
          <Box flex="1">
            <Flex align="center" gap={2} mb={1}>
              <input
                type="checkbox"
                checked={subject.is_completed}
                onChange={(e) => onToggle(subject.id, e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              <Text
                fontWeight="medium"
                textDecoration={subject.is_completed ? "line-through" : "none"}
              >
                {subject.title}
              </Text>
            </Flex>
            {subject.description && (
              <Text
                fontSize="sm"
                color="gray.600"
                textDecoration={subject.is_completed ? "line-through" : "none"}
              >
                {subject.description}
              </Text>
            )}
          </Box>
          <HStack>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(subject.id)}
            >
              <FiEdit />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={() => onDelete(subject.id)}
            >
              <FiTrash2 />
            </Button>
          </HStack>
        </Flex>

        {/* Todos Section */}
        <Box borderTop="1px" borderColor="gray.200" pt={3}>
          <Flex justify="space-between" align="center" mb={2}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTodos(!showTodos)}
            >
              {showTodos ? <FiChevronDown /> : <FiChevronRight />}
              Todos ({todos.length})
            </Button>
            <IconButton
              aria-label="Add todo"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAddingTodo(true)
                setShowTodos(true)
              }}
            >
              <FiPlus />
            </IconButton>
          </Flex>

          {showTodos && (
            <VStack align="stretch" gap={2}>
              {/* Quick Add Todo Input */}
              {isAddingTodo && (
                <Card.Root size="sm" variant="outline">
                  <Card.Body p={3}>
                    <HStack gap={2}>
                      <Input
                        placeholder="Enter todo title..."
                        value={newTodoTitle}
                        onChange={(e) => setNewTodoTitle(e.target.value)}
                        onKeyDown={(e) => {
                          // Ignore Enter key when composing (e.g., typing Vietnamese)
                          if (e.nativeEvent.isComposing) {
                            return
                          }

                          if (e.key === "Enter" && newTodoTitle.trim()) {
                            createTodoMutation.mutate({
                              title: newTodoTitle.trim(),
                              description: "",
                              status: "todo",
                            })
                          } else if (e.key === "Escape") {
                            setNewTodoTitle("")
                            setIsAddingTodo(false)
                          }
                        }}
                        size="sm"
                        autoFocus
                      />
                      <IconButton
                        aria-label="Cancel"
                        size="sm"
                        variant="ghost"
                        colorScheme="gray"
                        onClick={() => {
                          setNewTodoTitle("")
                          setIsAddingTodo(false)
                        }}
                      >
                        <FiX />
                      </IconButton>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              )}

              {todosLoading ? (
                <Text fontSize="sm" color="gray.500">
                  Loading todos...
                </Text>
              ) : todos.length === 0 && !isAddingTodo ? (
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
      </Card.Body>
    </Card.Root>
  )
}

export function ResourceDetail({ resourceId }: ResourceDetailProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourcePublic | null>(
    null,
  )
  const [editingSubject, setEditingSubject] = useState<string | null>(null)

  const {
    data: resource,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["resource", resourceId],
    queryFn: () => ResourcesService.readResource({ resourceId }),
  })

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: (data: any) =>
      ResourcesService.updateResource({
        resourceId: resourceId,
        requestBody: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", resourceId] })
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      setIsFormOpen(false)
      setEditingResource(null)
      showSuccessToast("Resource updated successfully")
    },
    onError: () => {
      showErrorToast("Failed to update resource")
    },
  })

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: () =>
      ResourcesService.deleteResource({ resourceId: resourceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      showSuccessToast("Resource deleted successfully")
      // Navigate back to resources list
      window.history.back()
    },
    onError: () => {
      showErrorToast("Failed to delete resource")
    },
  })

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: (data: any) =>
      ResourcesService.createResourceSubject({
        resourceId: resourceId,
        requestBody: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", resourceId] })
      setIsSubjectFormOpen(false)
      showSuccessToast("Subject created successfully")
    },
    onError: () => {
      showErrorToast("Failed to create subject")
    },
  })

  // Update subject mutation
  const updateSubjectMutation = useMutation({
    mutationFn: ({ subjectId, data }: { subjectId: string; data: any }) =>
      ResourcesService.updateResourceSubject({
        subjectId: subjectId,
        requestBody: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", resourceId] })
      setIsSubjectFormOpen(false)
      setEditingSubject(null)
      showSuccessToast("Subject updated successfully")
    },
    onError: () => {
      showErrorToast("Failed to update subject")
    },
  })

  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: (subjectId: string) =>
      ResourcesService.deleteResourceSubject({ subjectId: subjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", resourceId] })
      showSuccessToast("Subject deleted successfully")
    },
    onError: () => {
      showErrorToast("Failed to delete subject")
    },
  })

  // Toggle subject completion mutation
  const toggleSubjectMutation = useMutation({
    mutationFn: ({
      subjectId,
      isCompleted,
    }: {
      subjectId: string
      isCompleted: boolean
    }) =>
      ResourcesService.updateResourceSubject({
        subjectId: subjectId,
        requestBody: { is_completed: isCompleted },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", resourceId] })
    },
    onError: () => {
      showErrorToast("Failed to update subject")
    },
  })

  const handleEditResource = () => {
    if (resource) {
      setEditingResource(resource)
      setIsFormOpen(true)
    }
  }

  const handleDeleteResource = () => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      deleteResourceMutation.mutate()
    }
  }

  const handleResourceSubmit = (data: any) => {
    updateResourceMutation.mutate(data)
  }

  const handleEditSubject = (subjectId: string) => {
    setEditingSubject(subjectId)
    setIsSubjectFormOpen(true)
  }

  const handleAddSubject = () => {
    setEditingSubject(null)
    setIsSubjectFormOpen(true)
  }

  const handleDeleteSubject = (subjectId: string) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      deleteSubjectMutation.mutate(subjectId)
    }
  }

  const handleSubjectToggle = (subjectId: string, isCompleted: boolean) => {
    toggleSubjectMutation.mutate({ subjectId, isCompleted })
  }

  const handleSubjectSubmit = (data: any) => {
    if (editingSubject) {
      updateSubjectMutation.mutate({
        subjectId: editingSubject,
        data: data,
      })
    } else {
      createSubjectMutation.mutate(data)
    }
  }

  if (isLoading) {
    return (
      <VStack gap={4} align="stretch">
        <Text>Loading resource...</Text>
      </VStack>
    )
  }

  if (error || !resource) {
    return (
      <VStack gap={4} align="stretch">
        <Text color="red.500">Failed to load resource</Text>
        <Link to="/resources" search={{ id: undefined }}>
          <Button>
            <FiArrowLeft />
            Back to Resources
          </Button>
        </Link>
      </VStack>
    )
  }

  const completedSubjects =
    resource.subjects?.filter((s) => s.is_completed).length || 0
  const totalSubjects = resource.subjects?.length || 0
  const progressPercentage =
    totalSubjects > 0
      ? Math.round((completedSubjects / totalSubjects) * 100)
      : 0

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={4}>
          <Link to="/resources" search={{ id: undefined }}>
            <IconButton aria-label="Back to resources" variant="ghost">
              <FiArrowLeft />
            </IconButton>
          </Link>
          <Heading size="lg">{resource.title}</Heading>
        </HStack>
        <HStack gap={2}>
          <Button onClick={handleEditResource} variant="outline">
            <FiEdit />
            Edit
          </Button>
          <Button
            onClick={handleDeleteResource}
            colorScheme="red"
            variant="outline"
            loading={deleteResourceMutation.isPending}
          >
            <FiTrash2 />
            Delete
          </Button>
        </HStack>
      </Flex>

      {/* Resource Type */}
      <Flex gap={2} mb={4}>
        {resource.milestone_id && (
          <Badge colorScheme="purple" size="lg">
            Milestone Resource
          </Badge>
        )}
      </Flex>

      {/* Description */}
      {resource.description && (
        <Text mb={6} color="gray.600">
          {resource.description}
        </Text>
      )}

      {/* Progress */}
      <Box mb={6}>
        <Flex justify="space-between" mb={2}>
          <Text fontSize="lg" fontWeight="medium">
            Progress
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            {progressPercentage}%
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
            w={`${progressPercentage}%`}
            h="100%"
            bg="blue.500"
            transition="width 0.3s"
          />
        </Box>
      </Box>

      {/* URL */}
      {resource.url && (
        <Box mb={8}>
          <HStack>
            <Text fontWeight="medium">URL:</Text>
            <Button
              onClick={() =>
                resource.url &&
                window.open(resource.url, "_blank", "noopener,noreferrer")
              }
              size="sm"
              variant="outline"
              colorScheme="blue"
            >
              <FiExternalLink />
              {resource.url}
            </Button>
          </HStack>
        </Box>
      )}

      {/* Subjects */}
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Subjects</Heading>
          <Button onClick={handleAddSubject} colorScheme="blue" size="sm">
            <FiPlus />
            Add Subject
          </Button>
        </Flex>

        {totalSubjects === 0 ? (
          <Box textAlign="center" py={8} bg="gray.50" rounded="lg">
            <Text color="gray.500" mb={4}>
              No subjects added yet
            </Text>
            <Button
              onClick={handleAddSubject}
              colorScheme="blue"
              variant="outline"
            >
              <FiPlus />
              Add Your First Subject
            </Button>
          </Box>
        ) : (
          <VStack align="stretch" gap={3}>
            {resource.subjects
              ?.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
              .map((subject: ResourceSubjectPublic) => (
                <SubjectItem
                  key={subject.id}
                  subject={subject}
                  onToggle={handleSubjectToggle}
                  onEdit={handleEditSubject}
                  onDelete={handleDeleteSubject}
                />
              ))}
          </VStack>
        )}
      </Box>

      {/* Forms */}
      <ResourceForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingResource(null)
        }}
        onSubmit={handleResourceSubmit}
        initialData={editingResource || undefined}
        isEditing={true}
      />

      <ResourceSubjectForm
        isOpen={isSubjectFormOpen}
        onClose={() => {
          setIsSubjectFormOpen(false)
          setEditingSubject(null)
        }}
        onSubmit={handleSubjectSubmit}
        initialData={
          editingSubject
            ? resource.subjects?.find((s) => s.id === editingSubject)
            : undefined
        }
        isEditing={!!editingSubject}
      />
    </Box>
  )
}
