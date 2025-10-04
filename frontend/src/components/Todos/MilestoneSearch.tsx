import { Input, Text, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import type { RoadmapMilestonePublic } from "@/client"
import { RoadmapService } from "@/client"
import MilestoneCard from "@/components/Roadmap/MilestoneCard"

interface MilestoneSearchProps {
  onSelectMilestone: (milestone: RoadmapMilestonePublic) => void
  excludeIds?: string[]
  placeholder?: string
  maxHeight?: string
}

export default function MilestoneSearch({
  onSelectMilestone,
  excludeIds = [],
  placeholder = "Search milestones...",
  maxHeight = "500px",
}: MilestoneSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ["milestones", "search", searchTerm],
    queryFn: () =>
      RoadmapService.searchAllMilestones({
        search: searchTerm || undefined,
        limit: 100,
      }),
    enabled: true,
  })

  const filteredMilestones = (milestonesData?.data || []).filter(
    (milestone) => !excludeIds.includes(milestone.id)
  )

  const handleMilestoneClick = (milestone: RoadmapMilestonePublic) => {
    onSelectMilestone(milestone)
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
            Loading milestones...
          </Text>
        ) : filteredMilestones.length === 0 ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            {searchTerm ? "No milestones found matching your search." : "No milestones available."}
          </Text>
        ) : (
          <VStack gap={2} align="stretch">
            {filteredMilestones.map((milestone) => (
              <div
                key={milestone.id}
                onClick={() => handleMilestoneClick(milestone)}
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
                <MilestoneCard milestone={milestone} showActions={false} />
              </div>
            ))}
          </VStack>
        )}
      </div>
    </VStack>
  )
}
