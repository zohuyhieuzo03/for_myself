import { 
  Container, 
  Heading, 
  Table, 
  VStack,
  Text,
  Badge,
  HStack
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FiTag } from "react-icons/fi"

import { CategoriesService } from "@/client"
import AddCategory from "@/components/Categories/AddCategory"
import { CategoryActionsMenu } from "@/components/Categories/CategoryActionsMenu"

export const Route = createFileRoute("/_layout/sprint-finance/categories")({
  component: CategoriesPage,
})

function CategoriesPage() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesService.readCategories(),
  })

  if (isLoading) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Categories</Heading>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="full">
        <VStack gap={4}>
          <Heading>Categories</Heading>
          <Text color="red.500">Error loading categories</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Categories</Heading>
          <AddCategory />
        </HStack>

        {categories?.data && categories.data.length > 0 ? (
          <Table.Root size={{ base: "sm", md: "md" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Group</Table.ColumnHeader>
                <Table.ColumnHeader>Envelope</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {categories.data.map((category: any) => (
                <Table.Row key={category.id}>
                  <Table.Cell>{category.name}</Table.Cell>
                  <Table.Cell>
                    <Badge 
                      colorPalette={
                        category.grp === "needs" ? "green" : 
                        category.grp === "wants" ? "blue" : "purple"
                      }
                    >
                      {category.grp.charAt(0).toUpperCase() + category.grp.slice(1).replace('_', ' ')}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={category.is_envelope ? "green" : "gray"}>
                      {category.is_envelope ? "Envelope" : "Non-Envelope"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <CategoryActionsMenu category={category} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        ) : (
          <VStack gap={4} py={8}>
            <FiTag size="48px" color="gray" />
            <Text color="gray.500" textAlign="center">
              No categories found. Create your first category to organize your spending.
            </Text>
            <AddCategory />
          </VStack>
        )}
      </VStack>
    </Container>
  )
}
