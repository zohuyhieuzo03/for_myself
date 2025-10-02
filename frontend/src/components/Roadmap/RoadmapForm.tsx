import { Button, Input, VStack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { RoadmapCreate, RoadmapPublic, RoadmapUpdate } from "@/client"
import { RoadmapService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface RoadmapFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  roadmap?: RoadmapPublic
}

function RoadmapForm({
  isOpen,
  onClose,
  onSuccess,
  roadmap,
}: RoadmapFormProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [formData, setFormData] = useState({
    title: roadmap?.title || "",
    description: roadmap?.description || "",
    status: roadmap?.status || "planning",
    priority: roadmap?.priority || "medium",
    start_date: roadmap?.start_date || "",
    target_date: roadmap?.target_date || "",
  })

  // Update form data when roadmap prop changes
  useEffect(() => {
    if (roadmap) {
      setFormData({
        title: roadmap.title || "",
        description: roadmap.description || "",
        status: roadmap.status || "planning",
        priority: roadmap.priority || "medium",
        start_date: roadmap.start_date || "",
        target_date: roadmap.target_date || "",
      })
    } else {
      // Reset form when creating new roadmap
      setFormData({
        title: "",
        description: "",
        status: "planning",
        priority: "medium",
        start_date: "",
        target_date: "",
      })
    }
  }, [roadmap])

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        status: "planning",
        priority: "medium",
        start_date: "",
        target_date: "",
      })
    }
  }, [isOpen])

  const createMutation = useMutation({
    mutationFn: (data: RoadmapCreate) =>
      RoadmapService.createRoadmap({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] })
      showSuccessToast("Roadmap created successfully!")
      onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoadmapUpdate }) =>
      RoadmapService.updateRoadmap({ roadmapId: id, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] })
      showSuccessToast("Roadmap updated successfully!")
      onSuccess()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const submitData = {
      ...formData,
      start_date: formData.start_date || undefined,
      target_date: formData.target_date || undefined,
    }

    if (roadmap) {
      updateMutation.mutate({ id: roadmap.id, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {roadmap ? "Edit Roadmap" : "Create New Roadmap"}
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody>
            <VStack gap={4}>
              <Field label="Title" required>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter roadmap title"
                />
              </Field>

              <Field label="Description">
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter roadmap description"
                />
              </Field>

              <Field label="Status">
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>

              <Field label="Priority">
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as any,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>

              <Field label="Start Date">
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </Field>

              <Field label="Target Date">
                <Input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) =>
                    setFormData({ ...formData, target_date: e.target.value })
                  }
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue" loading={isLoading}>
              {roadmap ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default RoadmapForm
