import { Button, Flex, Input, Textarea } from "@chakra-ui/react"
import { useState } from "react"
import { FaRegCommentDots } from "react-icons/fa6"
import { FeedbackService } from "@/client"
import { useMutation } from "@tanstack/react-query"
import useCustomToast from "@/hooks/useCustomToast"
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

const FeedbackButton = () => {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const createMutation = useMutation({
    mutationFn: () =>
      FeedbackService.createFeedback({
        requestBody: { title, description: description || null },
      }),
    onSuccess: () => {
      showSuccessToast("Feedback sent")
      setTitle("")
      setDescription("")
      setIsOpen(false)
    },
    onError: () => {
      showErrorToast("Failed to send feedback")
    },
  })

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          <Flex alignItems="center" gap={2}>
            <FaRegCommentDots />
            <span>Feedback</span>
          </Flex>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your feedback"
              rows={5}
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="subtle" onClick={() => setIsOpen(false)} mr={2}>
            Cancel
          </Button>
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!title.trim()}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export default FeedbackButton


