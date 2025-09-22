import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Table,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import React, { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiCheck, FiEdit, FiEye, FiTrash2 } from "react-icons/fi"
import {
  AccountsService,
  CategoriesService,
  GmailService,
  type TransactionCreate,
} from "@/client"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import useCustomToast from "@/hooks/useCustomToast"

// Edit Email Transaction Modal Component
interface EditEmailTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  emailTransaction: any
  onSuccess: () => void
}

function EditEmailTransactionModal({
  isOpen,
  onClose,
  emailTransaction,
  onSuccess,
}: EditEmailTransactionModalProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Load categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => CategoriesService.readCategories(),
    staleTime: 5 * 60 * 1000,
  })

  const categories = categoriesData?.data || []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid, isSubmitting },
  } = useForm({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      amount: emailTransaction?.amount || 0,
      merchant: emailTransaction?.merchant || "",
      status: emailTransaction?.status || "pending",
      category_id: emailTransaction?.category_id || "",
    },
  })

  // Set initial values when emailTransaction changes
  React.useEffect(() => {
    if (emailTransaction) {
      setValue("amount", emailTransaction.amount || 0)
      setValue("merchant", emailTransaction.merchant || "")
      setValue("status", emailTransaction.status || "pending")
      setValue("category_id", emailTransaction.category_id || "")
    }
  }, [emailTransaction, setValue])

  const updateEmailTransactionMutation = useMutation({
    mutationFn: (data: any) =>
      GmailService.updateEmailTransaction({
        transactionId: emailTransaction.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Email transaction updated successfully")
      reset()
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      showErrorToast(`Failed to update transaction: ${error.message}`)
    },
  })

  const onSubmit: SubmitHandler<any> = (data) => {
    const processedData = {
      amount: data.amount || null,
      merchant: data.merchant || null,
      status: data.status,
      category_id: data.category_id === "" ? null : data.category_id,
    }

    updateEmailTransactionMutation.mutate(processedData)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Dialog.Header>
              <Dialog.Title>Edit Email Transaction</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align="stretch">
                {/* Email Info */}
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Email Details:
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Subject: {emailTransaction?.subject}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Sender: {emailTransaction?.sender}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Date:{" "}
                    {emailTransaction?.received_at
                      ? new Date(emailTransaction.received_at).toLocaleString()
                      : "N/A"}
                  </Text>
                </Box>

                {/* Edit Form */}
                <VStack gap={3} align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Amount
                    </Text>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("amount", { min: 0 })}
                      placeholder="Enter amount"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Merchant
                    </Text>
                    <Input
                      {...register("merchant")}
                      placeholder="Enter merchant name"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Status
                    </Text>
                    <select
                      {...register("status", {
                        required: "Status is required",
                      })}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processed">Processed</option>
                      <option value="ignored">Ignored</option>
                    </select>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Category
                    </Text>
                    <select
                      {...register("category_id")}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">No Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Box>
                </VStack>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                disabled={!isValid || isSubmitting}
                loading={isSubmitting}
              >
                Update Transaction
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}

// Create Transaction From Email Modal Component
interface CreateTransactionFromEmailModalProps {
  isOpen: boolean
  onClose: () => void
  emailTransaction: any
  onSuccess: () => void
}

function CreateTransactionFromEmailModal({
  isOpen,
  onClose,
  emailTransaction,
  onSuccess,
}: CreateTransactionFromEmailModalProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  // Load accounts and categories
  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => AccountsService.readAccounts(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => CategoriesService.readCategories(),
    staleTime: 5 * 60 * 1000,
  })

  const accounts = accountsData?.data || []
  const categories = categoriesData?.data || []

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TransactionCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      txn_date: getTodayDate(),
      type: emailTransaction?.transaction_type === "credit" ? "in" : "out",
      amount: emailTransaction?.amount || 0,
      currency: "VND",
      merchant: emailTransaction?.merchant || "",
      note: emailTransaction?.subject || "",
      account_id: "",
      category_id: emailTransaction?.category_id || "",
    },
  })

  // Set initial values when emailTransaction changes
  React.useEffect(() => {
    if (emailTransaction) {
      setValue(
        "type",
        emailTransaction.transaction_type === "credit" ? "in" : "out",
      )
      setValue("amount", emailTransaction.amount || 0)
      setValue("merchant", emailTransaction.merchant || "")
      setValue("note", emailTransaction.subject || "")
      setValue("category_id", emailTransaction.category_id || "")
    }
  }, [emailTransaction, setValue])

  const createTransactionFromEmailMutation = useMutation({
    mutationFn: (data: TransactionCreate) => {
      const transactionType = data.type === "in" ? "income" : "expense"
      return GmailService.createTransactionFromEmail({
        emailTransactionId: emailTransaction.id,
        accountId: data.account_id,
        categoryId: data.category_id === "" ? null : data.category_id,
        note: data.note,
        transactionType,
      })
    },
    onSuccess: () => {
      showSuccessToast("Transaction created successfully")
      reset()
      onSuccess()
      onClose()
      // Invalidate both email transactions and regular transactions queries
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
    onError: (error: any) => {
      showErrorToast(`Failed to create transaction: ${error.message}`)
    },
  })

  const onSubmit: SubmitHandler<TransactionCreate> = (data) => {
    createTransactionFromEmailMutation.mutate(data)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Dialog.Header>
              <Dialog.Title>Create Transaction from Email</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align="stretch">
                {/* Email Info */}
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    From Email:
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Subject: {emailTransaction?.subject}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Sender: {emailTransaction?.sender}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Amount:{" "}
                    {emailTransaction?.amount
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          maximumFractionDigits: 0,
                        }).format(emailTransaction.amount)
                      : "N/A"}
                  </Text>
                </Box>

                {/* Transaction Form */}
                <VStack gap={3} align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Date
                    </Text>
                    <Input
                      type="date"
                      {...register("txn_date", {
                        required: "Date is required",
                      })}
                    />
                    {errors.txn_date && (
                      <Text fontSize="xs" color="red.500" mt={1}>
                        {errors.txn_date.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Type
                    </Text>
                    <select
                      {...register("type", { required: "Type is required" })}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <option value="out">Expense</option>
                      <option value="in">Income</option>
                    </select>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Amount
                    </Text>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("amount", {
                        required: "Amount is required",
                        min: 0,
                      })}
                    />
                    {errors.amount && (
                      <Text fontSize="xs" color="red.500" mt={1}>
                        {errors.amount.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Merchant
                    </Text>
                    <Input
                      {...register("merchant")}
                      placeholder="Enter merchant name"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Account
                    </Text>
                    <select
                      {...register("account_id", {
                        required: "Account is required",
                      })}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                    {errors.account_id && (
                      <Text fontSize="xs" color="red.500" mt={1}>
                        {errors.account_id.message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Category
                    </Text>
                    <select
                      {...register("category_id")}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Note
                    </Text>
                    <Input
                      {...register("note")}
                      placeholder="Enter transaction note"
                    />
                  </Box>
                </VStack>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                disabled={
                  !isValid || createTransactionFromEmailMutation.isPending
                }
                loading={createTransactionFromEmailMutation.isPending}
              >
                Create Transaction
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}

interface EmailTransactionRowProps {
  transaction: {
    id: string
    email_id: string
    subject: string
    sender: string
    received_at: string
    amount: number | null
    merchant: string | null
    account_number: string | null
    transaction_type: string | null
    status: string
    raw_content: string | null
    category_id?: string | null
    category_name?: string | null
    linked_transaction_id?: string | null
  }
  onView: (transaction: any) => void
  onEdit: (transaction: any) => void
  onDelete: (id: string) => void
  onCreateTransaction: (transaction: any) => void
  categories: { id: string; name: string }[]
  onAssignCategory: (transactionId: string, categoryId: string | null) => void
  isPlaceholderData?: boolean
}

function EmailTransactionRow({
  transaction,
  onView,
  onEdit,
  onDelete,
  onCreateTransaction,
  categories,
  onAssignCategory,
  isPlaceholderData = false,
}: EmailTransactionRowProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatAmount = (amount: number | null) => {
    if (!amount && amount !== 0) return "-"
    // Default VND formatting
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount as number)
  }

  const getRowStyle = () => {
    if (transaction.status === "processed") {
      return {
        backgroundColor: "#f0fdf4", // Light green background for processed
        opacity: 1,
      }
    }
    return {
      backgroundColor: "white",
      opacity: 1,
    }
  }

  return (
    <Table.Row style={getRowStyle()} opacity={isPlaceholderData ? 0.5 : 1}>
      <Table.Cell maxW="300px">
        <VStack align="start" gap={1}>
          <HStack gap={2} align="start">
            {transaction.status === "processed" && (
              <FiCheck
                style={{
                  color: "#16a34a",
                  marginTop: "2px",
                  fontSize: "14px",
                }}
              />
            )}
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={transaction.status === "processed" ? "green.700" : "black"}
              title={transaction.subject}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: "1.2",
                maxHeight: "2.4em",
                flex: 1,
              }}
            >
              {transaction.subject}
            </Text>
          </HStack>
          <Text
            fontSize="xs"
            color={
              transaction.status === "processed" ? "green.600" : "gray.500"
            }
            title={transaction.sender}
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {transaction.sender}
          </Text>
        </VStack>
      </Table.Cell>
      <Table.Cell w="120px">
        <Text
          fontSize="sm"
          color={transaction.status === "processed" ? "green.700" : "black"}
        >
          {formatAmount(transaction.amount)}
        </Text>
      </Table.Cell>
      <Table.Cell maxW="150px">
        <Text
          fontSize="sm"
          color={transaction.status === "processed" ? "green.700" : "black"}
          title={transaction.merchant || "-"}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {transaction.merchant || "-"}
        </Text>
      </Table.Cell>
      <Table.Cell w="100px">
        <Badge
          colorScheme={
            transaction.status === "pending"
              ? "yellow"
              : transaction.status === "processed"
                ? "green"
                : "red"
          }
          size="sm"
        >
          {transaction.status}
        </Badge>
      </Table.Cell>
      <Table.Cell w="140px">
        <select
          value={transaction.category_id || ""}
          onChange={(e) =>
            onAssignCategory(transaction.id, e.target.value || null)
          }
          style={{
            height: 28,
            paddingInline: 4,
            width: "100%",
            fontSize: "12px",
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            backgroundColor: "white",
          }}
        >
          <option value="">No Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell w="140px">
        <Text
          fontSize="sm"
          color={transaction.status === "processed" ? "green.600" : "gray.500"}
        >
          {formatDate(transaction.received_at)}
        </Text>
      </Table.Cell>
      <Table.Cell w="200px">
        <HStack gap={1} wrap="wrap">
          <Button size="xs" variant="ghost" onClick={() => onView(transaction)}>
            <FiEye />
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onEdit(transaction)}>
            <FiEdit />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            colorPalette="green"
            onClick={() => onCreateTransaction(transaction)}
          >
            Create
          </Button>
          <Button
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={() => onDelete(transaction.id)}
          >
            <FiTrash2 />
          </Button>
        </HStack>
      </Table.Cell>
    </Table.Row>
  )
}

// Query options function (like admin pattern)
function getEmailTransactionsQueryOptions({
  page,
  statusFilter,
  sortBy,
  connectionId,
}: {
  page: number
  statusFilter: string
  sortBy: string
  connectionId: string | "all"
}) {
  const skip = (page - 1) * 20 // 20 items per page
  const limit = 20

  return {
    queryKey: [
      "email-transactions",
      { page, statusFilter, sortBy, connectionId },
    ],
    queryFn: async () => {
      if (connectionId === "all") {
        // Use backend pagination for all connections
        const response = await GmailService.getEmailTransactions({
          // connectionId: undefined - Backend will handle all connections when not provided
          skip,
          limit,
          status: statusFilter === "all" ? undefined : statusFilter,
          sortBy,
        })
        return response
      }
      // Single connection
      const response = await GmailService.getEmailTransactions({
        connectionId,
        skip,
        limit,
        status: statusFilter === "all" ? undefined : statusFilter,
        sortBy,
      })
      return response
    },
    placeholderData: (previousData: any) => previousData,
    staleTime: 30 * 1000, // 30 seconds
  }
}

// Main component that uses URL search params (similar to admin page)
export function EmailTransactionsTable({
  page,
  statusFilter,
  sortBy,
  connectionId,
}: {
  page: number
  statusFilter: string
  sortBy: "date_desc" | "date_asc" | "amount_desc" | "amount_asc"
  connectionId: string | "all"
}) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const { open, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate({ from: "/email/transactions" })

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [createTransactionModalOpen, setCreateTransactionModalOpen] =
    useState(false)
  const [selectedEmailTransaction, setSelectedEmailTransaction] =
    useState<any>(null)
  const [editTransactionModalOpen, setEditTransactionModalOpen] =
    useState(false)
  const [selectedEditTransaction, setSelectedEditTransaction] =
    useState<any>(null)

  // Load connections for filter dropdown
  const { data: connectionsData } = useQuery({
    queryKey: ["gmail-connections"],
    queryFn: async () => GmailService.getGmailConnections(),
    staleTime: 5 * 60 * 1000,
  })

  // Get email transactions using the new query options function (like admin)
  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getEmailTransactionsQueryOptions({
      page,
      statusFilter,
      sortBy,
      connectionId,
    }),
  })

  const transactions = data?.data || []
  const totalCount = data?.count || 0

  // Load categories for assignment
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => CategoriesService.readCategories(),
    staleTime: 5 * 60 * 1000,
  })

  const categories = categoriesData?.data || []

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (transactionId: string) =>
      GmailService.deleteEmailTransaction({ transactionId }),
    onSuccess: () => {
      showSuccessToast("Email transaction deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
    },
    onError: (error: any) => {
      showErrorToast(`Failed to delete transaction: ${error.message}`)
    },
  })

  // Assign category mutation
  const assignCategoryMutation = useMutation({
    mutationFn: ({
      transactionId,
      categoryId,
    }: {
      transactionId: string
      categoryId: string | null
    }) =>
      GmailService.updateEmailTransaction({
        transactionId,
        requestBody: { category_id: categoryId },
      }),
    onSuccess: () => {
      showSuccessToast("Category assigned successfully")
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
    },
    onError: (error: any) => {
      showErrorToast(`Failed to assign category: ${error.message}`)
    },
  })

  const handleView = (transaction: any) => {
    setSelectedTransaction(transaction)
    onOpen()
  }

  const handleEdit = (transaction: any) => {
    setSelectedEditTransaction(transaction)
    setEditTransactionModalOpen(true)
  }

  const handleDelete = (transactionId: string) => {
    if (confirm("Are you sure you want to delete this email transaction?")) {
      deleteMutation.mutate(transactionId)
    }
  }

  const handleCreateTransaction = (emailTransaction: any) => {
    setSelectedEmailTransaction(emailTransaction)
    setCreateTransactionModalOpen(true)
  }

  const handleAssignCategory = (
    transactionId: string,
    categoryId: string | null,
  ) => {
    assignCategoryMutation.mutate({ transactionId, categoryId })
  }

  const setPage = (newPage: number) => {
    navigate({
      to: "/email/transactions",
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }

  const setStatusFilter = (newStatusFilter: string) => {
    navigate({
      to: "/email/transactions",
      search: (prev) => ({ ...prev, statusFilter: newStatusFilter, page: 1 }),
    })
  }

  const setSortBy = (
    newSortBy: "date_desc" | "date_asc" | "amount_desc" | "amount_asc",
  ) => {
    navigate({
      to: "/email/transactions",
      search: (prev) => ({ ...prev, sortBy: newSortBy, page: 1 }),
    })
  }

  const setConnectionId = (newConnectionId: string | "all") => {
    navigate({
      to: "/email/transactions",
      search: (prev) => ({ ...prev, connectionId: newConnectionId, page: 1 }),
    })
  }

  if (isLoading && !isPlaceholderData) {
    return (
      <Card.Root>
        <Card.Body textAlign="center" py={8}>
          <Spinner size="lg" />
          <Text mt={4}>Loading email transactions...</Text>
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <>
      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">Email Transactions</Heading>
            <HStack gap={2}>
              <select
                value={connectionId}
                onChange={(e) =>
                  setConnectionId(e.target.value as string | "all")
                }
                style={{ height: 32, paddingInline: 8, minWidth: 200 }}
              >
                <option value="all">All Connections</option>
                {connectionsData?.data.map((conn: any) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.gmail_email}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: 32, paddingInline: 8, minWidth: 150 }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="ignored">Ignored</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "date_desc"
                      | "date_asc"
                      | "amount_desc"
                      | "amount_asc",
                  )
                }
                style={{ height: 32, paddingInline: 8, minWidth: 150 }}
              >
                <option value="date_desc">Date (Newest)</option>
                <option value="date_asc">Date (Oldest)</option>
                <option value="amount_desc">Amount (High)</option>
                <option value="amount_asc">Amount (Low)</option>
              </select>
            </HStack>
          </Flex>
        </Card.Header>
        <Card.Body>
          {transactions.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No email transactions found.</Text>
            </Box>
          ) : (
            <>
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Subject</Table.ColumnHeader>
                    <Table.ColumnHeader>Amount</Table.ColumnHeader>
                    <Table.ColumnHeader>Merchant</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Category</Table.ColumnHeader>
                    <Table.ColumnHeader>Date</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {transactions.map((transaction: any) => (
                    <EmailTransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onCreateTransaction={handleCreateTransaction}
                      categories={categories}
                      onAssignCategory={handleAssignCategory}
                      isPlaceholderData={isPlaceholderData}
                    />
                  ))}
                </Table.Body>
              </Table.Root>

              {/* Pagination */}
              <Flex justifyContent="flex-end" mt={4}>
                <PaginationRoot
                  count={totalCount}
                  pageSize={20}
                  onPageChange={({ page }) => setPage(page)}
                >
                  <Flex>
                    <PaginationPrevTrigger />
                    <PaginationItems />
                    <PaginationNextTrigger />
                  </Flex>
                </PaginationRoot>
              </Flex>
            </>
          )}
        </Card.Body>
      </Card.Root>

      {/* Transaction Detail Dialog */}
      <Dialog.Root open={open} onOpenChange={({ open }) => !open && onClose()}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="xl">
            <Dialog.Header>
              <Dialog.Title>Email Transaction Details</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              {selectedTransaction && (
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontWeight="bold">Subject:</Text>
                    <Text>{selectedTransaction.subject}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Sender:</Text>
                    <Text>{selectedTransaction.sender}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Amount:</Text>
                    <Text>
                      {selectedTransaction.amount
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(selectedTransaction.amount)
                        : "-"}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Merchant:</Text>
                    <Text>{selectedTransaction.merchant || "-"}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Status:</Text>
                    <Badge
                      colorScheme={
                        selectedTransaction.status === "pending"
                          ? "yellow"
                          : selectedTransaction.status === "processed"
                            ? "green"
                            : "red"
                      }
                    >
                      {selectedTransaction.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Received At:</Text>
                    <Text>
                      {new Date(
                        selectedTransaction.received_at,
                      ).toLocaleString()}
                    </Text>
                  </Box>
                  {selectedTransaction.raw_content && (
                    <Box>
                      <Text fontWeight="bold">Content:</Text>
                      <Box
                        fontSize="sm"
                        bg="gray.50"
                        p={3}
                        borderRadius="md"
                        maxH="400px"
                        overflowY="auto"
                        dangerouslySetInnerHTML={{
                          __html: selectedTransaction.raw_content,
                        }}
                      />
                    </Box>
                  )}
                </VStack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => {
                  if (selectedTransaction) {
                    handleCreateTransaction(selectedTransaction)
                    onClose()
                  }
                }}
              >
                Create Transaction
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Create Transaction Modal */}
      {createTransactionModalOpen && selectedEmailTransaction && (
        <CreateTransactionFromEmailModal
          isOpen={createTransactionModalOpen}
          onClose={() => {
            setCreateTransactionModalOpen(false)
            setSelectedEmailTransaction(null)
          }}
          emailTransaction={selectedEmailTransaction}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
          }}
        />
      )}

      {/* Edit Transaction Modal */}
      {editTransactionModalOpen && selectedEditTransaction && (
        <EditEmailTransactionModal
          isOpen={editTransactionModalOpen}
          onClose={() => {
            setEditTransactionModalOpen(false)
            setSelectedEditTransaction(null)
          }}
          emailTransaction={selectedEditTransaction}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
          }}
        />
      )}
    </>
  )
}

// Simple component for dashboard/widget usage
export function EmailTransactionsList({
  limit = 10,
  connectionId,
}: {
  limit?: number
  connectionId?: string
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["email-transactions", { limit, connectionId }],
    queryFn: async () => {
      const response = await GmailService.getEmailTransactions({
        connectionId: connectionId || "all",
        skip: 0,
        limit,
        sortBy: "date_desc",
      })
      return response
    },
    staleTime: 30 * 1000,
  })

  if (isLoading) {
    return (
      <Card.Root>
        <Card.Body textAlign="center" py={4}>
          <Spinner size="sm" />
          <Text mt={2} fontSize="sm">
            Loading...
          </Text>
        </Card.Body>
      </Card.Root>
    )
  }

  const transactions = data?.data || []

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="sm">Recent Email Transactions</Heading>
      </Card.Header>
      <Card.Body>
        {transactions.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            No transactions found.
          </Text>
        ) : (
          <VStack align="stretch" gap={2}>
            {transactions.map((transaction: any) => (
              <Box
                key={transaction.id}
                p={3}
                borderWidth="1px"
                borderRadius="md"
              >
                <HStack justify="space-between">
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="medium">
                      {transaction.subject}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {transaction.sender}
                    </Text>
                  </Box>
                  <VStack align="end" gap={1}>
                    <Text fontSize="sm" fontWeight="medium">
                      {transaction.amount
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(transaction.amount)
                        : "-"}
                    </Text>
                    <Badge
                      size="sm"
                      colorScheme={
                        transaction.status === "pending"
                          ? "yellow"
                          : transaction.status === "processed"
                            ? "green"
                            : "red"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Card.Body>
    </Card.Root>
  )
}
