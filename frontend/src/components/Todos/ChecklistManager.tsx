import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiPlus } from "react-icons/fi"

import { type ChecklistItemCreate, TodosService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import ChecklistItem from "./ChecklistItem"

interface ChecklistManagerProps {
  todoId: string
}

const ChecklistManager = ({ todoId }: ChecklistManagerProps) => {
  const [newItemTitle, setNewItemTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const { data: checklistData, isLoading } = useQuery({
    queryKey: ["checklist", todoId],
    queryFn: () => TodosService.readChecklistItems({ todoId }),
  })

  const createItemMutation = useMutation({
    mutationFn: (data: ChecklistItemCreate) =>
      TodosService.createChecklistItemEndpoint({
        todoId,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Checklist item created successfully.")
      setNewItemTitle("")
      setIsAdding(false)
      queryClient.invalidateQueries({ queryKey: ["todos"] })
      queryClient.invalidateQueries({ queryKey: ["checklist", todoId] })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const handleAddItem = () => {
    if (newItemTitle.trim()) {
      createItemMutation.mutate({
        title: newItemTitle.trim(),
        is_completed: false,
        order_index: checklistData?.data?.length || 0,
      })
    }
  }

  const checklistItems = checklistData?.data || []
  const completedCount = checklistItems.filter(
    (item) => item.is_completed,
  ).length
  const totalCount = checklistItems.length
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  if (isLoading) {
    return (
      <Box p={3}>
        <Text fontSize="sm" color="gray.500">
          Loading checklist...
        </Text>
      </Box>
    )
  }

  return (
    <Box w="100%">
      {/* Progress Bar */}
      {totalCount > 0 && (
        <Box mb={3}>
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontSize="xs" color="gray.600" fontWeight="medium">
              Progress
            </Text>
            <Text fontSize="xs" color="gray.600">
              {completedCount}/{totalCount}
            </Text>
          </Flex>
          <Box
            w="100%"
            h="4px"
            bg="gray.200"
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              w={`${progressPercentage}%`}
              h="100%"
              bg="green.400"
              transition="width 0.3s ease"
            />
          </Box>
        </Box>
      )}

      {/* Checklist Items */}
      <VStack align="stretch" gap={1} mb={3}>
        {checklistItems.map((item) => (
          <ChecklistItem key={item.id} item={item} todoId={todoId} />
        ))}
      </VStack>

      {/* Add New Item */}
      {isAdding ? (
        <HStack gap={2}>
          <Input
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Enter checklist item..."
            size="sm"
            autoFocus
            onKeyDown={(e) => {
              // Ignore Enter key when composing (e.g., typing Vietnamese)
              if (e.nativeEvent.isComposing) {
                return
              }

              if (e.key === "Enter" && newItemTitle.trim()) {
                handleAddItem()
              }
            }}
          />
          <Button
            size="sm"
            colorScheme="green"
            onClick={handleAddItem}
            disabled={!newItemTitle.trim() || createItemMutation.isPending}
            loading={createItemMutation.isPending}
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false)
              setNewItemTitle("")
            }}
          >
            Cancel
          </Button>
        </HStack>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          colorPalette="blue"
          onClick={() => setIsAdding(true)}
        >
          <FiPlus />
          Add checklist item
        </Button>
      )}
    </Box>
  )
}

export default ChecklistManager
