import { Flex } from "@chakra-ui/react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import Navbar from "@/components/Common/Navbar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  return (
    <Flex direction="column" h="100vh">
      <Navbar />
      <Flex
        flex="1"
        direction="column"
        p={4}
        overflowY="auto"
        maxH="calc(100vh - 80px)"
      >
        <Outlet />
      </Flex>
    </Flex>
  )
}

export default Layout
