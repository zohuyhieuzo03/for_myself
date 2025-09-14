import { Flex } from "@chakra-ui/react"
import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/sprint-finance")({
  component: SprintFinanceLayout,
})

function SprintFinanceLayout() {
  return (
    <Flex flex="1" direction="column" overflowY="auto">
      <Outlet />
    </Flex>
  )
}
