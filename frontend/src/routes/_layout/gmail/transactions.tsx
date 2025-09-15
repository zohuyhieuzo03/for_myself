import { createFileRoute } from "@tanstack/react-router"
import { EmailTransactions } from "@/components/Gmail/EmailTransactions"

export const Route = createFileRoute("/_layout/gmail/transactions")({
  component: EmailTransactions,
})
