import {
  Button,
  ButtonGroup,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiCalendar } from "react-icons/fi"
import {
  FiFlag,
  FiTag,
  FiList,
  FiClock,
  FiLayers,
  FiUser,
} from "react-icons/fi"

import {
  type ResourceSubjectPublic,
  ResourcesService,
  type TodoPublic,
  TodosService,
  type TodoUpdate,
} from "@/client"
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

  // Fetch all resources and their subjects for the subject selector
  const { data: resourcesData } = useQuery({
    queryKey: ["resources"],
    queryFn: () => ResourcesService.readResources(),
    enabled: open, // Only fetch when dialog is open
  })

  // Flatten all subjects from all resources
  const allSubjects: ResourceSubjectPublic[] =
    resourcesData?.data?.flatMap((resource) => resource.subjects || []) || []

  // Checklist items are managed independently by ChecklistManager

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting },
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
      subject_id: todo.subject_id || undefined,
      scheduled_date: todo.scheduled_date
        ? new Date(todo.scheduled_date).toISOString().split("T")[0]
        : undefined,
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
      subject_id: todo.subject_id || undefined,
      scheduled_date: todo.scheduled_date
        ? new Date(todo.scheduled_date).toISOString().split("T")[0]
        : undefined,
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
          subject_id: data.subject_id,
          scheduled_date:
            data.scheduled_date && data.scheduled_date.trim() !== ""
              ? data.scheduled_date
              : null,
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
    },
  })

  const onSubmit: SubmitHandler<TodoUpdate> = (data) => {
    mutation.mutate(data)
  }

  // Autosave helper: merges current form values and persists
  const autoSaveAllFields = () => {
    const current = getValues()
    mutation.mutate({
      ...current,
      scheduled_date:
        current.scheduled_date && current.scheduled_date.trim() !== ""
          ? current.scheduled_date
          : null,
    })
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "24px",
                }}
              >
                {/* LEFT COLUMN (Trello main content) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Title */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiLayers size={16} /> Title
                    </Text>
                    <div style={{ marginTop: 6 }}>
                      <Input
                        {...register("title", { required: "Title is required" })}
                        onBlur={(e) => {
                          register("title").onBlur(e)
                          autoSaveAllFields()
                        }}
                        placeholder="Add a more detailed title..."
                        type="text"
                        style={{ fontSize: 18, fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiTag size={16} /> Description
                    </Text>
                    <div style={{ marginTop: 6 }}>
                      <Textarea
                        {...register("description")}
                        onBlur={(e) => {
                          register("description").onBlur(e)
                          autoSaveAllFields()
                        }}
                        placeholder="Add a more detailed description..."
                        rows={6}
                        resize="vertical"
                      />
                    </div>
                  </div>

                  {/* Checklist */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiList size={16} /> Checklist
                    </Text>
                    <div style={{ marginTop: 6 }}>
                      <ChecklistManager todoId={todo.id} />
                    </div>
                  </div>

                  {/* Subitems */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiLayers size={16} /> Subitems
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        width: "100%",
                        marginTop: 6,
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
                  </div>
                </div>

                {/* RIGHT SIDEBAR (Trello actions/meta) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Due Date */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiCalendar size={16} /> Due date
                    </Text>
                    <div style={{ position: "relative", width: "100%", marginTop: 6 }}>
                      <FiCalendar
                        style={{
                          position: "absolute",
                          left: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#718096",
                          pointerEvents: "none",
                        }}
                        size={16}
                      />
                      <Input
                        {...register("scheduled_date")}
                        onBlur={(e) => {
                          register("scheduled_date").onBlur(e)
                          autoSaveAllFields()
                        }}
                        placeholder="Select scheduled date"
                        type="date"
                        style={{ paddingLeft: "36px" }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiTag size={16} /> Status
                    </Text>
                    <select
                      {...register("status")}
                      onBlur={(e) => {
                        register("status").onBlur(e)
                        autoSaveAllFields()
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        marginTop: 6,
                      }}
                    >
                      {TODO_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiFlag size={16} /> Priority
                    </Text>
                    <select
                      {...register("priority")}
                      onBlur={(e) => {
                        register("priority").onBlur(e)
                        autoSaveAllFields()
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        marginTop: 6,
                      }}
                    >
                      {TODO_PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiLayers size={16} /> Type
                    </Text>
                    <select
                      {...register("type")}
                      onBlur={(e) => {
                        register("type").onBlur(e)
                        autoSaveAllFields()
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        marginTop: 6,
                      }}
                    >
                      {TODO_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiUser size={16} /> Subject
                    </Text>
                    <select
                      {...register("subject_id")}
                      onBlur={(e) => {
                        register("subject_id").onBlur(e)
                        autoSaveAllFields()
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        marginTop: 6,
                      }}
                    >
                      <option value="">No Subject</option>
                      {allSubjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estimate */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiClock size={16} /> Estimate (minutes)
                    </Text>
                    <Input
                      {...register("estimate_minutes", {
                        valueAsNumber: true,
                        min: { value: 0, message: "Estimate must be 0 or greater" },
                      })}
                      onBlur={(e) => {
                        register("estimate_minutes").onBlur(e)
                        autoSaveAllFields()
                      }}
                      placeholder="Enter estimated time"
                      type="number"
                      min="0"
                      style={{ marginTop: 6 }}
                    />
                  </div>

                  {/* Parent */}
                  <div>
                    <Text fontSize="sm" color="gray.600" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiLayers size={16} /> Parent
                    </Text>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
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
                  </div>
                </div>
              </div>
            </div>
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
