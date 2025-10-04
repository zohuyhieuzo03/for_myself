import { Input, Text, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import type { ResourceSubjectPublic } from "@/client"
import { ResourcesService } from "@/client"
import SubjectCard from "@/components/Resources/SubjectCard"

interface SubjectSearchProps {
  onSelectSubject: (subject: ResourceSubjectPublic) => void
  excludeIds?: string[]
  placeholder?: string
  maxHeight?: string
}

export default function SubjectSearch({
  onSelectSubject,
  excludeIds = [],
  placeholder = "Search subjects...",
  maxHeight = "500px",
}: SubjectSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const { data: subjectsData, isLoading, error } = useQuery({
    queryKey: ["subjects", "search", searchTerm],
    queryFn: () =>
      ResourcesService.searchAllSubjects({
        search: searchTerm || undefined,
        limit: 100,
      }),
    enabled: true,
  })

  const filteredSubjects = (subjectsData?.data || []).filter(
    (subject) => !excludeIds.includes(subject.id)
  )

  const handleSubjectClick = (subject: ResourceSubjectPublic) => {
    onSelectSubject(subject)
  }

  return (
    <VStack gap={4} align="stretch">
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div
        style={{
          maxHeight,
          overflowY: "auto",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "8px",
        }}
      >
        {isLoading ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            Loading subjects...
          </Text>
        ) : error ? (
          <Text fontSize="sm" color="red.500" textAlign="center" py={4}>
            Error loading subjects: {error.message}
          </Text>
        ) : filteredSubjects.length === 0 ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            {searchTerm ? "No subjects found matching your search." : "No subjects available."}
          </Text>
        ) : (
          <VStack gap={2} align="stretch">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => handleSubjectClick(subject)}
                style={{
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid transparent",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc"
                  e.currentTarget.style.borderColor = "#e2e8f0"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.borderColor = "transparent"
                }}
              >
                <SubjectCard subject={subject} showActions={false} />
              </div>
            ))}
          </VStack>
        )}
      </div>
    </VStack>
  )
}
