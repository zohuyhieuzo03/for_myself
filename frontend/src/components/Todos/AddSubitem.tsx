import { Button, HStack, Input, VStack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { type TodoPublic, TodosService, type TodoUpdate } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import TodoSearchDialog from "@/components/Todos/TodoSearchDialog"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface AddSubitemProps {
  todo: TodoPublic
}

export default function AddSubitem({ todo }: AddSubitemProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [newSubitemTitle, setNewSubitemTitle] = useState("")

  const createSubitemMutation = useMutation({
    mutationFn: async (title: string) => {
      await TodosService.createTodoEndpoint({
        requestBody: {
          title,
          parent_id: todo.id,
        },
      })
    },
    onSuccess: () => {
      showSuccessToast("Subitem created successfully.")
      setNewSubitemTitle("")
    },
    onError: (err: ApiError) => handleError(err),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
      queryClient.invalidateQueries({
        queryKey: ["todos", todo.id, "children"],
      })
    },
  })

  const assignExistingSubitemMutation = useMutation({
    mutationFn: async (subitemTodo: TodoPublic) => {
      await TodosService.updateTodoEndpoint({
        id: subitemTodo.id,
        requestBody: { parent_id: todo.id } as TodoUpdate,
      })
    },
    onSuccess: () => {
      showSuccessToast("Subitem assigned successfully.")
    },
    onError: (err: ApiError) => handleError(err),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
      queryClient.invalidateQueries({
        queryKey: ["todos", todo.id, "children"],
      })
    },
  })

  return (
    <VStack gap={2} align="stretch">
      <VStack gap={2} align="stretch">
        <Input
          value={newSubitemTitle}
          onChange={(e) => setNewSubitemTitle(e.target.value)}
          placeholder="Enter subitem title"
          size="sm"
          onKeyDown={(e) => {
            // Ignore Enter key when composing (e.g., typing Vietnamese)
            if (e.nativeEvent.isComposing) {
              return
            }
            
            if (e.key === "Enter" && newSubitemTitle.trim()) {
              createSubitemMutation.mutate(newSubitemTitle.trim())
            }
          }}
        />
        <HStack gap={2}>
          <Button
            size="sm"
            variant="solid"
            onClick={() =>
              newSubitemTitle.trim() &&
              createSubitemMutation.mutate(newSubitemTitle.trim())
            }
            loading={createSubitemMutation.isPending}
            flex={1}
          >
            Create & Add
          </Button>
          <TodoSearchDialog
            onSelectTodo={(selectedTodo) =>
              assignExistingSubitemMutation.mutate(selectedTodo)
            }
            excludeIds={[todo.id]} // Exclude current todo and its children
            triggerText="Select Existing"
            title="Select Subitem Todo"
            placeholder="Search for subitem todo..."
          />
        </HStack>
      </VStack>
    </VStack>
  )
}
