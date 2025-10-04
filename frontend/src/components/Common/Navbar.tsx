import { Flex, Image } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

import Logo from "/assets/images/fastapi-logo.svg"
import HeaderNavigation from "./HeaderNavigation"
import MobileNavigation from "./MobileNavigation"
import UserMenu from "./UserMenu"

function Navbar() {
  return (
    <Flex
      justify="space-between"
      position="sticky"
      align="center"
      bg="bg.muted"
      w="100%"
      top={0}
      p={4}
      zIndex={1000}
      borderBottom="1px solid"
      borderColor="gray.200"
    >
      <Flex alignItems="center" gap={6}>
        <Link to="/">
          <Image src={Logo} alt="Logo" maxW="3xs" p={2} />
        </Link>
        <HeaderNavigation />
      </Flex>

      <Flex gap={2} alignItems="center">
        <MobileNavigation />
        <UserMenu />
      </Flex>
    </Flex>
  )
}

export default Navbar
