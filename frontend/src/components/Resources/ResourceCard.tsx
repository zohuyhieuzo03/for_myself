import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { ResourcePublic } from "@/client";

interface ResourceCardProps {
  resource: ResourcePublic;
  onEdit: (resource: ResourcePublic) => void;
  onDelete: (resource: ResourcePublic) => void;
  onSubjectToggle: (subjectId: string, isCompleted: boolean) => void;
  onSubjectEdit: (subjectId: string) => void;
  onSubjectDelete: (subjectId: string) => void;
}

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onSubjectToggle,
  onSubjectEdit,
  onSubjectDelete,
}: ResourceCardProps) {
  const [showSubjects, setShowSubjects] = useState(false);

  const completedSubjects = resource.subjects?.filter(s => s.is_completed).length || 0;
  const totalSubjects = resource.subjects?.length || 0;
  const progressPercentage = totalSubjects > 0 ? Math.round((completedSubjects / totalSubjects) * 100) : 0;

  return (
    <Box 
      position="relative"
      border="1px" 
      borderColor="gray.300" 
      borderRadius="lg" 
      p={6}
      bg="white"
      shadow="sm"
      _hover={{
        shadow: "md",
        borderColor: "blue.300",
        transform: "translateY(-1px)",
        transition: "all 0.2s ease"
      }}
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
        opacity: 0.7
      }}
    >
      <Flex justify="space-between" align="start" mb={4}>
        <Box flex="1">
          <Heading size="md" mb={2}>
            {resource.title}
          </Heading>
          {resource.description && (
            <Text color="gray.600" fontSize="sm" mb={2}>
              {resource.description}
            </Text>
          )}
          <HStack gap={2}>
            <Badge colorScheme="blue">
              Link
            </Badge>
            {resource.url && (
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <Button size="xs">
                  Open Link
                </Button>
              </a>
            )}
          </HStack>
        </Box>
        <HStack>
          <Button size="sm" variant="ghost" onClick={() => onEdit(resource)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" colorScheme="red" onClick={() => onDelete(resource)}>
            Delete
          </Button>
        </HStack>
      </Flex>

      <VStack align="stretch" gap={3}>
        {totalSubjects > 0 && (
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="sm" fontWeight="medium">
                Subjects ({completedSubjects}/{totalSubjects})
              </Text>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setShowSubjects(!showSubjects)}
              >
                {showSubjects ? "Hide" : "Show"}
              </Button>
            </Flex>
            
            <Box
              w="100%"
              bg="gray.200"
              rounded="full"
              h="8px"
              mb={2}
            >
              <Box
                bg="green.500"
                h="8px"
                rounded="full"
                w={`${progressPercentage}%`}
                transition="width 0.3s ease"
              />
            </Box>

            {showSubjects && (
              <VStack align="stretch" gap={2}>
                {resource.subjects
                  ?.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                  .map((subject) => (
                    <Flex
                      key={subject.id}
                      align="center"
                      p={3}
                      bg={subject.is_completed ? "green.50" : "white"}
                      rounded="lg"
                      border="1px"
                      borderColor={subject.is_completed ? "green.300" : "gray.300"}
                      shadow="xs"
                      _hover={{
                        shadow: "sm",
                        borderColor: subject.is_completed ? "green.400" : "blue.300",
                        transform: "translateY(-1px)",
                        transition: "all 0.15s ease"
                      }}
                      transition="all 0.15s ease"
                    >
                      <input
                        type="checkbox"
                        checked={subject.is_completed}
                        onChange={(e) => onSubjectToggle(subject.id, e.target.checked)}
                        style={{ marginRight: "12px" }}
                      />
                      <Box flex="1">
                        <Text
                          fontSize="sm"
                          textDecoration={subject.is_completed ? "line-through" : "none"}
                          color={subject.is_completed ? "gray.500" : "inherit"}
                        >
                          {subject.title}
                        </Text>
                        {subject.description && (
                          <Text fontSize="xs" color="gray.500">
                            {subject.description}
                          </Text>
                        )}
                      </Box>
                      <HStack>
                        <Button size="xs" variant="ghost" onClick={() => onSubjectEdit(subject.id)}>
                          Edit
                        </Button>
                        <Button size="xs" variant="ghost" colorScheme="red" onClick={() => onSubjectDelete(subject.id)}>
                          Delete
                        </Button>
                      </HStack>
                    </Flex>
                  ))}
              </VStack>
            )}
          </Box>
        )}

        {totalSubjects === 0 && (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            No subjects added yet
          </Text>
        )}
      </VStack>
    </Box>
  );
}