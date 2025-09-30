import { Button, HStack, Input, VStack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { type TodoPublic, TodosService, type TodoUpdate } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import TodoSearchDialog from "@/components/Todos/TodoSearchDialog"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface AddParentProps {
  todo: TodoPublic
  hasParent: boolean
}

export default function AddParent({ todo, hasParent }: AddParentProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [newParentTitle, setNewParentTitle] = useState("")

  const createParentAndAssignMutation = useMutation({
    mutationFn: async (title: string) => {
      const created = await TodosService.createTodoEndpoint({
        requestBody: { title },
      })
      await TodosService.updateTodoEndpoint({
        id: todo.id,
        requestBody: { parent_id: created.id } as TodoUpdate,
      })
    },
    onSuccess: () => {
      showSuccessToast("Parent created and assigned.")
      setNewParentTitle("")
    },
    onError: (err: ApiError) => handleError(err),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
      queryClient.invalidateQueries({ queryKey: ["todos", todo.id, "parent"] })
    },
  })

  const assignExistingParentMutation = useMutation({
    mutationFn: async (parentTodo: TodoPublic) => {
      await TodosService.updateTodoEndpoint({
        id: todo.id,
        requestBody: { parent_id: parentTodo.id } as TodoUpdate,
      })
    },
    onSuccess: () => {
      showSuccessToast("Parent assigned successfully.")
    },
    onError: (err: ApiError) => handleError(err),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
      queryClient.invalidateQueries({ queryKey: ["todos", todo.id, "parent"] })
    },
  })

  if (hasParent) {
    return null
  }

  return (
    <VStack gap={2} align="stretch">
      <VStack gap={2} align="stretch">
        <Input
          value={newParentTitle}
          onChange={(e) => setNewParentTitle(e.target.value)}
          placeholder="Enter parent title"
          size="sm"
          onKeyDown={(e) => {
            // Ignore Enter key when composing (e.g., typing Vietnamese)
            if (e.nativeEvent.isComposing) {
              return
            }
            
            if (e.key === "Enter" && newParentTitle.trim()) {
              createParentAndAssignMutation.mutate(newParentTitle.trim())
            }
          }}
        />
        <HStack gap={2}>
          <Button
            size="sm"
            variant="solid"
            onClick={() =>
              newParentTitle.trim() &&
              createParentAndAssignMutation.mutate(newParentTitle.trim())
            }
            loading={createParentAndAssignMutation.isPending}
            flex={1}
          >
            Create & Add
          </Button>
          <TodoSearchDialog
            onSelectTodo={(selectedTodo) =>
              assignExistingParentMutation.mutate(selectedTodo)
            }
            excludeIds={[todo.id]} // Exclude current todo and its children
            triggerText="Select Existing"
            title="Select Parent Todo"
            placeholder="Search for parent todo..."
          />
        </HStack>
      </VStack>
    </VStack>
  )
}
