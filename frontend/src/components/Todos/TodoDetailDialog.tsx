import {
  Button,
  ButtonGroup,
  Input,
  Text,
  VStack
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type TodoPublic, TodosService, type TodoUpdate } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
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
import ChecklistManager from "./ChecklistManager"

interface TodoDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo: TodoPublic
}

export default function TodoDetailDialog({ open, onOpenChange, todo }: TodoDetailDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // Checklist items are managed independently by ChecklistManager

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TodoUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: todo.title,
      description: todo.description || "",
      status: todo.status || "todo",
    },
  })

  // seed form when open or todo changes
  useEffect(() => {
    if (!open) return
    reset({
      title: todo.title,
      description: todo.description || "",
      status: todo.status || "todo",
    })
  }, [open, reset, todo])

  const mutation = useMutation({
    mutationFn: async (data: TodoUpdate) => {
      await TodosService.updateTodoEndpoint({
        id: todo.id,
        requestBody: {
          title: data.title,
          description: data.description,
          status: data.status,
        },
      })
      // Checklist CRUD is handled inline by ChecklistManager
    },
    onSuccess: () => {
      showSuccessToast("Todo updated successfully.")
    },
    onError: (err: ApiError) => handleError(err),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
      queryClient.invalidateQueries({ queryKey: ["checklist", todo.id] })
      onOpenChange(false)
    },
  })

  const onSubmit: SubmitHandler<TodoUpdate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot size={{ base: "xs", md: "lg" }} placement="center" open={open} onOpenChange={({ open }) => onOpenChange(open)}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Todo Detail</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>View or edit todo details below.</Text>
            <VStack gap={4} align="stretch">
              <Field required invalid={!!errors.title} errorText={errors.title?.message} label="Title">
                <Input
                  {...register("title", { required: "Title is required" })}
                  placeholder="Title"
                  type="text"
                />
              </Field>

              <Field invalid={!!errors.description} errorText={errors.description?.message} label="Description">
                <Input {...register("description")} placeholder="Description" type="text" />
              </Field>

              <Field invalid={!!errors.status} errorText={errors.status?.message} label="Status">
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
              
              <Field label="Checklist">
                <ChecklistManager todoId={todo.id} />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter gap={2}>
            <ButtonGroup>
              <Button variant="subtle" colorPalette="gray" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Close
              </Button>
              <Button variant="solid" type="submit" loading={isSubmitting}>
                Save
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}
