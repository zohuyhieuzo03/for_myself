import { Button, ButtonGroup, Input, Text, VStack } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiCalendar } from "react-icons/fi"

import { type TodoPublic, TodosService, type TodoUpdate } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import {
  TODO_PRIORITY_OPTIONS,
  TODO_STATUS_OPTIONS,
  TODO_TYPE_OPTIONS,
} from "@/client/options"
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
import AddParent from "./AddParent"
import AddSubitem from "./AddSubitem"
import ChecklistManager from "./ChecklistManager"
import DeleteTodo from "./DeleteTodo"
import TodoCard from "./TodoCard"

interface TodoDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo: TodoPublic
}

export default function TodoDetailDialog({
  open,
  onOpenChange,
  todo,
}: TodoDetailDialogProps) {
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
      estimate_minutes: todo.estimate_minutes || undefined,
      priority: todo.priority || "medium",
      type: todo.type || "task",
      scheduled_date: todo.scheduled_date ? new Date(todo.scheduled_date).toISOString().split('T')[0] : undefined,
    },
  })

  // seed form when open or todo changes
  useEffect(() => {
    if (!open) return
    reset({
      title: todo.title,
      description: todo.description || "",
      status: todo.status || "todo",
      estimate_minutes: todo.estimate_minutes || undefined,
      priority: todo.priority || "medium",
      type: todo.type || "task",
      scheduled_date: todo.scheduled_date ? new Date(todo.scheduled_date).toISOString().split('T')[0] : undefined,
    })
  }, [open, reset, todo])

  // Fetch parent and children when dialog is open
  const { data: parentData } = useQuery({
    enabled: open,
    queryKey: ["todos", todo.id, "parent"],
    queryFn: () => TodosService.readTodoParent({ id: todo.id }),
  })

  const { data: childrenData } = useQuery({
    enabled: open,
    queryKey: ["todos", todo.id, "children"],
    queryFn: () => TodosService.readTodoChildren({ id: todo.id }),
  })

  const mutation = useMutation({
    mutationFn: async (data: TodoUpdate) => {
      await TodosService.updateTodoEndpoint({
        id: todo.id,
        requestBody: {
          title: data.title,
          description: data.description,
          status: data.status,
          estimate_minutes: data.estimate_minutes,
          priority: data.priority,
          type: data.type,
          scheduled_date: data.scheduled_date,
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

  // ========== Parent unlink logic (hooks section) ==========
  const unlinkParentMutation = useMutation({
    mutationFn: async () => {
      await TodosService.updateTodoEndpoint({
        id: todo.id,
        requestBody: { parent_id: null } as TodoUpdate,
      })
    },
    onSuccess: () => {
      showSuccessToast("Parent unlinked successfully.")
    },
    onError: (err: ApiError) => handleError(err),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", todo.id, "parent"] })
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  const handleUnlinkParent = () => {
    unlinkParentMutation.mutate()
  }

  const handleChildUnlinked = () => {
    queryClient.invalidateQueries({ queryKey: ["todos", todo.id, "children"] })
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "lg" }}
      placement="center"
      open={open}
      onOpenChange={({ open }) => onOpenChange(open)}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Todo Detail</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Field label="Parent">
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {parentData ? (
                    <VStack gap={2} align="stretch">
                      <TodoCard todo={parentData} />
                      <Button
                        size="sm"
                        variant="outline"
                        colorPalette="red"
                        onClick={handleUnlinkParent}
                        loading={unlinkParentMutation.isPending}
                      >
                        Unlink Parent
                      </Button>
                    </VStack>
                  ) : (
                    <>
                      <Text fontSize="sm" color="gray.600">
                        No parent
                      </Text>
                      <AddParent todo={todo} hasParent={false} />
                    </>
                  )}
                </div>
              </Field>

              <Field
                required
                invalid={!!errors.title}
                errorText={errors.title?.message}
                label="Title"
              >
                <Input
                  {...register("title", { required: "Title is required" })}
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
                  {TODO_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
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
                  {TODO_PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
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
                  {TODO_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                invalid={!!errors.scheduled_date}
                errorText={errors.scheduled_date?.message}
                label="Scheduled Date"
              >
                <div style={{ position: "relative", width: "100%" }}>
                  <FiCalendar 
                    style={{ 
                      position: "absolute", 
                      left: "8px", 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      color: "#718096",
                      pointerEvents: "none" 
                    }} 
                    size={16}
                  />
                  <Input
                    {...register("scheduled_date")}
                    placeholder="Select scheduled date"
                    type="date"
                    style={{
                      paddingLeft: "36px",
                    }}
                  />
                </div>
              </Field>

              <Field label="Checklist">
                <ChecklistManager todoId={todo.id} />
              </Field>

              <Field label="Subitems">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    width: "100%",
                  }}
                >
                  {(childrenData?.data ?? []).length === 0 ? (
                    <Text fontSize="sm" color="gray.600">
                      No subitems
                    </Text>
                  ) : (
                    (childrenData?.data ?? []).map((child) => (
                      <TodoCard
                        key={child.id}
                        todo={child}
                        showUnlinkButton={true}
                        onUnlink={handleChildUnlinked}
                      />
                    ))
                  )}
                  <AddSubitem todo={todo} />
                </div>
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter gap={2}>
            <ButtonGroup>
              <DeleteTodo id={todo.id} onDeleted={() => onOpenChange(false)} />
              <Button
                variant="subtle"
                colorPalette="gray"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
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
