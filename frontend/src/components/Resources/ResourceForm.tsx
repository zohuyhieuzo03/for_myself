import { Button, Input, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
import type { ResourceCreate, ResourceUpdate } from "@/client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface ResourceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ResourceCreate | ResourceUpdate) => void
  initialData?: Partial<ResourceCreate>
  isEditing?: boolean
  milestoneId?: string
}

export function ResourceForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  milestoneId: _milestoneId,
}: ResourceFormProps) {
  const [formData, setFormData] = useState<ResourceCreate>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    url: initialData?.url || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (field: keyof ResourceCreate, value: any) => {
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
            {isEditing ? "Edit Resource" : "Add Resource"}
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
                  placeholder="Resource title"
                />
              </Field>

              <Field label="Description">
                <Input
                  value={formData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Resource description"
                />
              </Field>

              <Field label="URL">
                <Input
                  value={formData.url || ""}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                  placeholder="https://example.com"
                  type="url"
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
