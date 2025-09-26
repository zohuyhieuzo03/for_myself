import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import type { TodoPublic } from "@/client"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"
import DeleteTodo from "./DeleteTodo"

interface TodoActionsMenuProps {
  todo: TodoPublic
}

export const TodoActionsMenu = ({ todo }: TodoActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton
          variant="ghost"
          color="inherit"
          aria-label="Actions"
          onClick={(e) => {
            e.stopPropagation()
          }}
          onPointerDown={(e) => {
            // Prevent drag or parent click when opening menu
            e.stopPropagation()
          }}
        >
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <DeleteTodo id={todo.id} />
      </MenuContent>
    </MenuRoot>
  )
}
