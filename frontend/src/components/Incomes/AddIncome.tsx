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

import { type IncomeCreate, IncomesService } from "@/client"
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

interface AddIncomeProps {
  sprints: Array<{ id: string; start_date: string; end_date: string }>
}

const AddIncome = ({ sprints }: AddIncomeProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IncomeCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      received_at: "",
      source: "",
      gross_amount: 0,
      net_amount: 0,
      currency: "VND",
      sprint_id: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: IncomeCreate) =>
      IncomesService.createIncome({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Income created successfully.")
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

  const onSubmit: SubmitHandler<IncomeCreate> = (data) => {
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
        <Button value="add-income" my={4}>
          <FaPlus fontSize="16px" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new income.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.received_at}
                errorText={errors.received_at?.message}
                label="Received Date"
              >
                <Input
                  {...register("received_at", {
                    required: "Received date is required.",
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
                    required: "Source is required.",
                  })}
                  placeholder="Salary, Freelance, etc."
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.gross_amount}
                errorText={errors.gross_amount?.message}
                label="Gross Amount"
              >
                <Input
                  {...register("gross_amount", {
                    required: "Gross amount is required.",
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
                invalid={!!errors.net_amount}
                errorText={errors.net_amount?.message}
                label="Net Amount"
              >
                <Input
                  {...register("net_amount", {
                    required: "Net amount is required.",
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
                    required: "Currency is required.",
                  })}
                  placeholder="VND"
                  type="text"
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

export default AddIncome
