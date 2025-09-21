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
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { FiEye, FiMail } from "react-icons/fi"
import { GmailService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"

interface UnseenEmailTransactionsProps {
  limit?: number
  showHeader?: boolean
}

export function UnseenEmailTransactions({
  limit = 5,
  showHeader = true,
}: UnseenEmailTransactionsProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Get all Gmail connections first
  const { data: connectionsData } = useQuery({
    queryKey: ["gmail-connections"],
    queryFn: () => GmailService.getGmailConnections(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get unseen email transactions from all connections
  const { data: unseenTransactions, isLoading } = useQuery({
    queryKey: ["unseen-email-transactions", { limit }],
    queryFn: async () => {
      if (!connectionsData?.data.length) {
        return { data: [], count: 0 }
      }

      const allUnseenTransactions = []
      let totalCount = 0

      for (const connection of connectionsData.data) {
        try {
          const response = await GmailService.getUnseenEmailTransactions({
            connectionId: connection.id,
            skip: 0,
            limit: limit,
          })

          allUnseenTransactions.push(...response.data)
          totalCount += response.count
        } catch (error) {
          console.error(
            "Error fetching unseen transactions for connection",
            connection.id,
            error,
          )
          // Continue with other connections
        }
      }

      // Sort by received_at desc and limit
      allUnseenTransactions.sort(
        (a, b) =>
          new Date(b.received_at).getTime() - new Date(a.received_at).getTime(),
      )

      return {
        data: allUnseenTransactions.slice(0, limit),
        count: totalCount,
      }
    },
    enabled: !!connectionsData?.data.length,
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  const markSeenMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      await GmailService.markEmailTransactionAsSeen({ transactionId })
    },
    onSuccess: () => {
      showSuccessToast("Email marked as seen")
      queryClient.invalidateQueries({ queryKey: ["unseen-email-transactions"] })
    },
    onError: (error) => {
      showErrorToast(`Failed to mark as seen: ${error.message}`)
    },
  })

  const markAllSeenMutation = useMutation({
    mutationFn: async () => {
      // Get all Gmail connections first
      const connectionsResponse = await GmailService.getGmailConnections()
      if (!connectionsResponse.data.length) {
        throw new Error("No Gmail connections found")
      }

      // Get all unseen email transactions from all connections
      const allUnseenTransactionIds = []
      for (const connection of connectionsResponse.data) {
        try {
          const response = await GmailService.getUnseenEmailTransactions({
            connectionId: connection.id,
            skip: 0,
            limit: 50000, // Get all unseen emails
          })
          allUnseenTransactionIds.push(...response.data.map((t: any) => t.id))
        } catch (error) {
          console.error(
            "Error fetching unseen transactions for connection",
            connection.id,
            error,
          )
          // Continue with other connections
        }
      }

      // Mark all unseen transactions as seen
      const promises = allUnseenTransactionIds.map((id) =>
        GmailService.markEmailTransactionAsSeen({ transactionId: id }),
      )
      await Promise.all(promises)

      return allUnseenTransactionIds.length
    },
    onSuccess: (count) => {
      showSuccessToast(`${count} emails marked as seen`)
      queryClient.invalidateQueries({ queryKey: ["unseen-email-transactions"] })
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
    },
    onError: (error) => {
      showErrorToast(`Failed to mark all as seen: ${error.message}`)
    },
  })

  const handleMarkSeen = (transactionId: string) => {
    markSeenMutation.mutate(transactionId)
  }

  const handleViewAll = () => {
    navigate({
      to: "/email/transactions",
      search: { page: 1, unseenOnly: true },
    })
  }

  const handleMarkAllSeen = () => {
    if (
      confirm(
        "Mark ALL unseen emails as seen? This will mark all unseen emails across all your Gmail connections.",
      )
    ) {
      markAllSeenMutation.mutate()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return "-"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "yellow"
      case "processed":
        return "green"
      case "ignored":
        return "red"
      default:
        return "gray"
    }
  }

  if (isLoading) {
    return (
      <Card.Root>
        <Card.Body textAlign="center" py={8}>
          <Spinner size="lg" />
          <Text mt={4}>Loading unseen emails...</Text>
        </Card.Body>
      </Card.Root>
    )
  }

  if (!unseenTransactions?.data.length) {
    return (
      <Card.Root>
        <Card.Body textAlign="center" py={8}>
          <FiMail size={48} color="var(--chakra-colors-gray-400)" />
          <Heading size="md" color="gray.600" mb={2}>
            No unseen emails
          </Heading>
          <Text color="gray.500">
            All your email transactions have been seen.
          </Text>
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <Card.Root>
      {showHeader && (
        <Card.Header>
          <Flex justify="space-between" align="center">
            <HStack>
              <FiMail />
              <Heading size="md">Unseen Email Transactions</Heading>
              <Badge colorScheme="blue" size="sm">
                {unseenTransactions.count}
              </Badge>
            </HStack>
            <HStack gap={2}>
              <Button
                size="sm"
                variant="outline"
                colorPalette="green"
                onClick={handleMarkAllSeen}
                loading={markAllSeenMutation.isPending}
              >
                <HStack>
                  <FiEye />
                  <span>Mark All Unseen as Seen</span>
                </HStack>
              </Button>
              <Button size="sm" variant="outline" onClick={handleViewAll}>
                View All
              </Button>
            </HStack>
          </Flex>
        </Card.Header>
      )}
      <Card.Body p={0}>
        <Box overflowX="auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Amount</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Link Status</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {unseenTransactions.data.map((transaction: any) => (
                <Table.Row key={transaction.id}>
                  <Table.Cell>
                    <HStack gap={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        {transaction.subject}
                      </Text>
                      <Badge colorScheme="blue" size="sm">
                        New
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {transaction.sender}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">
                      {formatAmount(transaction.amount)}
                    </Text>
                    {transaction.merchant && (
                      <Text fontSize="xs" color="gray.500">
                        {transaction.merchant}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {(() => {
                      if (transaction.linked_transaction_id) {
                        return (
                          <Badge colorScheme="green" size="sm">
                            Linked to Transaction
                          </Badge>
                        )
                      }
                      return (
                        <Badge colorScheme="gray" size="sm">
                          Not Linked
                        </Badge>
                      )
                    })()}
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" color="gray.600">
                      {formatDate(transaction.received_at)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        colorPalette="green"
                        onClick={() => handleMarkSeen(transaction.id)}
                        loading={markSeenMutation.isPending}
                      >
                        <HStack>
                          <FiEye />
                          <span>Mark Seen</span>
                        </HStack>
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Card.Body>
    </Card.Root>
  )
}
