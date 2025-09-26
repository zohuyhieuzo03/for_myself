import { Box, Text, VStack } from "@chakra-ui/react"
import { type TodoPublic } from "@/client"
import TodoSearch from "@/components/Todos/TodoSearch"

// Demo component to test TodoSearch functionality
export default function TodoSearchDemo() {
  const handleSelectTodo = (todo: TodoPublic) => {
    console.log("Selected todo:", todo)
    alert(`Selected: ${todo.title}`)
  }

  return (
    <Box p={4} maxW="600px" mx="auto">
      <VStack gap={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">
          Todo Search Demo
        </Text>
        <Text fontSize="sm" color="gray.600">
          This component demonstrates the TodoSearch functionality with infinite scroll.
          Try searching for todos and scrolling to load more results.
        </Text>
        
        <TodoSearch
          onSelectTodo={handleSelectTodo}
          placeholder="Search todos..."
          maxHeight="500px"
        />
      </VStack>
    </Box>
  )
}
