import { createFileRoute } from "@tanstack/react-router"
import { GmailConnections } from "@/components/Gmail/GmailConnections"

export const Route = createFileRoute("/_layout/gmail/")({
  component: GmailConnections,
})
