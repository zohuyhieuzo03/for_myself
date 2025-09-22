import {
  Box,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiCheck, FiEdit2, FiTrash2, FiX } from "react-icons/fi"

import {
  type ChecklistItemPublic,
  type ChecklistItemUpdate,
  TodosService,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface ChecklistItemProps {
  item: ChecklistItemPublic
  todoId: string
}

const ChecklistItem = ({ item, todoId }: ChecklistItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChecklistItemUpdate }) =>
      TodosService.updateChecklistItemEndpoint({
        checklistItemId: id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Checklist item updated successfully.")
      queryClient.invalidateQueries({ queryKey: ["todos"] })
      queryClient.invalidateQueries({ queryKey: ["checklist", todoId] })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) =>
      TodosService.deleteChecklistItemEndpoint({
        checklistItemId: id,
      }),
    onSuccess: () => {
      showSuccessToast("Checklist item deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["todos"] })
      queryClient.invalidateQueries({ queryKey: ["checklist", todoId] })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const handleToggleComplete = () => {
    updateItemMutation.mutate({
      id: item.id,
      data: { is_completed: !item.is_completed },
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditTitle(item.title)
  }

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== item.title) {
      updateItemMutation.mutate({
        id: item.id,
        data: { title: editTitle.trim() },
      })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle(item.title)
  }

  const handleDelete = () => {
    deleteItemMutation.mutate(item.id)
  }

  return (
    <Box
      p={2}
      borderRadius="md"
      bg="gray.50"
      _hover={{ bg: "gray.100" }}
      transition="background-color 0.2s"
    >
      <Flex align="center" gap={2}>
        <Checkbox.Root
          checked={item.is_completed}
          onClick={handleToggleComplete}
          disabled={updateItemMutation.isPending}
          colorPalette="green"
        >
          <Checkbox.Control />
        </Checkbox.Root>

        {isEditing ? (
          <HStack flex="1" gap={2}>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              size="sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit()
                if (e.key === "Escape") handleCancelEdit()
              }}
              autoFocus
            />
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="green"
              onClick={handleSaveEdit}
              disabled={updateItemMutation.isPending}
              aria-label="Save"
            >
              <FiCheck />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={handleCancelEdit}
              aria-label="Cancel"
            >
              <FiX />
            </IconButton>
          </HStack>
        ) : (
          <>
            <Text
              flex="1"
              fontSize="sm"
              textDecoration={item.is_completed ? "line-through" : "none"}
              color={item.is_completed ? "gray.500" : "inherit"}
            >
              {item.title}
            </Text>

            <HStack gap={1}>
              <IconButton
                size="xs"
                variant="ghost"
                colorPalette="blue"
                onClick={handleEdit}
                aria-label="Edit"
              >
                <FiEdit2 />
              </IconButton>
              <IconButton
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={handleDelete}
                disabled={deleteItemMutation.isPending}
                aria-label="Delete"
              >
                <FiTrash2 />
              </IconButton>
            </HStack>
          </>
        )}
      </Flex>
    </Box>
  )
}

export default ChecklistItem
