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

import { type IncomePublic, IncomesService, type IncomeUpdate } from "@/client"
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

interface EditIncomeProps {
  income: IncomePublic
}

const EditIncome = ({ income }: EditIncomeProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      received_at: income.received_at,
      source: income.source,
      amount: income.amount,
      currency: income.currency,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: IncomeUpdate) =>
      IncomesService.updateIncome({ incomeId: income.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Income updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] })
    },
  })

  const onSubmit: SubmitHandler<IncomeUpdate> = async (data) => {
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
          Edit Income
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the income details below.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.received_at}
                errorText={errors.received_at?.message}
                label="Received Date"
              >
                <Input
                  {...register("received_at", {
                    required: "Received date is required",
                  })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </Field>

              <Field
                required
                invalid={!!errors.source}
                errorText={errors.source?.message}
                label="Source"
              >
                <Input
                  {...register("source", {
                    required: "Source is required",
                  })}
                  placeholder="Salary, Freelance, etc."
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.amount}
                errorText={errors.amount?.message}
                label="Amount"
              >
                <Input
                  {...register("amount", {
                    required: "Amount is required",
                    min: {
                      value: 0.01,
                      message: "Amount must be greater than 0",
                    },
                  })}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                />
              </Field>

              <Field
                required
                invalid={!!errors.currency}
                errorText={errors.currency?.message}
                label="Currency"
              >
                <Input
                  {...register("currency", {
                    required: "Currency is required",
                  })}
                  placeholder="VND"
                  type="text"
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

export default EditIncome
