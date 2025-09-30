import { createFileRoute } from "@tanstack/react-router"
import { ResourceDetail } from "@/components/Resources/ResourceDetail"
import { ResourceList } from "@/components/Resources/ResourceList"

export const Route = createFileRoute("/_layout/resources")({
  component: () => {
    const { id } = Route.useSearch()
    return id ? <ResourceDetail resourceId={id} /> : <ResourceList />
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: search.id as string | undefined,
    }
  },
})
