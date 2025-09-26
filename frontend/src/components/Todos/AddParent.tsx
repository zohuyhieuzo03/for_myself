import { Button, HStack, Input} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { type TodoPublic, TodosService, type TodoUpdate } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
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

  if (hasParent) {
    return null
  }

  return (
    <HStack gap={2}>
      <Input
        value={newParentTitle}
        onChange={(e) => setNewParentTitle(e.target.value)}
        placeholder="Enter parent title"
        size="sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && newParentTitle.trim()) {
            createParentAndAssignMutation.mutate(newParentTitle.trim())
          }
        }}
      />
      <Button
        size="sm"
        variant="solid"
        onClick={() => newParentTitle.trim() && createParentAndAssignMutation.mutate(newParentTitle.trim())}
        loading={createParentAndAssignMutation.isPending}
      >
        Add parent
      </Button>
    </HStack>
  )
}



