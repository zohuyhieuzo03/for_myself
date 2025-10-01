import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

import {
  type TodoCreate,
  type TodoStatus,
  TodosService,
  type TodoUpdate,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export function useKanbanMutations() {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // Mutation để update todo status
  const updateTodoStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TodoStatus }) =>
      TodosService.updateTodoEndpoint({
        id,
        requestBody: { status } as TodoUpdate,
      }),
    onSuccess: () => {
      showSuccessToast("Todo status updated successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  // Mutation để create todo mới
  const createTodoMutation = useMutation({
    mutationFn: (data: TodoCreate) =>
      TodosService.createTodoEndpoint({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Todo created successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  // Handler để add todo mới
  const handleAddTodo = useCallback(
    (title: string, status: TodoStatus, scheduledDate?: string) => {
      const todoData: TodoCreate = {
        title,
        description: "",
        status,
        ...(scheduledDate && { scheduled_date: scheduledDate }),
      }
      createTodoMutation.mutate(todoData)
    },
    [createTodoMutation],
  )

  return {
    updateTodoStatusMutation,
    createTodoMutation,
    handleAddTodo,
  }
}
