import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import type { IncomePublic } from "@/client"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"
import DeleteIncome from "./DeleteIncome"
import EditIncome from "./EditIncome"

interface IncomeActionsMenuProps {
  income: IncomePublic
}

export const IncomeActionsMenu = ({
  income,
}: IncomeActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditIncome income={income} />
        <DeleteIncome id={income.id} />
      </MenuContent>
    </MenuRoot>
  )
}
