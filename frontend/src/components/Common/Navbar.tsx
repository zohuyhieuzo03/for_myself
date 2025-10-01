import { Flex, IconButton, Image, useBreakpointValue } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu"

import Logo from "/assets/images/fastapi-logo.svg"
import UserMenu from "./UserMenu"

interface NavbarProps {
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

function Navbar({ sidebarCollapsed, onToggleSidebar }: NavbarProps) {
  const display = useBreakpointValue({ base: "none", md: "flex" })

  return (
    <Flex
      display={display}
      justify="space-between"
      position="sticky"
      color="white"
      align="center"
      bg="bg.muted"
      w="100%"
      top={0}
      p={4}
    >
      <Link to="/">
        <Image src={Logo} alt="Logo" maxW="3xs" p={2} />
      </Link>
      <Flex gap={2} alignItems="center">
        <IconButton
          aria-label="Toggle sidebar"
          size="sm"
          variant="ghost"
          onClick={onToggleSidebar}
          display={{ base: "none", md: "inline-flex" }}
        >
          {sidebarCollapsed ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
        </IconButton>
        <UserMenu />
      </Flex>
    </Flex>
  )
}

export default Navbar
