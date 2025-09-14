import {
  Button,
  ButtonGroup,
  DialogActionTrigger,
  Input,

  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"

import { type CategoryPublic, type CategoryUpdate, CategoriesService } from "@/client"
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
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface EditCategoryProps {
  category: CategoryPublic
}

const EditCategory = ({ category }: EditCategoryProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: category.name,
      grp: category.grp,
      is_envelope: category.is_envelope || true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CategoryUpdate) =>
      CategoriesService.updateCategory({ categoryId: category.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Category updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })

  const onSubmit: SubmitHandler<CategoryUpdate> = async (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <FaExchangeAlt fontSize="16px" />
          Edit Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the category details below.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Name"
              >
                <Input
                  {...register("name", {
                    required: "Name is required",
                  })}
                  placeholder="Category name"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.grp}
                errorText={errors.grp?.message}
                label="Group"
              >
                <select
                  {...register("grp", {
                    required: "Group is required",
                  })}
                >
                  <option value="needs">Needs</option>
                  <option value="wants">Wants</option>
                  <option value="savings_debt">Savings/Debt</option>
                </select>
              </Field>

              <Field
                invalid={!!errors.is_envelope}
                errorText={errors.is_envelope?.message}
                label="Envelope Category"
              >
                <input
                  type="checkbox"
                  {...register("is_envelope")}
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <ButtonGroup>
              <DialogActionTrigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="gray"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogActionTrigger>
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

export default EditCategory
