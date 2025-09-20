import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Progress,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import {
  FiCheck,
  FiChevronDown,
  FiExternalLink,
  FiMail,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi"
import type { GmailConnectionPublic } from "@/client"

import { GmailService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import MonthlySync from "./MonthlySync"

interface GmailConnectionCardProps {
  connection: GmailConnectionPublic
  onDelete: (id: string) => void
}

function GmailConnectionCard({
  connection,
  onDelete,
}: GmailConnectionCardProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [syncProgress, setSyncProgress] = useState<{
    isRunning: boolean
    currentBatch: number
    totalSynced: number
    message: string
  }>({
    isRunning: false,
    currentBatch: 0,
    totalSynced: 0,
    message: "",
  })

  // Sync all emails at once (may timeout with many emails)
  const syncAllEmailsMutation = useMutation({
    mutationFn: async () => {
      const response = await GmailService.syncEmails({
        connectionId: connection.id,
        batchSize: 500,
      })
      return response
    },
    onSuccess: (data) => {
      showSuccessToast(`Sync completed: ${data.message}`)
      queryClient.invalidateQueries({ queryKey: ["gmail-connections"] })
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
    },
    onError: (error) => {
      showErrorToast(`Failed to sync emails: ${error.message}`)
    },
  })

  // Sync emails by batch (recommended for large amounts)
  const syncEmailsBatchMutation = useMutation({
    mutationFn: async ({ pageToken }: { pageToken?: string }) => {
      const response = await GmailService.syncEmailsBatch({
        connectionId: connection.id,
        batchSize: 100,
        pageToken,
      })
      return response
    },
    onSuccess: (data) => {
      const message = data.message

      // Extract synced count from message
      let syncedCount = 0
      if (message.includes("Synced")) {
        try {
          const syncedPart = message.split("Synced ")[1].split(" new emails")[0]
          syncedCount = parseInt(syncedPart, 10)
        } catch (_e) {
          // Ignore parsing errors
        }
      }

      setSyncProgress((prev) => ({
        ...prev,
        currentBatch: prev.currentBatch + 1,
        totalSynced: prev.totalSynced + syncedCount,
        message: message,
      }))

      // Check if there are more batches
      if (message.includes("page_token=")) {
        // Extract page token for next batch
        const tokenPart = message.split("page_token='")[1].split("'")[0]

        // Automatically continue with next batch
        setTimeout(() => {
          syncEmailsBatchMutation.mutate({ pageToken: tokenPart })
        }, 1000) // 1 second delay between batches
      } else {
        // All batches completed
        setSyncProgress((prev) => ({
          ...prev,
          isRunning: false,
          message: `All batches completed! Total synced: ${prev.totalSynced} emails`,
        }))

        showSuccessToast(
          `Batch sync completed! Total synced: ${syncProgress.totalSynced} emails`,
        )
        queryClient.invalidateQueries({ queryKey: ["gmail-connections"] })
        queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
      }
    },
    onError: (error) => {
      setSyncProgress((prev) => ({
        ...prev,
        isRunning: false,
        message: `Sync failed: ${error.message}`,
      }))
      showErrorToast(`Failed to sync emails batch: ${error.message}`)
    },
  })

  const handleSyncAll = () => {
    syncAllEmailsMutation.mutate()
  }

  const handleSyncBatch = () => {
    setSyncProgress({
      isRunning: true,
      currentBatch: 0,
      totalSynced: 0,
      message: "Starting batch sync...",
    })
    syncEmailsBatchMutation.mutate({})
  }

  const deleteConnectionMutation = useMutation({
    mutationFn: async () => {
      await GmailService.deleteGmailConnection({ connectionId: connection.id })
    },
    onSuccess: () => {
      showSuccessToast("Gmail connection deleted")
      onDelete(connection.id)
    },
    onError: (error) => {
      showErrorToast(`Failed to delete connection: ${error.message}`)
    },
  })

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return "Never"
    const date = new Date(lastSync)
    return date.toLocaleString()
  }

  const isAnySyncRunning =
    syncAllEmailsMutation.isPending || syncProgress.isRunning

  return (
    <Card.Root>
      <Card.Header>
        <HStack justify="space-between">
          <HStack>
            <FiMail size={20} color="var(--chakra-colors-blue-500)" />
            <Heading size="md">{connection.gmail_email}</Heading>
          </HStack>
          <HStack>
            <Menu.Root>
              <MenuTrigger asChild>
                <Button
                  size="sm"
                  colorPalette="blue"
                  variant="outline"
                  disabled={!connection.is_active || isAnySyncRunning}
                  loading={isAnySyncRunning}
                >
                  <HStack>
                    <FiRefreshCw />
                    <span>Sync</span>
                    <FiChevronDown />
                  </HStack>
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem value="sync-all" onClick={handleSyncAll}>
                  <HStack>
                    <FiRefreshCw />
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        Sync All Emails
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Sync tất cả emails một lần (có thể timeout)
                      </Text>
                    </VStack>
                  </HStack>
                </MenuItem>
                <MenuItem value="sync-batch" onClick={handleSyncBatch}>
                  <HStack>
                    <FiCheck />
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        Sync by Batch
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Sync theo batch (khuyến nghị)
                      </Text>
                    </VStack>
                  </HStack>
                </MenuItem>
              </MenuContent>
            </Menu.Root>
            <Button
              size="sm"
              colorPalette="red"
              variant="outline"
              onClick={() => deleteConnectionMutation.mutate()}
              loading={deleteConnectionMutation.isPending}
            >
              <HStack>
                <FiTrash2 />
                <span>Delete</span>
              </HStack>
            </Button>
          </HStack>
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack align="start" gap={2}>
          <Text fontSize="sm" color="gray.600">
            Status: {connection.is_active ? "Active" : "Inactive"}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Last sync: {formatLastSync(connection.last_sync_at)}
          </Text>

          {/* Sync Progress */}
          {syncProgress.isRunning && (
            <Box
              p={3}
              bg="blue.50"
              border="1px solid"
              borderColor="blue.200"
              borderRadius="md"
              width="100%"
            >
              <VStack align="start" gap={1} width="100%">
                <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                  🔄 Batch {syncProgress.currentBatch}: {syncProgress.message}
                </Text>
                <Text fontSize="xs" color="blue.600">
                  Total synced: {syncProgress.totalSynced} emails
                </Text>
                <Progress.Root
                  value={syncProgress.currentBatch * 20}
                  width="100%"
                  size="sm"
                  colorPalette="blue"
                >
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </VStack>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

export function GmailConnections() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const { data: connections, isLoading } = useQuery({
    queryKey: ["gmail-connections"],
    queryFn: async () => {
      const response = await GmailService.getGmailConnections()
      return response
    },
  })

  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("")

  useEffect(() => {
    if (connections?.data?.length) {
      setSelectedConnectionId((prev) => prev || connections.data[0].id)
    }
  }, [connections])

  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await GmailService.initiateGmailConnection()
      return response
    },
    onSuccess: (data) => {
      // Open authorization URL in new tab
      window.open((data as any).authorization_url, "_blank")
      showSuccessToast(
        "Gmail authorization opened. Complete it in the new tab.",
      )
    },
    onError: (error) => {
      showErrorToast(`Failed to initiate Gmail connection: ${error.message}`)
    },
  })

  const handleDeleteConnection = (_connectionId: string) => {
    queryClient.invalidateQueries({ queryKey: ["gmail-connections"] })
  }

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
        <Text mt={4}>Loading Gmail connections...</Text>
      </Box>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" mb={4}>
          Gmail Integration
        </Heading>
        <Text color="gray.600" mb={6}>
          Connect your Gmail account to automatically import transaction emails
          from banks and merchants. Sync ALL emails without limits!
        </Text>
      </Box>

      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="semibold">
          Connected Accounts ({connections?.data.length || 0})
        </Text>
        <HStack>
          {connections && connections.data.length > 0 && (
            <Button asChild variant="outline">
              <RouterLink to="/email/transactions" search={{ page: 1 }}>
                View Emails
              </RouterLink>
            </Button>
          )}
          <Button
            colorPalette="blue"
            onClick={() => connectGmailMutation.mutate()}
            loading={connectGmailMutation.isPending}
          >
            <HStack>
              <FiExternalLink />
              <span>Connect Gmail Account</span>
            </HStack>
          </Button>
        </HStack>
      </HStack>

      {connections && connections.data.length > 0 ? (
        <>
          <Box
            p={3}
            bg="green.50"
            border="1px solid"
            borderColor="green.200"
            borderRadius="md"
            width="100%"
          >
            <VStack align="start" gap={1}>
              <Text fontSize="sm" fontWeight="semibold" color="green.700">
                🎉 Sync không giới hạn!
              </Text>
              <Text fontSize="xs" color="green.600">
                • Sync TẤT CẢ emails từ trước đến nay (không giới hạn 180 ngày)
                • Sync không giới hạn số lượng (không giới hạn 500 emails) •
                Chọn "Sync by Batch" để tránh timeout với nhiều emails
              </Text>
            </VStack>
          </Box>
          <VStack gap={4} align="stretch">
            {connections.data.map((connection) => (
              <GmailConnectionCard
                key={connection.id}
                connection={connection}
                onDelete={handleDeleteConnection}
              />
            ))}

            {/* Monthly Sync Section with connection selector */}
            <Card.Root p={4}>
              <VStack gap={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="sm">Monthly Sync</Heading>
                  <HStack>
                    <Text fontSize="sm" color="gray.600">
                      Chọn tài khoản Gmail
                    </Text>
                    <select
                      value={selectedConnectionId}
                      onChange={(e) => setSelectedConnectionId(e.target.value)}
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        fontSize: 13,
                      }}
                    >
                      {connections.data.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.gmail_email}
                        </option>
                      ))}
                    </select>
                  </HStack>
                </HStack>

                {selectedConnectionId ? (
                  <MonthlySync
                    connectionId={selectedConnectionId}
                    onSyncComplete={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["gmail-connections"],
                      })
                      queryClient.invalidateQueries({
                        queryKey: ["email-transactions"],
                      })
                    }}
                  />
                ) : (
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Vui lòng chọn tài khoản Gmail để sync theo tháng.
                    </Text>
                  </Box>
                )}
              </VStack>
            </Card.Root>
          </VStack>
        </>
      ) : (
        <Card.Root>
          <Card.Body textAlign="center" py={12}>
            <FiMail size={48} color="var(--chakra-colors-gray-400)" />
            <Heading size="md" color="gray.600" my={2}>
              No Gmail accounts connected
            </Heading>
            <Text color="gray.500" mb={6}>
              Connect your Gmail account to start importing transaction emails
              automatically.
            </Text>
            <Button
              colorPalette="blue"
              onClick={() => connectGmailMutation.mutate()}
              loading={connectGmailMutation.isPending}
            >
              <HStack>
                <FiExternalLink />
                <span>Connect Your First Gmail Account</span>
              </HStack>
            </Button>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  )
}
