import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type TodoCreate, type TodoStatus } from "@/client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface TodoFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TodoCreate) => void
  isLoading?: boolean
  initialData?: Partial<TodoCreate>
  title?: string
}

export function TodoForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = {},
  title = "Add Todo",
}: TodoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TodoCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      description: "",
      status: "todo" as TodoStatus,
      estimate_minutes: undefined,
      priority: "medium" as const,
      type: "task" as const,
      ...initialData,
    },
  })

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      reset({
        title: "",
        description: "",
        status: "todo" as TodoStatus,
        estimate_minutes: undefined,
        priority: "medium" as const,
        type: "task" as const,
        ...initialData,
      })
    }
  }, [isOpen, reset, initialData])

  const handleFormSubmit: SubmitHandler<TodoCreate> = (data) => {
    onSubmit(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new todo.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.title}
                errorText={errors.title?.message}
                label="Title"
              >
                <Input
                  {...register("title", {
                    required: "Title is required.",
                  })}
                  placeholder="Title"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
              >
                <Input
                  {...register("description")}
                  placeholder="Description"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.status}
                errorText={errors.status?.message}
                label="Status"
              >
                <select
                  {...register("status")}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Todo</option>
                  <option value="planning">Planning</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>

              <Field
                invalid={!!errors.estimate_minutes}
                errorText={errors.estimate_minutes?.message}
                label="Estimate (minutes)"
              >
                <Input
                  {...register("estimate_minutes", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Estimate must be 0 or greater" },
                  })}
                  placeholder="Enter estimated time in minutes"
                  type="number"
                  min="0"
                />
              </Field>

              <Field
                invalid={!!errors.priority}
                errorText={errors.priority?.message}
                label="Priority"
              >
                <select
                  {...register("priority")}
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
                  <option value="urgent">Urgent</option>
                </select>
              </Field>

              <Field
                invalid={!!errors.type}
                errorText={errors.type?.message}
                label="Type"
              >
                <select
                  {...register("type")}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <option value="work">Work</option>
                  <option value="learning">Learning</option>
                  <option value="daily_life">Daily Life</option>
                  <option value="task">Task</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="finance">Finance</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting || isLoading}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}
