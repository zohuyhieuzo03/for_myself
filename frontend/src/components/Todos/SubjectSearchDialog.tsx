import { Button } from "@chakra-ui/react"
import { useState } from "react"
import { FiUser } from "react-icons/fi"

import type { ResourceSubjectPublic } from "@/client"
import SubjectSearch from "@/components/Todos/SubjectSearch"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"

interface SubjectSearchDialogProps {
  onSelectSubject: (subject: ResourceSubjectPublic) => void
  excludeIds?: string[]
  placeholder?: string
  triggerText?: string
  title?: string
  maxHeight?: string
}

export default function SubjectSearchDialog({
  onSelectSubject,
  excludeIds = [],
  placeholder = "Search subjects...",
  triggerText = "Search",
  title = "Select Subject",
  maxHeight = "500px",
}: SubjectSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectSubject = (subject: ResourceSubjectPublic) => {
    onSelectSubject(subject)
    setIsOpen(false)
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FiUser style={{ marginRight: "8px" }} />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent maxW="600px" maxH="80vh">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <SubjectSearch
            onSelectSubject={handleSelectSubject}
            excludeIds={excludeIds}
            placeholder={placeholder}
            maxHeight={maxHeight}
          />
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}
