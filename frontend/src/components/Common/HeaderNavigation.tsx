import { Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import {
  FiBarChart,
  FiCalendar,
  FiCheckSquare,
  FiChevronDown,
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
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "../ui/menu"


// Task Management - Productivity tools
const taskItems = [
  { icon: FiCheckSquare, title: "Todos", path: "/todos" },
  { icon: FiCalendar, title: "Daily Todos", path: "/daily-todos" },
  { icon: FiMap, title: "Roadmap", path: "/roadmap" },
  { icon: FiDatabase, title: "Resources", path: "/resources" },
]

// Email & Communication
const emailItems = [
  { icon: FiMail, title: "Gmail Integration", path: "/email" },
  { icon: FiInbox, title: "Email Transactions", path: "/email/transactions" },
  {
    icon: FiBarChart,
    title: "Email Dashboard",
    path: "/email/dashboard",
  },
]

// Finance Management
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

// System & Settings
const systemItems = [
  { icon: FiUsers, title: "User Settings", path: "/settings" },
]

interface Item {
  icon: IconType
  title: string
  path: string
}

interface NavigationDropdownProps {
  title: string
  items: Item[]
  icon?: IconType
}

const NavigationDropdown = ({ title, items, icon }: NavigationDropdownProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <Flex
          alignItems="center"
          gap={1}
          px={3}
          py={2}
          borderRadius="md"
          _hover={{
            background: "gray.100",
          }}
          cursor="pointer"
          transition="background 0.2s"
          color="gray.700"
        >
          {icon && <Icon as={icon} boxSize={4} color="gray.600" />}
          <Text fontSize="sm" fontWeight="medium" color="gray.700">{title}</Text>
          <Icon as={FiChevronDown} boxSize={3} color="gray.600" />
        </Flex>
      </MenuTrigger>
      
      <MenuContent minW="200px">
        {items.map(({ icon: itemIcon, title: itemTitle, path }) => (
          <RouterLink key={itemTitle} to={path}>
            <MenuItem
              value={itemTitle}
              gap={2}
              py={2}
              style={{ cursor: "pointer" }}
            >
              <Icon as={itemIcon} boxSize={4} color="gray.600" />
              <Text fontSize="sm" color="gray.700">{itemTitle}</Text>
            </MenuItem>
          </RouterLink>
        ))}
      </MenuContent>
    </MenuRoot>
  )
}

const HeaderNavigation = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  // Add Admin item for superusers
  const adminItems = currentUser?.is_superuser
    ? [{ icon: FiUsers, title: "Admin", path: "/admin" }]
    : []

  return (
    <Flex
      alignItems="center"
      gap={2}
      display={{ base: "none", md: "flex" }}
    >
      {/* Dashboard - Direct link */}
      <RouterLink to="/">
        <Flex
          alignItems="center"
          gap={1}
          px={3}
          py={2}
          borderRadius="md"
          _hover={{
            background: "gray.100",
          }}
          cursor="pointer"
          transition="background 0.2s"
          color="gray.700"
        >
          <Icon as={FiHome} boxSize={4} color="gray.600" />
          <Text fontSize="sm" fontWeight="medium" color="gray.700">Dashboard</Text>
        </Flex>
      </RouterLink>

      {/* Task Management */}
      <NavigationDropdown
        title="Tasks"
        items={taskItems}
      />

      {/* Email & Communication */}
      <NavigationDropdown
        title="Email"
        items={emailItems}
      />

      {/* Finance Management */}
      <NavigationDropdown
        title="Finance"
        items={financeItems}
      />

      {/* Admin - only for superusers */}
      {adminItems.length > 0 && (
        <NavigationDropdown
          title="Admin"
          items={adminItems}
        />
      )}

      {/* Settings */}
      <NavigationDropdown
        title="Settings"
        items={systemItems}
      />
    </Flex>
  )
}

export default HeaderNavigation
