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
  FiEdit,
  FiExternalLink,
  FiPlus,
  FiTrash2,
} from "react-icons/fi"
import type { ResourcePublic, ResourceSubjectPublic } from "@/client"
import { ResourcesService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { ResourceForm } from "./ResourceForm"
import { ResourceSubjectForm } from "./ResourceSubjectForm"

interface ResourceDetailProps {
  resourceId: string
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
    mutationFn: ({ subjectId, isCompleted }: { subjectId: string; isCompleted: boolean }) =>
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

  const completedSubjects = resource.subjects?.filter((s) => s.is_completed).length || 0
  const totalSubjects = resource.subjects?.length || 0
  const progressPercentage = totalSubjects > 0 ? Math.round((completedSubjects / totalSubjects) * 100) : 0

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <HStack gap={4}>
          <Link to="/resources" search={{ id: undefined }}>
            <IconButton
              aria-label="Back to resources"
              variant="ghost"
            >
              <FiArrowLeft />
            </IconButton>
          </Link>
          <VStack align="start" gap={1}>
            <Heading size="lg">{resource.title}</Heading>
            {resource.milestone_id && (
              <Badge colorScheme="blue" variant="subtle">
                Milestone Resource
              </Badge>
            )}
          </VStack>
        </HStack>
        <HStack>
          <Button
            onClick={handleEditResource}
            variant="outline"
          >
            <FiEdit />
            Edit
          </Button>
          <Button
            onClick={handleDeleteResource}
            colorScheme="red"
            variant="outline"
          >
            <FiTrash2 />
            Delete
          </Button>
        </HStack>
      </Flex>

      {/* Resource Info */}
      <Box p={6} bg="gray.50" rounded="lg">
        <VStack align="stretch" gap={4}>
          {resource.description && (
            <Text>{resource.description}</Text>
          )}
          
          {resource.url && (
            <HStack>
              <Text fontWeight="medium">URL:</Text>
              <Button
                onClick={() => resource.url && window.open(resource.url, '_blank', 'noopener,noreferrer')}
                size="sm"
                variant="outline"
                colorScheme="blue"
              >
                <FiExternalLink />
                {resource.url}
              </Button>
            </HStack>
          )}

          {/* Progress */}
          <VStack align="stretch" gap={2}>
            <HStack justify="space-between">
              <Text fontWeight="medium">Progress</Text>
              <Text fontSize="sm" color="gray.600">
                {completedSubjects}/{totalSubjects} subjects completed ({progressPercentage}%)
              </Text>
            </HStack>
            <Box
              w="full"
              h={2}
              bg="gray.200"
              rounded="full"
              overflow="hidden"
            >
              <Box
                h="full"
                bg="blue.500"
                w={`${progressPercentage}%`}
                transition="width 0.3s ease"
              />
            </Box>
          </VStack>
        </VStack>
      </Box>

      {/* Subjects Section */}
      <Box>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Subjects</Heading>
          <Button
            onClick={handleAddSubject}
            colorScheme="blue"
            size="sm"
          >
            <FiPlus />
            Add Subject
          </Button>
        </Flex>

        {totalSubjects === 0 ? (
          <Box textAlign="center" py={8} bg="gray.50" rounded="lg">
            <Text color="gray.500" mb={4}>No subjects added yet</Text>
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
                <Flex
                  key={subject.id}
                  align="center"
                  p={4}
                  bg={subject.is_completed ? "green.50" : "white"}
                  rounded="lg"
                  border="1px"
                  borderColor={subject.is_completed ? "green.300" : "gray.300"}
                  shadow="sm"
                  _hover={{
                    shadow: "md",
                    borderColor: subject.is_completed ? "green.400" : "blue.300",
                    transform: "translateY(-1px)",
                    transition: "all 0.15s ease",
                  }}
                  transition="all 0.15s ease"
                >
                  <input
                    type="checkbox"
                    checked={subject.is_completed}
                    onChange={(e) =>
                      handleSubjectToggle(subject.id, e.target.checked)
                    }
                    style={{ marginRight: "16px", transform: "scale(1.2)" }}
                  />
                  <Box flex="1">
                    <Text
                      fontSize="md"
                      fontWeight="medium"
                      textDecoration={
                        subject.is_completed ? "line-through" : "none"
                      }
                      color={subject.is_completed ? "gray.500" : "gray.700"}
                    >
                      {subject.title}
                    </Text>
                    {subject.description && (
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        mt={1}
                        textDecoration={
                          subject.is_completed ? "line-through" : "none"
                        }
                      >
                        {subject.description}
                      </Text>
                    )}
                  </Box>
                  <HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditSubject(subject.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDeleteSubject(subject.id)}
                    >
                      Delete
                    </Button>
                  </HStack>
                </Flex>
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
    </VStack>
  )
}
