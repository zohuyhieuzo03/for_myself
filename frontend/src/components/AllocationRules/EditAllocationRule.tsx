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

import {
  type AllocationRulePublic,
  AllocationRulesService,
  type AllocationRuleUpdate,
} from "@/client"
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

interface EditAllocationRuleProps {
  allocationRule: AllocationRulePublic
  sprints: Array<{ id: string; start_date: string; end_date: string }>
}

const EditAllocationRule = ({
  allocationRule,
  sprints,
}: EditAllocationRuleProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AllocationRuleUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      grp: allocationRule.grp,
      percent: allocationRule.percent,
      sprint_id: allocationRule.sprint_id,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: AllocationRuleUpdate) =>
      AllocationRulesService.updateAllocationRule({
        id: allocationRule.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Allocation rule updated successfully.")
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

  const onSubmit: SubmitHandler<AllocationRuleUpdate> = async (data) => {
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
          Edit Allocation Rule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Allocation Rule</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the allocation rule details below.</Text>
            <VStack gap={4}>
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
                required
                invalid={!!errors.percent}
                errorText={errors.percent?.message}
                label="Percentage"
              >
                <Input
                  {...register("percent", {
                    required: "Percentage is required",
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
                    required: "Sprint is required",
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

export default EditAllocationRule
