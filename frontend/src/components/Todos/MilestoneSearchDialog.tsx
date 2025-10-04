import { Button } from "@chakra-ui/react"
import { useState } from "react"
import { FiTarget } from "react-icons/fi"

import type { RoadmapMilestonePublic } from "@/client"
import MilestoneSearch from "@/components/Todos/MilestoneSearch"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"

interface MilestoneSearchDialogProps {
  onSelectMilestone: (milestone: RoadmapMilestonePublic) => void
  excludeIds?: string[]
  placeholder?: string
  triggerText?: string
  title?: string
  maxHeight?: string
}

export default function MilestoneSearchDialog({
  onSelectMilestone,
  excludeIds = [],
  placeholder = "Search milestones...",
  triggerText = "Search",
  title = "Select Milestone",
  maxHeight = "500px",
}: MilestoneSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectMilestone = (milestone: RoadmapMilestonePublic) => {
    onSelectMilestone(milestone)
    setIsOpen(false)
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FiTarget style={{ marginRight: "8px" }} />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent maxW="600px" maxH="80vh">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <MilestoneSearch
            onSelectMilestone={handleSelectMilestone}
            excludeIds={excludeIds}
            placeholder={placeholder}
            maxHeight={maxHeight}
          />
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}
