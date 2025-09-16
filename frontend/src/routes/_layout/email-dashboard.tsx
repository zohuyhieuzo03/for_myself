import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/email-dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/email-dashboard"!</div>
}
