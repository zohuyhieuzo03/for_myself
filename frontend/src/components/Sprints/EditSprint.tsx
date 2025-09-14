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

import { type SprintPublic, SprintsService, type SprintUpdate } from "@/client"
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

interface EditSprintProps {
  sprint: SprintPublic
}

const EditSprint = ({ sprint }: EditSprintProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SprintUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      payday_anchor: sprint.payday_anchor,
      is_closed: sprint.is_closed || false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: SprintUpdate) =>
      SprintsService.updateSprint({ sprintId: sprint.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Sprint updated successfully.")
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

  const onSubmit: SubmitHandler<SprintUpdate> = async (data) => {
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
          Edit Sprint
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Sprint</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the sprint details below.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.start_date}
                errorText={errors.start_date?.message}
                label="Start Date"
              >
                <Input
                  {...register("start_date", {
                    required: "Start date is required",
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
                    required: "End date is required",
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
                    required: "Payday anchor is required",
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

export default EditSprint
