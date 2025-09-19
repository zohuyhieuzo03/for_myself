import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/email")({
  component: EmailLayout,
})

function EmailLayout() {
  return <Outlet />
}
