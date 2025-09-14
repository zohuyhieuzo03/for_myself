import {
  Badge,
  Container,
  Heading,
  HStack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FiCreditCard } from "react-icons/fi"

import { AccountsService } from "@/client"
import { AccountActionsMenu } from "@/components/Accounts/AccountActionsMenu"
import AddAccount from "@/components/Accounts/AddAccount"

export const Route = createFileRoute("/_layout/sprint-finance/accounts")({
  component: AccountsPage,
})

function AccountsPage() {
  const {
    data: accounts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => AccountsService.readAccounts(),
  })

  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Accounts</Heading>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Accounts</Heading>
          <Text color="red.500">Error loading accounts</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Accounts</Heading>
          <AddAccount />
        </HStack>

        {accounts?.data && accounts.data.length > 0 ? (
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Currency</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {accounts.data.map((account: any) => (
                <Table.Row key={account.id}>
                  <Table.Cell>{account.name}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="blue">
                      {account.type.charAt(0).toUpperCase() +
                        account.type.slice(1)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{account.currency}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={account.is_active ? "green" : "red"}>
                      {account.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <AccountActionsMenu account={account} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        ) : (
          <VStack gap={4} py={8}>
            <FiCreditCard size="48px" color="gray" />
            <Text color="gray.500" textAlign="center">
              No accounts found. Create your first account to start tracking
              your finances.
            </Text>
            <AddAccount />
          </VStack>
        )}
      </VStack>
    </Container>
  )
}
