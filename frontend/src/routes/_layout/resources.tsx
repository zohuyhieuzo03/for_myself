import { createFileRoute } from "@tanstack/react-router"
import { ResourceList } from "@/components/Resources/ResourceList"

export const Route = createFileRoute("/_layout/resources")({
  component: ResourceList,
})
