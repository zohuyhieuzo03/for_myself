import { Box, Button, Text, VStack } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiBook, FiCalendar, FiTarget } from "react-icons/fi"

export default function QuickActions() {
  return (
    <Box p={6} border="1px" borderColor="gray.200" borderRadius="xl" bg="white">
      <VStack gap={4} align="stretch">
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          Quick Actions
        </Text>

        <VStack gap={3} align="stretch">
          <Link to="/todos" search={{ view: "table" }}>
            <Button
              variant="outline"
              size="lg"
              w="full"
              justifyContent="flex-start"
              _hover={{ bg: "blue.50", borderColor: "blue.300" }}
              transition="all 0.2s"
            >
              <FiCalendar size={18} style={{ marginRight: "8px" }} />
              View All Todos
            </Button>
          </Link>

          <Link to="/daily-todos">
            <Button
              variant="outline"
              size="lg"
              w="full"
              justifyContent="flex-start"
              _hover={{ bg: "teal.50", borderColor: "teal.300" }}
              transition="all 0.2s"
            >
              <FiCalendar size={18} style={{ marginRight: "8px" }} />
              View Daily Todos
            </Button>
          </Link>

          <Link to="/roadmap" search={{ id: undefined }}>
            <Button
              variant="outline"
              size="lg"
              w="full"
              justifyContent="flex-start"
              _hover={{ bg: "purple.50", borderColor: "purple.300" }}
              transition="all 0.2s"
            >
              <FiTarget size={18} style={{ marginRight: "8px" }} />
              View Roadmap
            </Button>
          </Link>

          <Link to="/resources" search={{ id: undefined }}>
            <Button
              variant="outline"
              size="lg"
              w="full"
              justifyContent="flex-start"
              _hover={{ bg: "orange.50", borderColor: "orange.300" }}
              transition="all 0.2s"
            >
              <FiBook size={18} style={{ marginRight: "8px" }} />
              View Resources
            </Button>
          </Link>
        </VStack>
      </VStack>
    </Box>
  )
}
