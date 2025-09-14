import { createFileRoute } from "@tanstack/react-router"
import SprintFinancialDetail from "@/components/Sprints/SprintFinancialDetail"

export const Route = createFileRoute(
  "/_layout/sprint-finance/sprints/sprintId",
)({
  component: SprintDetailPage,
})

function SprintDetailPage() {
  const { sprintId } = Route.useParams()
  return <SprintFinancialDetail sprintId={sprintId} />
}
