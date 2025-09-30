import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import type { ResourcePublic } from "@/client"

interface ResourceCardProps {
  resource: ResourcePublic
  onEdit: (resource: ResourcePublic) => void
  onDelete: (resource: ResourcePublic) => void
}

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
}: ResourceCardProps) {

  return (
    <Box
      position="relative"
      border="1px"
      borderColor="gray.300"
      borderRadius="lg"
      p={6}
      bg="white"
      shadow="sm"
      transition="all 0.2s ease"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        bg: "blue.400",
        borderRadius: "lg lg 0 0",
        opacity: 0,
        transition: "opacity 0.2s ease",
      }}
      _hover={{
        shadow: "md",
        borderColor: "blue.300",
        transform: "translateY(-1px)",
        transition: "all 0.2s ease",
        _before: {
          opacity: 0.7,
        },
      }}
    >
      <Flex justify="space-between" align="start">
        <Box flex="1">
          <Link to="/resources" search={{ id: resource.id }}>
            <Heading 
              size="md" 
              mb={2}
              cursor="pointer"
              _hover={{ color: "blue.500" }}
              transition="color 0.2s ease"
            >
              {resource.title}
            </Heading>
          </Link>
          {resource.description && (
            <Text color="gray.600" fontSize="sm" mb={2}>
              {resource.description}
            </Text>
          )}
          <HStack gap={2}>
            <Badge colorScheme="blue">Link</Badge>
            {resource.url && (
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <Button size="xs">Open Link</Button>
              </a>
            )}
          </HStack>
        </Box>
        <HStack>
          <Button size="sm" variant="ghost" onClick={() => onEdit(resource)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => onDelete(resource)}
          >
            Delete
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
}
