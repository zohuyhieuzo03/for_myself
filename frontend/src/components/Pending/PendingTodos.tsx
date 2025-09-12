import { Container, Skeleton, Table, VStack } from "@chakra-ui/react"

const PendingTodos = () => {
  return (
    <Container maxW="full">
      <VStack gap={4}>
        <Table.Root size={{ base: "sm", md: "md" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w="sm">ID</Table.ColumnHeader>
              <Table.ColumnHeader w="sm">Title</Table.ColumnHeader>
              <Table.ColumnHeader w="sm">Description</Table.ColumnHeader>
              <Table.ColumnHeader w="sm">Status</Table.ColumnHeader>
              <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Array.from({ length: 5 }).map((_, index) => (
              <Table.Row key={index}>
                <Table.Cell>
                  <Skeleton height="20px" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton height="20px" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton height="20px" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton height="20px" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton height="20px" />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </VStack>
    </Container>
  )
}

export default PendingTodos
