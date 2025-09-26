import {
  Box,
  Button,
  Flex,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { FiSearch, FiX } from "react-icons/fi"

import { type TodoPublic, TodosService } from "@/client"
import TodoCard from "@/components/Todos/TodoCard"

interface TodoSearchProps {
  onSelectTodo: (todo: TodoPublic) => void
  excludeIds?: string[] // IDs to exclude from search results
  placeholder?: string
  maxHeight?: string
}

const ITEMS_PER_PAGE = 20

export default function TodoSearch({
  onSelectTodo,
  excludeIds = [],
  placeholder = "Search todos...",
  maxHeight = "400px",
}: TodoSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["todos", "search", debouncedSearchTerm, excludeIds],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await TodosService.readTodos({
        skip: (pageParam as number) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearchTerm || undefined,
      })

      // Filter out excluded IDs
      const filteredData = result.data.filter(
        (todo) => !excludeIds.includes(todo.id),
      )

      return {
        ...result,
        data: filteredData,
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (acc, page) => acc + (page as any).data.length,
        0,
      )
      const totalCount = (lastPage as any).count
      
      // If we've loaded all items or the last page was empty, stop loading
      if (totalLoaded >= totalCount || (lastPage as any).data.length === 0) {
        return undefined
      }
      
      return allPages.length
    },
    initialPageParam: 0,
    enabled: true, // Always enabled, empty search will return all todos
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  const allTodos = data?.pages.flatMap((page) => (page as any).data) ?? []

  // Intersection Observer for infinite scroll
  const lastTodoElementCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting && 
            hasNextPage && 
            !isFetchingNextPage &&
            allTodos.length > 0 // Only trigger if we have items
          ) {
            fetchNextPage()
          }
        },
        {
          threshold: 0.1,
          rootMargin: "100px", // Load more when 100px before reaching the end
        }
      )

      if (node) observerRef.current.observe(node)
    },
    [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, allTodos.length],
  )

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const handleClearSearch = () => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
  }

  return (
    <VStack gap={4} align="stretch" maxH={maxHeight}>
      {/* Search Input */}
      <Flex gap={2} align="center">
        <Box position="relative" flex={1}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            size="sm"
            pl={8}
            pr={searchTerm ? 8 : 4}
          />
          <Box
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            color="gray.500"
            pointerEvents="none"
          >
            <FiSearch size={16} />
          </Box>
          {searchTerm && (
            <Button
              position="absolute"
              right={1}
              top="50%"
              transform="translateY(-50%)"
              size="xs"
              variant="ghost"
              onClick={handleClearSearch}
              p={1}
              minW="auto"
              h="auto"
            >
              <FiX size={14} />
            </Button>
          )}
        </Box>
      </Flex>

      {/* Results */}
      <Box
        overflowY="auto"
        flex={1}
        css={{
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "gray.300",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "gray.400",
          },
        }}
      >
        {isLoading ? (
          <Flex justify="center" py={4}>
            <Spinner size="sm" />
          </Flex>
        ) : error ? (
          <Text color="red.500" textAlign="center" py={4}>
            Error loading todos
          </Text>
        ) : allTodos.length === 0 ? (
          <Text color="gray.500" textAlign="center" py={4}>
            {debouncedSearchTerm ? "No todos found" : "No todos available"}
          </Text>
        ) : (
          <VStack gap={2} align="stretch">
            {allTodos.map((todo, index) => {
              const isLast = index === allTodos.length - 1
              return (
                <Box
                  key={todo.id}
                  ref={isLast ? lastTodoElementCallback : null}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  borderRadius="md"
                  p={2}
                  transition="background-color 0.2s ease"
                >
                  <TodoCard 
                    todo={todo} 
                    compact 
                    onClick={() => onSelectTodo(todo)}
                  />
                </Box>
              )
            })}

            {/* Loading indicator for next page - fixed height to prevent layout shift */}
            <Box minH="40px" display="flex" alignItems="center" justifyContent="center">
              {isFetchingNextPage && hasNextPage && <Spinner size="sm" />}
              {!hasNextPage && allTodos.length > 0 && (
                <Text fontSize="xs" color="gray.500">
                  No more todos to load
                </Text>
              )}
            </Box>
          </VStack>
        )}
      </Box>
    </VStack>
  )
}
