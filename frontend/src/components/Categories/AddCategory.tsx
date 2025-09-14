import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaPlus } from "react-icons/fa"

import { CategoriesService, type CategoryCreate } from "@/client"
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
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

const AddCategory = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CategoryCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      grp: "needs",
      is_envelope: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CategoryCreate) =>
      CategoriesService.createCategory({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Category created successfully.")
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

  const onSubmit: SubmitHandler<CategoryCreate> = (data) => {
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
        <Button value="add-category" my={4}>
          <FaPlus fontSize="16px" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new category.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Name"
              >
                <Input
                  {...register("name", {
                    required: "Name is required.",
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
                    required: "Group is required.",
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
                <input type="checkbox" {...register("is_envelope")} />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddCategory
