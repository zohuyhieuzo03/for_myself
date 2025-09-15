import { createFileRoute } from "@tanstack/react-router"
import MonthFinancialDashboard from "@/components/MonthFinancialDashboard"

export const Route = createFileRoute("/_layout/monthly-finance")({
  component: MonthlyFinancePage,
})

function MonthlyFinancePage() {
  return <MonthFinancialDashboard />
}
