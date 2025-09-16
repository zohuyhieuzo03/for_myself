import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { FiExternalLink, FiMail, FiRefreshCw, FiTrash2 } from "react-icons/fi"
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

  const syncEmailsMutation = useMutation({
    mutationFn: async () => {
      const response = await GmailService.syncEmails({
        connectionId: connection.id,
      })
      return response
    },
    onSuccess: () => {
      showSuccessToast("Emails synced successfully")
      queryClient.invalidateQueries({ queryKey: ["gmail-connections"] })
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
    },
    onError: (error) => {
      showErrorToast(`Failed to sync emails: ${error.message}`)
    },
  })

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

  return (
    <Card.Root>
      <Card.Header>
        <HStack justify="space-between">
          <HStack>
            <FiMail size={20} color="var(--chakra-colors-blue-500)" />
            <Heading size="md">{connection.gmail_email}</Heading>
          </HStack>
          <HStack>
            <Button
              size="sm"
              colorPalette="blue"
              variant="outline"
              onClick={() => syncEmailsMutation.mutate()}
              loading={syncEmailsMutation.isPending}
              disabled={!connection.is_active}
            >
              <HStack>
                <FiRefreshCw />
                <span>Sync</span>
              </HStack>
            </Button>
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
          from banks and merchants.
        </Text>
      </Box>

      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="semibold">
          Connected Accounts ({connections?.data.length || 0})
        </Text>
        <HStack>
          {connections && connections.data.length > 0 && (
            <Button asChild variant="outline">
              <RouterLink to="/gmail/transactions">View Emails</RouterLink>
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
        <VStack gap={4} align="stretch">
          {connections.data.map((connection) => (
            <GmailConnectionCard
              key={connection.id}
              connection={connection}
              onDelete={handleDeleteConnection}
            />
          ))}

          {/* Monthly Sync Section */}
          <MonthlySync
            connectionId={connections.data[0].id}
            onSyncComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["gmail-connections"] })
              queryClient.invalidateQueries({
                queryKey: ["email-transactions"],
              })
            }}
          />
        </VStack>
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
