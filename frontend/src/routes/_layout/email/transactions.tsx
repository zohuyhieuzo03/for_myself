import { Container } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { EmailTransactionsTable } from "@/components/Gmail/EmailTransactions"

const emailTransactionsSearchSchema = z.object({
  page: z.number().catch(1),
  statusFilter: z.string().catch("all"),
  sortBy: z
    .enum(["date_desc", "date_asc", "amount_desc", "amount_asc"])
    .catch("date_desc"),
  connectionId: z.string().catch("all"),
})

export const Route = createFileRoute("/_layout/email/transactions")({
  component: EmailTransactions,
  validateSearch: (search) => emailTransactionsSearchSchema.parse(search),
})

function EmailTransactions() {
  const { page, statusFilter, sortBy, connectionId } = Route.useSearch()

  return (
    <Container maxW="full">
      <EmailTransactionsTable
        page={page}
        statusFilter={statusFilter}
        sortBy={sortBy}
        connectionId={connectionId}
      />
    </Container>
  )
}
