import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import type { TodoPublic } from "@/client"
import DeleteTodo from "./DeleteTodo"
import EditTodo from "./EditTodo"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

interface TodoActionsMenuProps {
  todo: TodoPublic
}

const TodoActionsMenu = ({ todo }: TodoActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditTodo todo={todo} />
        <DeleteTodo todo={todo} />
      </MenuContent>
    </MenuRoot>
  )
}

export default TodoActionsMenu
