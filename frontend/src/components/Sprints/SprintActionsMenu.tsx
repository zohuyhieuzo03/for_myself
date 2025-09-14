import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import type { SprintPublic } from "@/client"
import DeleteSprint from "./DeleteSprint"
import EditSprint from "./EditSprint"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

interface SprintActionsMenuProps {
  sprint: SprintPublic
}

export const SprintActionsMenu = ({ sprint }: SprintActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditSprint sprint={sprint} />
        <DeleteSprint id={sprint.id} />
      </MenuContent>
    </MenuRoot>
  )
}