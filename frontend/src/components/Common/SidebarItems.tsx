import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { useState } from "react"
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu"
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
  FiSettings,
  FiTag,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

// Main navigation - Core features
const mainItems = [{ icon: FiHome, title: "Dashboard", path: "/" }]

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
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
  collapsed?: boolean
  onToggleSidebar?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
}

const SidebarItems = ({ onClose, collapsed, onToggleSidebar }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  // State for managing collapsed sections
  const [collapsedSections, setCollapsedSections] = useState({
    tasks: false,
    email: false,
    finance: false,
    admin: false,
    system: false,
  })

  // Add Admin item for superusers
  const adminItems = currentUser?.is_superuser
    ? [{ icon: FiUsers, title: "Admin", path: "/admin" }]
    : []

  // Toggle section collapse
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Helper function to render menu items with collapsible sections
  const renderMenuItems = (
    items: Item[],
    groupTitle?: string,
    sectionKey?: keyof typeof collapsedSections,
  ) => {
    const isCollapsed = sectionKey ? collapsedSections[sectionKey] : false

    const menuItems = items.map(({ icon, title, path }) => (
      <RouterLink key={title} to={path} onClick={onClose}>
        <Flex
          gap={collapsed ? 0 : 2}
          px={collapsed ? 0 : 2}
          py={1.5}
          _hover={{
            background: "gray.subtle",
          }}
          alignItems="center"
          fontSize="sm"
          title={collapsed ? title : undefined}
        >
          <Icon
            as={icon}
            alignSelf="center"
            boxSize={4}
            mx={collapsed ? "auto" : 0}
          />
          {!collapsed && <Text ml={1} fontSize="sm">{title}</Text>}
        </Flex>
      </RouterLink>
    ))

    // If no group title, render items directly (like Dashboard)
    if (!groupTitle || collapsed) {
      return <Box>{menuItems}</Box>
    }

    // Render collapsible section
    return (
      <Box>
        <Flex
          alignItems="center"
          px={2}
          py={1.5}
          cursor="pointer"
          onClick={() => sectionKey && toggleSection(sectionKey)}
          _hover={{
            background: "gray.subtle",
          }}
        >
          <Icon
            as={isCollapsed ? FiChevronRight : FiChevronDown}
            boxSize={3}
            mr={1.5}
            transition="transform 0.2s"
          />
          <Text fontSize="xs" fontWeight="bold" color="gray.500" flex="1">
            {groupTitle}
          </Text>
        </Flex>
        <Box
          maxH={isCollapsed ? "0" : "500px"}
          overflow="hidden"
          transition="max-height 0.3s ease-in-out, opacity 0.3s ease-in-out"
          opacity={isCollapsed ? 0 : 1}
        >
          {menuItems}
        </Box>
      </Box>
    )
  }

  return (
    <Box pb={4}>
      {/* Toggle Sidebar Button - aligned with other menu items */}
      {onToggleSidebar && (
        <Flex
          gap={collapsed ? 0 : 2}
          px={collapsed ? 0 : 2}
          py={1.5}
          _hover={{
            background: "gray.subtle",
          }}
          alignItems="center"
          fontSize="sm"
          cursor="pointer"
          onClick={onToggleSidebar}
          title={collapsed ? "Toggle sidebar" : undefined}
        >
          <Icon
            as={collapsed ? LuPanelLeftOpen : LuPanelLeftClose}
            alignSelf="center"
            boxSize={4}
            mx={collapsed ? "auto" : 0}
          />
          {!collapsed && <Text ml={1} fontSize="sm">Toggle Menu</Text>}
        </Flex>
      )}
      
      {renderMenuItems(mainItems)}
      {renderMenuItems(taskItems, "Task Management", "tasks")}
      {renderMenuItems(emailItems, "Email & Communication", "email")}
      {renderMenuItems(financeItems, "Finance", "finance")}
      {renderMenuItems(adminItems, "Administration", "admin")}
      {renderMenuItems(systemItems, "System", "system")}
    </Box>
  )
}

export default SidebarItems
