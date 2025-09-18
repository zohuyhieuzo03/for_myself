import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import {
  FiArrowUpCircle,
  FiBarChart,
  FiBriefcase,
  FiCheckSquare,
  FiCreditCard,
  FiHome,
  FiInbox,
  FiMail,
  FiSettings,
  FiTag,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiBriefcase, title: "Items", path: "/items" },
  { icon: FiCheckSquare, title: "Todos", path: "/todos" },
  { icon: FiMail, title: "Gmail Integration", path: "/gmail" },
  { icon: FiInbox, title: "Email Transactions", path: "/email-transactions" },
  {
    icon: FiBarChart,
    title: "Email Txn Dashboard",
    path: "/email-transactions-dashboard",
  },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

const sprintFinanceItems = [
  { icon: FiCreditCard, title: "Accounts", path: "/sprint-finance/accounts" },
  { icon: FiTag, title: "Categories", path: "/sprint-finance/categories" },
  { icon: FiArrowUpCircle, title: "Incomes", path: "/sprint-finance/incomes" },
  {
    icon: FiTrendingUp,
    title: "Transactions",
    path: "/sprint-finance/transactions",
  },
  {
    icon: FiTarget,
    title: "Allocation Rules",
    path: "/sprint-finance/allocation-rules",
  },
]

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const finalItems: Item[] = currentUser?.is_superuser
    ? [...items, { icon: FiUsers, title: "Admin", path: "/admin" }]
    : items

  const listItems = finalItems.map(({ icon, title, path }) => (
    <RouterLink key={title} to={path} onClick={onClose}>
      <Flex
        gap={4}
        px={4}
        py={2}
        _hover={{
          background: "gray.subtle",
        }}
        alignItems="center"
        fontSize="sm"
      >
        <Icon as={icon} alignSelf="center" />
        <Text ml={2}>{title}</Text>
      </Flex>
    </RouterLink>
  ))

  const sprintFinanceListItems = sprintFinanceItems.map(
    ({ icon, title, path }) => (
      <RouterLink key={title} to={path} onClick={onClose}>
        <Flex
          gap={4}
          px={4}
          py={2}
          _hover={{
            background: "gray.subtle",
          }}
          alignItems="center"
          fontSize="sm"
        >
          <Icon as={icon} alignSelf="center" />
          <Text ml={2}>{title}</Text>
        </Flex>
      </RouterLink>
    ),
  )

  return (
    <>
      <Text fontSize="xs" px={4} py={2} fontWeight="bold">
        Menu
      </Text>
      <Box>{listItems}</Box>
      <Box>{sprintFinanceListItems}</Box>
    </>
  )
}

export default SidebarItems
