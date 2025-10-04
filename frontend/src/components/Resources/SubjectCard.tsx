import { Badge, Box, Text, VStack } from "@chakra-ui/react"
import { FiUser } from "react-icons/fi"

import type { ResourceSubjectPublic } from "@/client"
import { formatDate } from "@/utils"

interface SubjectCardProps {
  subject: ResourceSubjectPublic
  showActions?: boolean
}

export default function SubjectCard({ 
  subject
}: SubjectCardProps) {
  return (
    <Box
      p={3}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
    >
      <VStack align="stretch" gap={2}>
        <Box>
          <Text fontWeight="semibold" fontSize="sm">
            {subject.title}
          </Text>
          {subject.description && (
            <Text fontSize="xs" color="gray.600">
              {subject.description}
            </Text>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <FiUser size={12} />
          <Badge 
            colorPalette={subject.is_completed ? "green" : "blue"} 
            size="xs"
          >
            {subject.is_completed ? "Completed" : "In Progress"}
          </Badge>
        </Box>

        {subject.due_date && (
          <Box fontSize="xs" color="gray.500">
            <Text>Due: {formatDate(new Date(subject.due_date))}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
