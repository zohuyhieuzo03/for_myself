import { Box, Button, Flex, Heading, Input, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { FiPlus } from "react-icons/fi"

import { RoadmapService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { RoadmapCard } from "./RoadmapCard"
import RoadmapForm from "./RoadmapForm"

export function RoadmapList() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const { showSuccessToast } = useCustomToast()

  const {
    data: roadmaps,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["roadmaps"],
    queryFn: () => RoadmapService.readRoadmaps(),
  })

  const filteredRoadmaps =
    roadmaps?.data?.filter((roadmap) => {
      const matchesStatus =
        statusFilter === "all" || roadmap.status === statusFilter
      const matchesPriority =
        priorityFilter === "all" || roadmap.priority === priorityFilter
      const matchesSearch =
        searchTerm === "" ||
        roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roadmap.description?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesStatus && matchesPriority && matchesSearch
    }) || []

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading roadmaps</div>

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Roadmap</Heading>
        <Button onClick={() => setIsFormOpen(true)} colorScheme="blue">
          <FiPlus />
          New Roadmap
        </Button>
      </Flex>

      {/* Filters */}
      <Flex gap={4} mb={6} wrap="wrap">
        <Input
          placeholder="Search roadmaps..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW="300px"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            width: "200px",
            padding: "8px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{
            width: "200px",
            padding: "8px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </Flex>

      {/* Roadmap Grid */}
      <VStack gap={4} align="stretch">
        {filteredRoadmaps.map((roadmap) => (
          <RoadmapCard key={roadmap.id} roadmap={roadmap} />
        ))}
      </VStack>

      {/* Create Form Dialog */}
      <RoadmapForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setIsFormOpen(false)
          showSuccessToast("Roadmap created successfully!")
        }}
      />
    </Box>
  )
}
