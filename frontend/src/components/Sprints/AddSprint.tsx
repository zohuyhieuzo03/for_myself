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

import { type SprintCreate, SprintsService } from "@/client"
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

const AddSprint = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<SprintCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      start_date: "",
      end_date: "",
      payday_anchor: "",
      is_closed: false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: SprintCreate) =>
      SprintsService.createSprint({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Sprint created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] })
    },
  })

  const onSubmit: SubmitHandler<SprintCreate> = (data) => {
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
        <Button value="add-sprint" my={4}>
          <FaPlus fontSize="16px" />
          Add Sprint
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Sprint</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new sprint.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.start_date}
                errorText={errors.start_date?.message}
                label="Start Date"
              >
                <Input
                  {...register("start_date", {
                    required: "Start date is required.",
                  })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </Field>

              <Field
                required
                invalid={!!errors.end_date}
                errorText={errors.end_date?.message}
                label="End Date"
              >
                <Input
                  {...register("end_date", {
                    required: "End date is required.",
                  })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </Field>

              <Field
                required
                invalid={!!errors.payday_anchor}
                errorText={errors.payday_anchor?.message}
                label="Payday Anchor"
              >
                <Input
                  {...register("payday_anchor", {
                    required: "Payday anchor is required.",
                  })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </Field>

              <Field
                invalid={!!errors.is_closed}
                errorText={errors.is_closed?.message}
                label="Closed"
              >
                <input type="checkbox" {...register("is_closed")} />
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

export default AddSprint
