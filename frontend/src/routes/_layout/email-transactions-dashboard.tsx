import { createFileRoute } from "@tanstack/react-router"
import EmailTransactionsDashboard from "@/components/Gmail/EmailTransactionsDashboard"

export const Route = createFileRoute("/_layout/email-transactions-dashboard")({
  component: EmailTransactionsDashboard,
})
