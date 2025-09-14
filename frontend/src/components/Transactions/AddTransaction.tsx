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

import { type TransactionCreate, TransactionsService } from "@/client"
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

interface AddTransactionProps {
  accounts: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
  sprints: Array<{ id: string; start_date: string; end_date: string }>
}

const AddTransaction = ({ accounts, categories, sprints }: AddTransactionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TransactionCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      txn_date: "",
      type: "out",
      amount: 0,
      currency: "VND",
      merchant: "",
      note: "",
      account_id: "",
      category_id: "",
      sprint_id: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: TransactionCreate) =>
      TransactionsService.createTransaction({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Transaction created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })

  const onSubmit: SubmitHandler<TransactionCreate> = (data) => {
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
        <Button value="add-transaction" my={4}>
          <FaPlus fontSize="16px" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new transaction.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.txn_date}
                errorText={errors.txn_date?.message}
                label="Transaction Date"
              >
                <Input
                  {...register("txn_date", {
                    required: "Transaction date is required.",
                  })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </Field>

              <Field
                required
                invalid={!!errors.type}
                errorText={errors.type?.message}
                label="Type"
              >
                <select
                  {...register("type", {
                    required: "Type is required.",
                  })}
                >
                  <option value="in">Income</option>
                  <option value="out">Expense</option>
                </select>
              </Field>

              <Field
                required
                invalid={!!errors.amount}
                errorText={errors.amount?.message}
                label="Amount"
              >
                <Input
                  {...register("amount", {
                    required: "Amount is required.",
                    min: { value: 0.01, message: "Amount must be greater than 0" },
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
                invalid={!!errors.merchant}
                errorText={errors.merchant?.message}
                label="Merchant"
              >
                <Input
                  {...register("merchant")}
                  placeholder="Merchant name"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.note}
                errorText={errors.note?.message}
                label="Note"
              >
                <Input
                  {...register("note")}
                  placeholder="Transaction note"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.account_id}
                errorText={errors.account_id?.message}
                label="Account"
              >
                <select
                  {...register("account_id", {
                    required: "Account is required.",
                  })}
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                invalid={!!errors.category_id}
                errorText={errors.category_id?.message}
                label="Category"
              >
                <select
                  {...register("category_id")}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                invalid={!!errors.sprint_id}
                errorText={errors.sprint_id?.message}
                label="Sprint"
              >
                <select
                  {...register("sprint_id")}
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

export default AddTransaction
