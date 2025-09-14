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

import { type AllocationRuleCreate, AllocationRulesService } from "@/client"
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

interface AddAllocationRuleProps {
  sprints: Array<{ id: string; start_date: string; end_date: string }>
}

const AddAllocationRule = ({ sprints }: AddAllocationRuleProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AllocationRuleCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      grp: "needs",
      percent: 0,
      sprint_id: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: AllocationRuleCreate) =>
      AllocationRulesService.createAllocationRule({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Allocation rule created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation-rules"] })
    },
  })

  const onSubmit: SubmitHandler<AllocationRuleCreate> = (data) => {
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
        <Button value="add-allocation-rule" my={4}>
          <FaPlus fontSize="16px" />
          Add Allocation Rule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Allocation Rule</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Fill in the details to add a new allocation rule.
            </Text>
            <VStack gap={4}>
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
                required
                invalid={!!errors.percent}
                errorText={errors.percent?.message}
                label="Percentage"
              >
                <Input
                  {...register("percent", {
                    required: "Percentage is required.",
                    min: {
                      value: 0.01,
                      message: "Percentage must be greater than 0",
                    },
                    max: {
                      value: 100,
                      message: "Percentage must be less than or equal to 100",
                    },
                  })}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                />
              </Field>

              <Field
                required
                invalid={!!errors.sprint_id}
                errorText={errors.sprint_id?.message}
                label="Sprint"
              >
                <select
                  {...register("sprint_id", {
                    required: "Sprint is required.",
                  })}
                >
                  <option value="">Select Sprint</option>
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.start_date} - {sprint.end_date}
                    </option>
                  ))}
                </select>
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

export default AddAllocationRule
