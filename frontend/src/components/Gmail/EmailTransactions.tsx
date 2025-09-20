import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Spinner,
  Table,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import {
  FiCheck,
  FiDollarSign,
  FiEdit,
  FiEye,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi"
import {
  AccountsService,
  CategoriesService,
  GmailService,
  IncomesService,
} from "@/client"
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import useCustomToast from "@/hooks/useCustomToast"

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
    seen: boolean
    raw_content: string | null
    category_id?: string | null
    category_name?: string | null
  }
  onView: (transaction: any) => void
  onEdit: (transaction: any) => void
  onDelete: (id: string) => void
  onMarkSeen: (id: string) => void
  onCreateTransaction: (transaction: any) => void
  onCreateIncome: (transaction: any) => void
  categories: { id: string; name: string }[]
  onAssignCategory: (transactionId: string, categoryId: string | null) => void
}

function EmailTransactionRow({
  transaction,
  onView,
  onEdit,
  onDelete,
  onMarkSeen,
  onCreateTransaction,
  onCreateIncome,
  categories,
  onAssignCategory,
}: EmailTransactionRowProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatAmount = (amount: number | null) => {
    if (!amount && amount !== 0) return "-"
    // If Remitano, show crypto amount with decimals and USDT suffix
    if ((transaction.merchant || "").toLowerCase() === "remitano") {
      return `${Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USDT`
    }
    // Default VND formatting
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount as number)
  }

  const getRowStyle = (seen: boolean) => {
    return {
      backgroundColor: seen ? "gray.50" : "white",
      opacity: seen ? 0.8 : 1,
    }
  }

  return (
    <Table.Row style={getRowStyle(transaction.seen)}>
      <Table.Cell>
        <HStack gap={2}>
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={transaction.seen ? "gray.600" : "black"}
          >
            {transaction.subject}
          </Text>
          {!transaction.seen && (
            <Badge colorScheme="blue" size="sm">
              New
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" color="gray.500">
          {transaction.sender}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <Text fontSize="sm" color={transaction.seen ? "gray.600" : "black"}>
          {formatAmount(transaction.amount)}
        </Text>
        {transaction.merchant && (
          <Text fontSize="xs" color="gray.500">
            {transaction.merchant}
          </Text>
        )}
      </Table.Cell>
      <Table.Cell>
        <select
          value={transaction.category_id || ""}
          onChange={(e) =>
            onAssignCategory(
              transaction.id,
              e.target.value === "" ? null : e.target.value,
            )
          }
          style={{
            backgroundColor: transaction.seen ? "gray.100" : "white",
            color: transaction.seen ? "gray.600" : "black",
          }}
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {transaction.category_name && (
          <Text fontSize="xs" color="gray.500" mt={1}>
            Current: {transaction.category_name}
          </Text>
        )}
      </Table.Cell>
      <Table.Cell>
        <Text fontSize="sm" color={transaction.seen ? "gray.600" : "black"}>
          {formatDate(transaction.received_at)}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <HStack gap={1}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(transaction)}
          >
            <FiEye />
          </Button>
          {!transaction.seen && (
            <Button
              size="sm"
              variant="outline"
              colorPalette="green"
              onClick={() => onMarkSeen(transaction.id)}
            >
              <FiCheck />
            </Button>
          )}
          {transaction.amount && transaction.transaction_type && (
            <Button
              size="sm"
              variant="outline"
              colorPalette="blue"
              onClick={() => onCreateTransaction(transaction)}
            >
              <FiPlus />
            </Button>
          )}
          {/* Add Income button for Remitano transactions */}
          {(transaction.merchant || "").toLowerCase() === "remitano" &&
            transaction.amount && (
              <Button
                size="sm"
                variant="outline"
                colorPalette="green"
                onClick={() => onCreateIncome(transaction)}
              >
                <FiDollarSign />
              </Button>
            )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(transaction)}
          >
            <FiEdit />
          </Button>
          <Button
            size="sm"
            variant="outline"
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

interface EmailTransactionDetailModalProps {
  transaction: any
  isOpen: boolean
  onClose: () => void
  onEdit: (transaction: any) => void
}

function EmailTransactionDetailModal({
  transaction,
  isOpen,
  onClose,
  onEdit,
}: EmailTransactionDetailModalProps) {
  const [showRaw, setShowRaw] = useState<boolean>(false)

  if (!transaction) return null

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => {
        if (!e.open) onClose()
      }}
    >
      <DialogContent maxW="xl">
        <DialogHeader>
          <HStack>
            <FiMail />
            <DialogTitle>Email Transaction Details</DialogTitle>
          </HStack>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Subject:
              </Text>
              <Text>{transaction.subject}</Text>
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={2}>
                From:
              </Text>
              <Text>{transaction.sender}</Text>
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={2}>
                Received:
              </Text>
              <Text>{new Date(transaction.received_at).toLocaleString()}</Text>
            </Box>

            {transaction.amount && (
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Amount:
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(transaction.amount)}
                </Text>
              </Box>
            )}

            {transaction.merchant && (
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Merchant:
                </Text>
                <Text>{transaction.merchant}</Text>
              </Box>
            )}

            {transaction.account_number && (
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Account Number:
                </Text>
                <Text>{transaction.account_number}</Text>
              </Box>
            )}

            {transaction.transaction_type && (
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Transaction Type:
                </Text>
                <Badge
                  colorScheme={
                    transaction.transaction_type === "debit" ? "red" : "green"
                  }
                >
                  {transaction.transaction_type}
                </Badge>
              </Box>
            )}

            <Box>
              <Text fontWeight="semibold" mb={2}>
                Status:
              </Text>
              <Badge
                colorScheme={
                  transaction.status === "pending" ? "yellow" : "green"
                }
              >
                {transaction.status}
              </Badge>
            </Box>

            {transaction.raw_content && (
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="semibold">Email Content</Text>
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setShowRaw(false)}
                    >
                      Rendered
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setShowRaw(true)}
                    >
                      View Source
                    </Button>
                  </HStack>
                </HStack>
                {showRaw ? (
                  <Box
                    p={4}
                    bg="gray.50"
                    borderRadius="md"
                    maxH="300px"
                    overflowY="auto"
                    fontSize="sm"
                  >
                    <pre
                      style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}
                    >
                      {transaction.raw_content}
                    </pre>
                  </Box>
                ) : (
                  <Box
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    overflow="hidden"
                  >
                    <iframe
                      title="email-html"
                      style={{ width: "100%", height: 300, border: 0 }}
                      sandbox=""
                      srcDoc={transaction.raw_content}
                    />
                  </Box>
                )}
              </Box>
            )}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <HStack>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button colorPalette="blue" onClick={() => onEdit(transaction)}>
              Edit Transaction
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

const PER_PAGE = 10

// Query options function for all email transactions (independent of connections)
function getEmailTransactionsQueryOptions({
  page,
  statusFilter,
  sortBy,
  unseenOnly,
  connectionId,
}: {
  page: number
  statusFilter?: string
  sortBy: "date_desc" | "amount_desc" | "amount_asc"
  unseenOnly?: boolean
  connectionId?: string | "all"
}) {
  return {
    queryFn: async () => {
      const allTransactions: any[] = []
      let totalCount = 0

      const fetchForConnection = async (connId: string) => {
        const response = await GmailService.getEmailTransactions({
          connectionId: connId,
          status: statusFilter === "all" ? undefined : statusFilter,
          unseenOnly: unseenOnly,
          skip: 0,
          limit: 1000,
        })
        allTransactions.push(...response.data)
        totalCount += response.count
      }

      if (!connectionId || connectionId === "all") {
        // Get all Gmail connections first
        const connectionsResponse = await GmailService.getGmailConnections()
        if (!connectionsResponse.data.length) {
          return { data: [], count: 0 }
        }
        for (const connection of connectionsResponse.data) {
          try {
            await fetchForConnection(connection.id)
          } catch (error) {
            console.error(
              "Error fetching transactions for connection",
              connection.id,
              error,
            )
          }
        }
      } else {
        // Single connection only
        await fetchForConnection(connectionId)
      }

      // Sort before pagination
      if (sortBy === "amount_desc") {
        allTransactions.sort((a, b) => {
          const av = a.amount ?? Number.NEGATIVE_INFINITY
          const bv = b.amount ?? Number.NEGATIVE_INFINITY
          return (bv as number) - (av as number)
        })
      } else if (sortBy === "amount_asc") {
        allTransactions.sort((a, b) => {
          const av = a.amount ?? Number.POSITIVE_INFINITY
          const bv = b.amount ?? Number.POSITIVE_INFINITY
          return (av as number) - (bv as number)
        })
      } else {
        // Default: date desc
        allTransactions.sort(
          (a, b) =>
            new Date(b.received_at).getTime() -
            new Date(a.received_at).getTime(),
        )
      }

      // Apply pagination
      const startIndex = (page - 1) * PER_PAGE
      const endIndex = startIndex + PER_PAGE
      const paginatedTransactions = allTransactions.slice(startIndex, endIndex)

      return {
        data: paginatedTransactions,
        count: totalCount,
      }
    },
    queryKey: [
      "email-transactions",
      { page, statusFilter, sortBy, unseenOnly, connectionId },
    ],
  }
}

// Main component that uses URL search params (similar to admin page)
export function EmailTransactionsTable({
  page = 1,
  statusFilter = "all",
  unseenOnly = false,
  connectionId = "all",
}: {
  page?: number
  statusFilter?: string
  unseenOnly?: boolean
  connectionId?: string | "all"
}) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const { open, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  const [currentStatusFilter, setCurrentStatusFilter] =
    useState<string>(statusFilter)
  const [currentSortBy, setCurrentSortBy] = useState<
    "date_desc" | "amount_desc" | "amount_asc"
  >("date_desc")
  const [currentUnseenOnly, setCurrentUnseenOnly] =
    useState<boolean>(unseenOnly)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [createTransactionModalOpen, setCreateTransactionModalOpen] =
    useState(false)
  const [selectedEmailTransaction, setSelectedEmailTransaction] =
    useState<any>(null)
  const [createIncomeModalOpen, setCreateIncomeModalOpen] = useState(false)
  const [selectedIncomeTransaction, setSelectedIncomeTransaction] =
    useState<any>(null)
  const currentPage = page

  // Load connections for filter dropdown
  const { data: connectionsData } = useQuery({
    queryKey: ["gmail-connections"],
    queryFn: async () => GmailService.getGmailConnections(),
    staleTime: 5 * 60 * 1000,
  })

  const [currentConnectionId, setCurrentConnectionId] = useState<
    string | "all"
  >(connectionId)

  // Get email transactions using the new query options function
  const { data: transactions, isLoading } = useQuery({
    ...getEmailTransactionsQueryOptions({
      page: currentPage,
      statusFilter: currentStatusFilter,
      sortBy: currentSortBy,
      unseenOnly: currentUnseenOnly,
      connectionId: currentConnectionId,
    }),
    placeholderData: (prevData) => prevData,
  })

  // Load categories for selector
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", { page: 1 }],
    queryFn: async () =>
      CategoriesService.readCategories({ skip: 0, limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  })

  // Load accounts for transaction creation
  const { data: accountsData } = useQuery({
    queryKey: ["accounts", { page: 1 }],
    queryFn: async () => AccountsService.readAccounts({ skip: 0, limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  })

  const syncRecentEmailsMutation = useMutation({
    mutationFn: async () => {
      if (currentConnectionId && currentConnectionId !== "all") {
        await GmailService.triggerAutoSync({
          connectionId: currentConnectionId,
        })
        return { message: `Synced recent emails for selected connection` }
      }
      // All connections
      const connectionsResponse = await GmailService.getGmailConnections()
      if (!connectionsResponse.data.length) {
        throw new Error("No Gmail connections found")
      }
      let totalSynced = 0
      for (const connection of connectionsResponse.data) {
        const response = await GmailService.triggerAutoSync({
          connectionId: connection.id,
        })
        totalSynced += response.message ? 1 : 0
      }
      return { message: `Synced recent emails from ${totalSynced} connections` }
    },
    onSuccess: () => {
      showSuccessToast("Recent emails synced successfully")
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["email-transactions"],
      })
    },
    onError: (error) => {
      showErrorToast(`Failed to sync recent emails: ${error.message}`)
    },
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      await GmailService.deleteEmailTransaction({ transactionId })
    },
    onSuccess: () => {
      showSuccessToast("Transaction deleted")
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["email-transactions"],
      })
    },
    onError: (error) => {
      showErrorToast(`Failed to delete transaction: ${error.message}`)
    },
  })

  const assignCategoryMutation = useMutation({
    mutationFn: async ({
      transactionId,
      categoryId,
    }: {
      transactionId: string
      categoryId: string | null
    }) => {
      await GmailService.updateEmailTransaction({
        transactionId,
        requestBody: { category_id: categoryId },
      })
    },
    onSuccess: () => {
      showSuccessToast("Category assigned")
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
    },
    onError: (error) => {
      showErrorToast(`Failed to assign category: ${error.message}`)
    },
  })

  const markSeenMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      await GmailService.markEmailTransactionAsSeen({ transactionId })
    },
    onSuccess: () => {
      showSuccessToast("Email marked as seen")
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
    },
    onError: (error) => {
      showErrorToast(`Failed to mark as seen: ${error.message}`)
    },
  })

  const markAllSeenMutation = useMutation({
    mutationFn: async () => {
      const collectUnseenIds = async (connId: string) => {
        const response = await GmailService.getUnseenEmailTransactions({
          connectionId: connId,
          skip: 0,
          limit: 10000,
        })
        return response.data.map((t: any) => t.id)
      }

      let allUnseenTransactionIds: string[] = []
      if (currentConnectionId && currentConnectionId !== "all") {
        allUnseenTransactionIds = await collectUnseenIds(currentConnectionId)
      } else {
        const connectionsResponse = await GmailService.getGmailConnections()
        if (!connectionsResponse.data.length) {
          throw new Error("No Gmail connections found")
        }
        for (const connection of connectionsResponse.data) {
          try {
            const ids = await collectUnseenIds(connection.id)
            allUnseenTransactionIds.push(...ids)
          } catch (error) {
            console.error(
              "Error fetching unseen transactions for connection",
              connection.id,
              error,
            )
          }
        }
      }

      const promises = allUnseenTransactionIds.map((id) =>
        GmailService.markEmailTransactionAsSeen({ transactionId: id }),
      )
      await Promise.all(promises)

      return allUnseenTransactionIds.length
    },
    onSuccess: (count) => {
      showSuccessToast(`${count} emails marked as seen`)
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
      queryClient.invalidateQueries({ queryKey: ["unseen-email-transactions"] })
    },
    onError: (error) => {
      showErrorToast(`Failed to mark all as seen: ${error.message}`)
    },
  })

  const createIncomeFromEmailMutation = useMutation({
    mutationFn: async ({
      emailTransactionId,
      source,
      amount,
      currency,
      sprintId,
    }: {
      emailTransactionId: string
      source: string
      amount: number
      currency: string
      sprintId?: string | null
    }) => {
      // Create income record using the IncomeService
      const incomeData = {
        received_at: new Date().toISOString().split("T")[0],
        source,
        amount,
        currency,
        sprint_id: sprintId,
      }

      const income = await IncomesService.createIncome({
        requestBody: incomeData,
      })

      // Update email transaction to link with income
      await GmailService.updateEmailTransaction({
        transactionId: emailTransactionId,
        requestBody: {
          status: "processed",
          linked_income_id: income.id,
        },
      })

      return income
    },
    onSuccess: () => {
      showSuccessToast("Income created successfully from email")
      setCreateIncomeModalOpen(false)
      setSelectedIncomeTransaction(null)
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
      queryClient.invalidateQueries({ queryKey: ["incomes"] })
    },
    onError: (error) => {
      showErrorToast(`Failed to create income: ${error.message}`)
    },
  })

  const createTransactionFromEmailMutation = useMutation({
    mutationFn: async ({
      emailTransactionId,
      accountId,
      categoryId,
      sprintId,
      note,
    }: {
      emailTransactionId: string
      accountId: string
      categoryId?: string | null
      sprintId?: string | null
      note?: string
    }) => {
      return await GmailService.createTransactionFromEmail({
        emailTransactionId,
        accountId,
        categoryId,
        sprintId,
        note,
      })
    },
    onSuccess: () => {
      showSuccessToast("Transaction created successfully from email")
      setCreateTransactionModalOpen(false)
      setSelectedEmailTransaction(null)
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["email-transactions"],
      })
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      })
    },
    onError: (error) => {
      showErrorToast(`Failed to create transaction: ${error.message}`)
    },
  })

  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction)
    onOpen()
  }

  const handleEditTransaction = (_transaction: any) => {
    // TODO: Implement edit functionality
    showSuccessToast("Edit functionality coming soon")
  }

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteTransactionMutation.mutate(transactionId)
    }
  }

  const handleAssignCategory = (
    transactionId: string,
    categoryId: string | null,
  ) => {
    assignCategoryMutation.mutate({ transactionId, categoryId })
  }

  const handleMarkSeen = (transactionId: string) => {
    markSeenMutation.mutate(transactionId)
  }

  const handleCreateIncome = (transaction: any) => {
    setSelectedIncomeTransaction(transaction)
    setCreateIncomeModalOpen(true)
  }

  const handleCreateTransaction = (transaction: any) => {
    setSelectedEmailTransaction(transaction)
    setCreateTransactionModalOpen(true)
  }

  const handleMarkAllSeen = () => {
    if (
      confirm(
        currentConnectionId && currentConnectionId !== "all"
          ? "Mark ALL unseen emails as seen for the selected connection?"
          : "Mark ALL unseen emails as seen across all your Gmail connections?",
      )
    ) {
      markAllSeenMutation.mutate()
    }
  }

  // Page change handler (similar to admin page)
  const setPage = (page: number) => {
    navigate({
      to: "/email/transactions",
      search: (prev) => ({
        ...prev,
        page,
        statusFilter: currentStatusFilter,
        sortBy: currentSortBy,
        unseenOnly: currentUnseenOnly,
      }),
    })
  }

  const handleStatusFilterChange = (status: string) => {
    setCurrentStatusFilter(status)
    // Reset to page 1 when changing filter
    navigate({
      to: "/email/transactions",
      search: (prev) => ({
        ...prev,
        page: 1,
        statusFilter: status,
        sortBy: currentSortBy,
        unseenOnly: currentUnseenOnly,
      }),
    })
  }

  const handleSortChange = (
    value: "date_desc" | "amount_desc" | "amount_asc",
  ) => {
    setCurrentSortBy(value)
    navigate({
      to: "/email/transactions",
      search: (prev) => ({
        ...prev,
        page: 1,
        statusFilter: currentStatusFilter,
        sortBy: value,
        unseenOnly: currentUnseenOnly,
      }),
    })
  }

  // Check if all emails are seen
  const allEmailsSeen = transactions?.data?.every((t: any) => t.seen) || false

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" mb={4}>
          Email Transactions
        </Heading>
        <Text color="gray.600" mb={6}>
          Review and manage transaction emails imported from your Gmail account.
        </Text>
      </Box>

      {/* Filters and Actions */}
      <Card.Root>
        <Card.Body>
          <HStack gap={4} wrap="wrap">
            <Box minW="240px">
              <Text fontSize="sm" mb={1}>
                Gmail account
              </Text>
              <select
                value={currentConnectionId}
                onChange={(e) => {
                  const next = e.target.value as string
                  setCurrentConnectionId(next === "all" ? "all" : next)
                  navigate({
                    to: "/email/transactions",
                    search: (prev) => ({
                      ...prev,
                      page: 1,
                      statusFilter: currentStatusFilter,
                      sortBy: currentSortBy,
                      unseenOnly: currentUnseenOnly,
                      connectionId: next,
                    }),
                  })
                }}
              >
                <option value="all">All connections</option>
                {connectionsData?.data?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.gmail_email}
                  </option>
                ))}
              </select>
            </Box>
            <Box minW="150px">
              <Text fontSize="sm" mb={1}>
                Status
              </Text>
              <select
                value={currentStatusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="ignored">Ignored</option>
              </select>
            </Box>

            <Box minW="180px">
              <Text fontSize="sm" mb={1}>
                Sort by
              </Text>
              <select
                value={currentSortBy}
                onChange={(e) => handleSortChange(e.target.value as any)}
              >
                <option value="date_desc">Date (newest)</option>
                <option value="amount_desc">Amount (high → low)</option>
                <option value="amount_asc">Amount (low → high)</option>
              </select>
            </Box>

            <Box minW="150px">
              <Text fontSize="sm" mb={1}>
                Filter
              </Text>
              <select
                value={currentUnseenOnly ? "unseen" : "all"}
                onChange={(e) => {
                  const unseenOnly = e.target.value === "unseen"
                  setCurrentUnseenOnly(unseenOnly)
                  navigate({
                    to: "/email/transactions",
                    search: (prev) => ({
                      ...prev,
                      page: 1,
                      statusFilter: currentStatusFilter,
                      sortBy: currentSortBy,
                      unseenOnly: unseenOnly,
                      connectionId: currentConnectionId,
                    }),
                  })
                }}
              >
                <option value="all">All emails</option>
                <option value="unseen">Unseen only</option>
              </select>
            </Box>

            <Box alignSelf="end">
              <HStack gap={2}>
                <Button
                  colorPalette="green"
                  variant="outline"
                  onClick={handleMarkAllSeen}
                  loading={markAllSeenMutation.isPending}
                >
                  <HStack>
                    <FiEye />
                    <span>Mark All Unseen as Seen</span>
                  </HStack>
                </Button>
                <Button
                  colorPalette="blue"
                  onClick={() => syncRecentEmailsMutation.mutate()}
                  loading={syncRecentEmailsMutation.isPending}
                >
                  <HStack>
                    <FiRefreshCw />
                    <span>Sync Recent Emails</span>
                  </HStack>
                </Button>
              </HStack>
            </Box>
          </HStack>
        </Card.Body>
      </Card.Root>

      {/* Transactions Table */}
      {isLoading ? (
        <Box textAlign="center" py={8}>
          <Spinner size="lg" />
          <Text mt={4}>Loading email transactions...</Text>
        </Box>
      ) : !transactions?.data.length ? (
        <Card.Root>
          <Card.Body textAlign="center" py={12}>
            <FiMail size={48} color="var(--chakra-colors-gray-400)" />
            <Heading size="md" color="gray.600" mb={2}>
              No email transactions found
            </Heading>
            <Text color="gray.500" mb={6}>
              Sync recent emails to import transaction data from your Gmail
              accounts.
            </Text>
            <Button
              colorPalette="blue"
              onClick={() => syncRecentEmailsMutation.mutate()}
              loading={syncRecentEmailsMutation.isPending}
            >
              <HStack>
                <FiRefreshCw />
                <span>Sync Recent Emails Now</span>
              </HStack>
            </Button>
          </Card.Body>
        </Card.Root>
      ) : (
        <Card.Root>
          <Card.Header>
            <HStack justify="space-between">
              <VStack align="start" gap={1}>
                <Text fontSize="lg" fontWeight="semibold">
                  Email Transactions ({transactions.count})
                </Text>
                {allEmailsSeen && transactions.count > 0 && (
                  <Text fontSize="sm" color="green.600" fontWeight="medium">
                    ✅ Tất cả email đã được seen
                  </Text>
                )}
              </VStack>
            </HStack>
          </Card.Header>
          <Card.Body p={0}>
            <Box overflowX="auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Email</Table.ColumnHeader>
                    <Table.ColumnHeader>Amount</Table.ColumnHeader>
                    <Table.ColumnHeader>Category</Table.ColumnHeader>
                    <Table.ColumnHeader>Date</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {transactions.data.map((transaction: any) => (
                    <EmailTransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onView={handleViewTransaction}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                      onMarkSeen={handleMarkSeen}
                      onCreateTransaction={handleCreateTransaction}
                      onCreateIncome={handleCreateIncome}
                      categories={categoriesData?.data || []}
                      onAssignCategory={handleAssignCategory}
                    />
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
            {/* Pagination - similar to admin page */}
            {transactions && transactions.count > PER_PAGE && (
              <Flex justifyContent="flex-end" mt={4}>
                <PaginationRoot
                  count={transactions.count}
                  pageSize={PER_PAGE}
                  onPageChange={({ page }) => setPage(page)}
                >
                  <Flex>
                    <PaginationPrevTrigger />
                    <PaginationItems />
                    <PaginationNextTrigger />
                  </Flex>
                </PaginationRoot>
              </Flex>
            )}
          </Card.Body>
        </Card.Root>
      )}

      {/* Detail Modal */}
      <EmailTransactionDetailModal
        transaction={selectedTransaction}
        isOpen={open}
        onClose={onClose}
        onEdit={handleEditTransaction}
      />

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        emailTransaction={selectedEmailTransaction}
        isOpen={createTransactionModalOpen}
        onClose={() => {
          setCreateTransactionModalOpen(false)
          setSelectedEmailTransaction(null)
        }}
        onCreateTransaction={createTransactionFromEmailMutation.mutate}
        accounts={accountsData?.data || []}
        categories={categoriesData?.data || []}
        isLoading={createTransactionFromEmailMutation.isPending}
      />
      {/* Create Income Modal */}
      <CreateIncomeModal
        emailTransaction={selectedIncomeTransaction}
        isOpen={createIncomeModalOpen}
        onClose={() => {
          setCreateIncomeModalOpen(false)
          setSelectedIncomeTransaction(null)
        }}
        onCreateIncome={createIncomeFromEmailMutation.mutate}
        isLoading={createIncomeFromEmailMutation.isPending}
      />
    </VStack>
  )
}

// Create Transaction Modal Component
interface CreateTransactionModalProps {
  emailTransaction: any
  isOpen: boolean
  onClose: () => void
  onCreateTransaction: (data: {
    emailTransactionId: string
    accountId: string
    categoryId?: string | null
    sprintId?: string | null
    note?: string
  }) => void
  accounts: { id: string; name: string }[]
  categories: { id: string; name: string }[]
  isLoading: boolean
}

function CreateTransactionModal({
  emailTransaction,
  isOpen,
  onClose,
  onCreateTransaction,
  accounts,
  categories,
  isLoading,
}: CreateTransactionModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [note, setNote] = useState<string>("")

  const handleSubmit = () => {
    if (!selectedAccountId) {
      alert("Please select an account")
      return
    }

    onCreateTransaction({
      emailTransactionId: emailTransaction.id,
      accountId: selectedAccountId,
      categoryId: selectedCategoryId || null,
      note: note || `Created from email: ${emailTransaction.subject}`,
    })
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return "-"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  if (!emailTransaction) return null

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogContent maxW="md">
        <DialogHeader>
          <DialogTitle>Create Transaction from Email</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Email Details:
              </Text>
              <Box p={3} bg="gray.50" borderRadius="md">
                <Text fontSize="sm">
                  <strong>Subject:</strong> {emailTransaction.subject}
                </Text>
                <Text fontSize="sm">
                  <strong>Amount:</strong>{" "}
                  {formatAmount(emailTransaction.amount)}
                </Text>
                <Text fontSize="sm">
                  <strong>Merchant:</strong>{" "}
                  {emailTransaction.merchant || "N/A"}
                </Text>
                <Text fontSize="sm">
                  <strong>Type:</strong>{" "}
                  {emailTransaction.transaction_type || "N/A"}
                </Text>
              </Box>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Account *
              </Text>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Category (Optional)
              </Text>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Note (Optional)
              </Text>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`Created from email: ${emailTransaction.subject}`}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
            </Box>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <HStack gap={2}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette="blue"
              onClick={handleSubmit}
              loading={isLoading}
            >
              Create Transaction
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

// Create Income Modal Component
interface CreateIncomeModalProps {
  emailTransaction: any
  isOpen: boolean
  onClose: () => void
  onCreateIncome: (data: {
    emailTransactionId: string
    source: string
    amount: number
    currency: string
  }) => void
  isLoading: boolean
}

function CreateIncomeModal({
  emailTransaction,
  isOpen,
  onClose,
  onCreateIncome,
  isLoading,
}: CreateIncomeModalProps) {
  const [source, setSource] = useState<string>("")
  const [amount, setAmount] = useState<number>(0)
  const [currency, setCurrency] = useState<string>("USDT")

  useEffect(() => {
    if (emailTransaction) {
      setSource(emailTransaction.merchant || "Remitano")
      setAmount(emailTransaction.amount || 0)
      setCurrency("USDT")
    }
  }, [emailTransaction])

  const handleSubmit = () => {
    if (!source || amount <= 0) {
      alert("Please fill in source and amount")
      return
    }

    onCreateIncome({
      emailTransactionId: emailTransaction.id,
      source,
      amount,
      currency,
    })
  }

  const formatAmount = (amount: number | null) => {
    if (!amount && amount !== 0) return "-"
    return `${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USDT`
  }

  if (!emailTransaction) return null

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogContent maxW="md">
        <DialogHeader>
          <DialogTitle>Create Income from Email</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Email Details:
              </Text>
              <Box p={3} bg="gray.50" borderRadius="md">
                <Text fontSize="sm">
                  <strong>Subject:</strong> {emailTransaction.subject}
                </Text>
                <Text fontSize="sm">
                  <strong>Amount:</strong>{" "}
                  {formatAmount(emailTransaction.amount)}
                </Text>
                <Text fontSize="sm">
                  <strong>Merchant:</strong>{" "}
                  {emailTransaction.merchant || "N/A"}
                </Text>
              </Box>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Source *
              </Text>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g., Remitano, Salary, etc."
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Amount *
              </Text>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Currency
              </Text>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              >
                <option value="USDT">USDT</option>
                <option value="USD">USD</option>
                <option value="VND">VND</option>
              </select>
            </Box>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <HStack gap={2}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette="green"
              onClick={handleSubmit}
              loading={isLoading}
            >
              Create Income
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

// Main export function (wrapper for backward compatibility)
export function EmailTransactions() {
  return <EmailTransactionsTable />
}
