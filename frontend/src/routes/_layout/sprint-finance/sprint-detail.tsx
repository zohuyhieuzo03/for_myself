import { createFileRoute } from "@tanstack/react-router"
import SprintFinancialDetail from "../../../components/Sprints/SprintFinancialDetail"

export const Route = createFileRoute(
  "/_layout/sprint-finance/sprint-detail",
)({
  component: SprintDetailPage,
})

function SprintDetailPage() {
  const { sprintId } = Route.useSearch()
  console.log('SprintDetailPage rendered with sprintId:', sprintId)
  return <SprintFinancialDetail sprintId={sprintId} />
}
