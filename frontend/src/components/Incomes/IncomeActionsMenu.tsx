import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import type { IncomePublic } from "@/client"
import DeleteIncome from "./DeleteIncome"
import EditIncome from "./EditIncome"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

interface IncomeActionsMenuProps {
  income: IncomePublic
  sprints: Array<{ id: string; start_date: string; end_date: string }>
}

export const IncomeActionsMenu = ({ income, sprints }: IncomeActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditIncome income={income} sprints={sprints} />
        <DeleteIncome id={income.id} />
      </MenuContent>
    </MenuRoot>
  )
}
