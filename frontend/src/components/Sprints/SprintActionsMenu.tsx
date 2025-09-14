import { IconButton } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FiBarChart } from "react-icons/fi"
import type { SprintPublic } from "@/client"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"
import DeleteSprint from "./DeleteSprint"
import EditSprint from "./EditSprint"

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
        <Link
          to="/sprint-finance/sprint-detail"
          search={{ sprintId: sprint.id }}
        >
          <MenuItem value="financial-detail">
            <FiBarChart />
            View Financial Detail
          </MenuItem>
        </Link>
        <EditSprint sprint={sprint} />
        <DeleteSprint id={sprint.id} />
      </MenuContent>
    </MenuRoot>
  )
}
