import { Container } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { EmailTransactionsTable } from "@/components/Gmail/EmailTransactions"

const emailTransactionsSearchSchema = z.object({
  page: z.number().catch(1),
  statusFilter: z.string().optional(),
  sortBy: z.string().optional(),
  unseenOnly: z.boolean().optional(),
})

export const Route = createFileRoute("/_layout/email-transactions")({
  component: EmailTransactions,
  validateSearch: (search) => emailTransactionsSearchSchema.parse(search),
})

function EmailTransactions() {
  const { page, statusFilter, unseenOnly } = Route.useSearch()

  return (
    <Container maxW="full">
      <EmailTransactionsTable
        page={page}
        statusFilter={statusFilter}
        unseenOnly={unseenOnly}
      />
    </Container>
  )
}
