import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiBook, FiCalendar, FiTarget } from "react-icons/fi"

export default function QuickActions() {
  return (
    <Box p={4} border="1px" borderColor="gray.200" borderRadius="xl" bg="white">
      <VStack gap={3} align="stretch">
        <Text fontSize="md" fontWeight="semibold" color="gray.700">
          Quick Actions
        </Text>

        <HStack gap={2} align="stretch" wrap="wrap">
          <Link
            to="/todos"
            search={{ view: "table" }}
            style={{ flex: 1, minWidth: "200px" }}
          >
            <Button
              variant="outline"
              size="sm"
              w="full"
              justifyContent="flex-start"
              _hover={{ bg: "blue.50", borderColor: "blue.300" }}
              transition="all 0.2s"
            >
              <FiCalendar size={16} style={{ marginRight: "6px" }} />
              View All Todos
            </Button>
          </Link>

          <Link to="/daily-todos" style={{ flex: 1, minWidth: "200px" }}>
            <Button
              variant="outline"
              size="sm"
              w="full"
              justifyContent="flex-start"
              _hover={{ bg: "teal.50", borderColor: "teal.300" }}
              transition="all 0.2s"
            >
              <FiCalendar size={16} style={{ marginRight: "6px" }} />
              View Daily Todos
            </Button>
          </Link>

          <Link
            to="/roadmap"
            search={{ id: undefined }}
            style={{ flex: 1, minWidth: "200px" }}
          >
            <Button
              variant="outline"
              size="sm"
              w="full"
              justifyContent="flex-start"
              _hover={{ bg: "purple.50", borderColor: "purple.300" }}
              transition="all 0.2s"
            >
              <FiTarget size={16} style={{ marginRight: "6px" }} />
              View Roadmap
            </Button>
          </Link>

          <Link
            to="/resources"
            search={{ id: undefined }}
            style={{ flex: 1, minWidth: "200px" }}
          >
            <Button
              variant="outline"
              size="sm"
              w="full"
              justifyContent="flex-start"
              _hover={{ bg: "orange.50", borderColor: "orange.300" }}
              transition="all 0.2s"
            >
              <FiBook size={16} style={{ marginRight: "6px" }} />
              View Resources
            </Button>
          </Link>
        </HStack>
      </VStack>
    </Box>
  )
}
