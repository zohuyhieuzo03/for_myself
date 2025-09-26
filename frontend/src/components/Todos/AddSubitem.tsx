import { Button, HStack, Input } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { type TodoPublic, TodosService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
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
      queryClient.invalidateQueries({ queryKey: ["todos", todo.id, "children"] })
    },
  })

  return (
    <HStack gap={2}>
      <Input
        value={newSubitemTitle}
        onChange={(e) => setNewSubitemTitle(e.target.value)}
        placeholder="Enter subitem title"
        size="sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && newSubitemTitle.trim()) {
            createSubitemMutation.mutate(newSubitemTitle.trim())
          }
        }}
      />
      <Button
        size="sm"
        variant="solid"
        onClick={() => newSubitemTitle.trim() && createSubitemMutation.mutate(newSubitemTitle.trim())}
        loading={createSubitemMutation.isPending}
      >
        Add subitem
      </Button>
    </HStack>
  )
}



