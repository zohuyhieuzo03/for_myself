import {
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import {
  type ResourceCreate,
  type ResourcePublic,
  type ResourceSubjectCreate,
  type ResourceSubjectUpdate,
  ResourcesService,
  type ResourceUpdate,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { ResourceCard } from "./ResourceCard"
import { ResourceForm } from "./ResourceForm"
import { ResourceSubjectForm } from "./ResourceSubjectForm"

interface ResourceListProps {
  milestoneId?: string
}

export function ResourceList({ milestoneId }: ResourceListProps) {
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false)
  const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourcePublic | null>(
    null,
  )
  const [editingSubject, setEditingSubject] = useState<string | null>(null)
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  )

  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Fetch resources
  const { data: resourcesData, isLoading } = useQuery({
    queryKey: ["resources", milestoneId],
    queryFn: () =>
      ResourcesService.readResources({
        milestoneId: milestoneId,
      }),
  })

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: (data: ResourceCreate) =>
      ResourcesService.createResource({
        requestBody: { ...data, milestone_id: milestoneId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      setIsResourceFormOpen(false)
      showSuccessToast("Resource created successfully")
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
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      setIsResourceFormOpen(false)
      setEditingResource(null)
      showSuccessToast("Resource updated successfully")
    },
    onError: () => {
      showErrorToast("Failed to update resource")
    },
  })

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) =>
      ResourcesService.deleteResource({ resourceId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      showSuccessToast("Resource deleted successfully")
    },
    onError: () => {
      showErrorToast("Failed to delete resource")
    },
  })

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: ({
      resourceId,
      data,
    }: {
      resourceId: string
      data: ResourceSubjectCreate
    }) =>
      ResourcesService.createResourceSubject({ resourceId, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      setIsSubjectFormOpen(false)
      showSuccessToast("Subject created successfully")
    },
    onError: () => {
      showErrorToast("Failed to create subject")
    },
  })

  // Update subject mutation
  const updateSubjectMutation = useMutation({
    mutationFn: ({
      subjectId,
      data,
    }: {
      subjectId: string
      data: ResourceSubjectUpdate
    }) =>
      ResourcesService.updateResourceSubject({ subjectId, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] })
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
      ResourcesService.deleteResourceSubject({ subjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] })
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
        subjectId,
        requestBody: { is_completed: isCompleted },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] })
    },
    onError: () => {
      showErrorToast("Failed to update subject")
    },
  })

  const handleCreateResource = () => {
    setEditingResource(null)
    setIsResourceFormOpen(true)
  }

  const handleEditResource = (resource: ResourcePublic) => {
    setEditingResource(resource)
    setIsResourceFormOpen(true)
  }

  const handleDeleteResource = (resource: ResourcePublic) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      deleteResourceMutation.mutate(resource.id)
    }
  }

  const handleResourceSubmit = (data: ResourceCreate | ResourceUpdate) => {
    if (editingResource) {
      updateResourceMutation.mutate({
        id: editingResource.id,
        data: data as ResourceUpdate,
      })
    } else {
      createResourceMutation.mutate(data as ResourceCreate)
    }
  }

  const handleEditSubject = (subjectId: string) => {
    setEditingSubject(subjectId)
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

  const handleSubjectSubmit = (
    data: ResourceSubjectCreate | ResourceSubjectUpdate,
  ) => {
    if (editingSubject) {
      updateSubjectMutation.mutate({
        subjectId: editingSubject,
        data: data as ResourceSubjectUpdate,
      })
    } else if (selectedResourceId) {
      createSubjectMutation.mutate({
        resourceId: selectedResourceId,
        data: data as ResourceSubjectCreate,
      })
    }
  }

  if (isLoading) {
    return <Text>Loading resources...</Text>
  }

  const resources = resourcesData?.data || []

  return (
    <Box>
      <VStack gap={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Resources</Heading>
          <Button colorScheme="blue" onClick={handleCreateResource}>
            Add Resource
          </Button>
        </HStack>

        {resources.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">No resources found</Text>
            <Button mt={4} colorScheme="blue" onClick={handleCreateResource}>
              Create your first resource
            </Button>
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={6}>
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={handleEditResource}
                onDelete={handleDeleteResource}
                onSubjectToggle={handleSubjectToggle}
                onSubjectEdit={handleEditSubject}
                onSubjectDelete={handleDeleteSubject}
              />
            ))}
          </Grid>
        )}
      </VStack>

      <ResourceForm
        isOpen={isResourceFormOpen}
        onClose={() => {
          setIsResourceFormOpen(false)
          setEditingResource(null)
        }}
        onSubmit={handleResourceSubmit}
        initialData={editingResource || undefined}
        isEditing={!!editingResource}
        milestoneId={milestoneId}
      />

      <ResourceSubjectForm
        isOpen={isSubjectFormOpen}
        onClose={() => {
          setIsSubjectFormOpen(false)
          setEditingSubject(null)
          setSelectedResourceId(null)
        }}
        onSubmit={handleSubjectSubmit}
        isEditing={!!editingSubject}
      />
    </Box>
  )
}
