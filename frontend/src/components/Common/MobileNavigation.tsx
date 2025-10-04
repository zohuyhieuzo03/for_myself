import { Box, Flex, Icon, IconButton, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { useState } from "react"
import { FaBars } from "react-icons/fa"
import {
  FiBarChart,
  FiCalendar,
  FiCheckSquare,
  FiChevronDown,
  FiChevronRight,
  FiCreditCard,
  FiDatabase,
  FiHome,
  FiInbox,
  FiMail,
  FiMap,
  FiPieChart,
  FiTag,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerRoot,
  DrawerTrigger,
} from "../ui/drawer"

// Navigation data (same as HeaderNavigation)
const _mainItems = [{ icon: FiHome, title: "Dashboard", path: "/" }]

const taskItems = [
  { icon: FiCheckSquare, title: "Todos", path: "/todos" },
  { icon: FiCalendar, title: "Daily Todos", path: "/daily-todos" },
  { icon: FiMap, title: "Roadmap", path: "/roadmap" },
  { icon: FiDatabase, title: "Resources", path: "/resources" },
]

const emailItems = [
  { icon: FiMail, title: "Gmail Integration", path: "/email" },
  { icon: FiInbox, title: "Email Transactions", path: "/email/transactions" },
  {
    icon: FiBarChart,
    title: "Email Dashboard",
    path: "/email/dashboard",
  },
]

const financeItems = [
  { icon: FiCreditCard, title: "Accounts", path: "/finance/accounts" },
  { icon: FiTag, title: "Categories", path: "/finance/categories" },
  {
    icon: FiTrendingUp,
    title: "Transactions",
    path: "/finance/transactions",
  },
  {
    icon: FiPieChart,
    title: "Finance Dashboard",
    path: "/finance/transactions-dashboard",
  },
  {
    icon: FiTarget,
    title: "Allocation Rules",
    path: "/finance/allocation-rules",
  },
]

const systemItems = [
  { icon: FiUsers, title: "User Settings", path: "/settings" },
]

interface Item {
  icon: IconType
  title: string
  path: string
}

interface MobileNavSectionProps {
  title: string
  items: Item[]
  onClose: () => void
}

const MobileNavSection = ({ title, items, onClose }: MobileNavSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Box>
      <Flex
        alignItems="center"
        px={4}
        py={3}
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        _hover={{
          background: "gray.50",
        }}
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Icon
          as={isExpanded ? FiChevronDown : FiChevronRight}
          boxSize={4}
          mr={2}
          transition="transform 0.2s"
        />
        <Text fontSize="md" fontWeight="semibold" color="gray.700">
          {title}
        </Text>
      </Flex>

      <Box
        maxH={isExpanded ? "500px" : "0"}
        overflow="hidden"
        transition="max-height 0.3s ease-in-out, opacity 0.3s ease-in-out"
        opacity={isExpanded ? 1 : 0}
      >
        {items.map(({ icon, title: itemTitle, path }) => (
          <RouterLink key={itemTitle} to={path} onClick={onClose}>
            <Flex
              alignItems="center"
              gap={3}
              px={8}
              py={2.5}
              _hover={{
                background: "gray.50",
              }}
            >
              <Icon as={icon} boxSize={4} color="gray.600" />
              <Text fontSize="sm" color="gray.700">
                {itemTitle}
              </Text>
            </Flex>
          </RouterLink>
        ))}
      </Box>
    </Box>
  )
}

const MobileNavigation = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const [open, setOpen] = useState(false)

  // Add Admin item for superusers
  const adminItems = currentUser?.is_superuser
    ? [{ icon: FiUsers, title: "Admin", path: "/admin" }]
    : []

  return (
    <DrawerRoot
      placement="start"
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
    >
      <DrawerBackdrop />
      <DrawerTrigger asChild>
        <IconButton
          variant="ghost"
          color="inherit"
          display={{ base: "flex", md: "none" }}
          aria-label="Open Menu"
          size="sm"
        >
          <FaBars />
        </IconButton>
      </DrawerTrigger>

      <DrawerContent maxW="xs">
        <DrawerCloseTrigger />
        <DrawerBody overflowY="auto" p={0}>
          <Box>
            {/* Dashboard - Direct link */}
            <RouterLink to="/" onClick={() => setOpen(false)}>
              <Flex
                alignItems="center"
                gap={3}
                px={4}
                py={3}
                borderBottom="1px solid"
                borderColor="gray.100"
                _hover={{
                  background: "gray.50",
                }}
              >
                <Icon as={FiHome} boxSize={4} color="gray.600" />
                <Text fontSize="md" fontWeight="semibold" color="gray.700">
                  Dashboard
                </Text>
              </Flex>
            </RouterLink>

            {/* Navigation Sections */}
            <MobileNavSection
              title="Task Management"
              items={taskItems}
              onClose={() => setOpen(false)}
            />

            <MobileNavSection
              title="Email & Communication"
              items={emailItems}
              onClose={() => setOpen(false)}
            />

            <MobileNavSection
              title="Finance"
              items={financeItems}
              onClose={() => setOpen(false)}
            />

            {adminItems.length > 0 && (
              <MobileNavSection
                title="Administration"
                items={adminItems}
                onClose={() => setOpen(false)}
              />
            )}

            <MobileNavSection
              title="System"
              items={systemItems}
              onClose={() => setOpen(false)}
            />
          </Box>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  )
}

export default MobileNavigation
