import { createFileRoute } from "@tanstack/react-router"
import { RoadmapList } from "@/components/Roadmap/RoadmapList"
import { RoadmapDetail } from "@/components/Roadmap/RoadmapDetail"

export const Route = createFileRoute("/_layout/roadmap")({
  component: () => {
    const { id } = Route.useSearch()
    return id ? <RoadmapDetail roadmapId={id} /> : <RoadmapList />
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: search.id as string | undefined,
    }
  },
})
