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
  type TransactionPublic,
  TransactionsService,
  type TransactionUpdate,
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

interface EditTransactionProps {
  transaction: TransactionPublic
  accounts: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
}

const EditTransaction = ({
  transaction,
  accounts,
  categories,
}: EditTransactionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      txn_date: transaction.txn_date,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      merchant: transaction.merchant || "",
      note: transaction.note || "",
      account_id: transaction.account_id,
      category_id: transaction.category_id || "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: TransactionUpdate) =>
      TransactionsService.updateTransaction({
        transactionId: transaction.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Transaction updated successfully.")
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

  const onSubmit: SubmitHandler<TransactionUpdate> = async (data) => {
    // Convert empty string to null for optional fields
    const processedData = {
      ...data,
      category_id: data.category_id === "" ? null : data.category_id,
    }
    mutation.mutate(processedData)
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
          Edit Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the transaction details below.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.txn_date}
                errorText={errors.txn_date?.message}
                label="Transaction Date"
              >
                <Input
                  {...register("txn_date", {
                    required: "Transaction date is required",
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
                    required: "Type is required",
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
                    required: "Account is required",
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
                <select {...register("category_id")}>
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
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

export default EditTransaction
