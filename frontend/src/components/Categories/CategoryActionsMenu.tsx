import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import type { CategoryPublic } from "@/client"
import DeleteCategory from "./DeleteCategory"
import EditCategory from "./EditCategory"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

interface CategoryActionsMenuProps {
  category: CategoryPublic
}

export const CategoryActionsMenu = ({ category }: CategoryActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditCategory category={category} />
        <DeleteCategory id={category.id} />
      </MenuContent>
    </MenuRoot>
  )
}
