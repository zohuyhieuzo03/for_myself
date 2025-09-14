import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import type { AccountPublic } from "@/client"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"
import DeleteAccount from "./DeleteAccount"
import EditAccount from "./EditAccount"

interface AccountActionsMenuProps {
  account: AccountPublic
}

export const AccountActionsMenu = ({ account }: AccountActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditAccount account={account} />
        <DeleteAccount id={account.id} />
      </MenuContent>
    </MenuRoot>
  )
}
