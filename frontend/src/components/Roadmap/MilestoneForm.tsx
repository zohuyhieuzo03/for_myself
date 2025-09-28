import { Button, Input, VStack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type {
  MilestoneCreate,
  MilestoneUpdate,
  RoadmapMilestonePublic,
} from "@/client"
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

interface MilestoneFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  roadmapId: string
  milestone?: RoadmapMilestonePublic
}

export function MilestoneForm({
  isOpen,
  onClose,
  onSuccess,
  roadmapId,
  milestone,
}: MilestoneFormProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [formData, setFormData] = useState({
    title: milestone?.title || "",
    description: milestone?.description || "",
    status: milestone?.status || "pending",
    target_date: milestone?.target_date || "",
  })

  // Update form data when milestone prop changes
  useEffect(() => {
    if (milestone) {
      setFormData({
        title: milestone.title || "",
        description: milestone.description || "",
        status: milestone.status || "pending",
        target_date: milestone.target_date || "",
      })
    } else {
      // Reset form when creating new milestone
      setFormData({
        title: "",
        description: "",
        status: "pending",
        target_date: "",
      })
    }
  }, [milestone])

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        status: "pending",
        target_date: "",
      })
    }
  }, [isOpen])

  const createMutation = useMutation({
    mutationFn: (data: MilestoneCreate) =>
      RoadmapService.createMilestone({ roadmapId, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", roadmapId] })
      queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] })
      showSuccessToast("Milestone created successfully!")
      onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string
      data: MilestoneUpdate
    }) =>
      RoadmapService.updateMilestone({
        roadmapId,
        milestoneId,
        requestBody: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", roadmapId] })
      queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] })
      showSuccessToast("Milestone updated successfully!")
      onSuccess()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const submitData = {
      ...formData,
      target_date: formData.target_date || undefined,
    }

    if (milestone) {
      updateMutation.mutate({ milestoneId: milestone.id, data: submitData })
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
            {milestone ? "Edit Milestone" : "Create New Milestone"}
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
                  placeholder="Enter milestone title"
                />
              </Field>

              <Field label="Description">
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter milestone description"
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
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
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
              {milestone ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
