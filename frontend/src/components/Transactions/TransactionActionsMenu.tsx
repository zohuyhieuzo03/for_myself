import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import type { TransactionPublic } from "@/client"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"
import DeleteTransaction from "./DeleteTransaction"
import EditTransaction from "./EditTransaction"

interface TransactionActionsMenuProps {
  transaction: TransactionPublic
  accounts: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
  sprints: Array<{ id: string; start_date: string; end_date: string }>
}

export const TransactionActionsMenu = ({
  transaction,
  accounts,
  categories,
  sprints,
}: TransactionActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditTransaction
          transaction={transaction}
          accounts={accounts}
          categories={categories}
          sprints={sprints}
        />
        <DeleteTransaction id={transaction.id} />
      </MenuContent>
    </MenuRoot>
  )
}
