import { Button, Input, Text, Textarea, VStack } from "@chakra-ui/react"
import { useState } from "react"
import type { ResourceSubjectCreate, ResourceSubjectUpdate } from "@/client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface ResourceSubjectFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ResourceSubjectCreate | ResourceSubjectUpdate) => void
  initialData?: Partial<ResourceSubjectCreate>
  isEditing?: boolean
}

export function ResourceSubjectForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: ResourceSubjectFormProps) {
  const [formData, setFormData] = useState<ResourceSubjectCreate>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    learning_objectives: (initialData as any)?.learning_objectives || "",
    is_completed: initialData?.is_completed || false,
    order_index: initialData?.order_index || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (
    field: keyof ResourceSubjectCreate,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <Text fontSize="lg" fontWeight="bold">
            {isEditing ? "Edit Subject" : "Add Subject"}
          </Text>
        </DialogHeader>
        <DialogCloseTrigger />

        <form onSubmit={handleSubmit}>
          <DialogBody>
            <VStack gap={4}>
              <Field label="Title" required>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Subject title"
                />
              </Field>

              <Field label="Description">
                <Input
                  value={formData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Subject description"
                />
              </Field>

              <Field label="Learning Objectives">
                <Textarea
                  value={formData.learning_objectives || ""}
                  onChange={(e) =>
                    handleInputChange("learning_objectives", e.target.value)
                  }
                  placeholder="What should be learned, key questions, required knowledge..."
                  rows={4}
                />
              </Field>

              <Field label="Order Index">
                <Input
                  value={formData.order_index}
                  onChange={(e) =>
                    handleInputChange(
                      "order_index",
                      parseInt(e.target.value, 10) || 0,
                    )
                  }
                  placeholder="0"
                  type="number"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue">
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
