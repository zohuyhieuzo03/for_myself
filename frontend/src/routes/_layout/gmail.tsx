import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/gmail")({
  component: GmailLayout,
})

function GmailLayout() {
  return <Outlet />
}
