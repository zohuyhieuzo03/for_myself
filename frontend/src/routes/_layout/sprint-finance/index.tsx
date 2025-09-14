import { createFileRoute } from "@tanstack/react-router"
import FinancialDashboard from "@/components/Dashboard/FinancialDashboard"

export const Route = createFileRoute("/_layout/sprint-finance/")({
  component: SprintFinanceDashboard,
})

function SprintFinanceDashboard() {
  return <FinancialDashboard />
}
