import { Box, Text } from "@chakra-ui/react"
import { memo } from "react"

interface SimpleDragPreviewProps {
  title: string
}

// Lightweight drag preview component for kanban
const SimpleDragPreview = memo(({ title }: SimpleDragPreviewProps) => (
  <Box
    bg="white"
    p={3}
    borderRadius="md"
    shadow="xl"
    border="2px solid"
    borderColor="blue.400"
    minW="280px"
    opacity={0.95}
    style={{
      transform: "rotate(3deg)",
    }}
  >
    <Text
      fontWeight="medium"
      fontSize="sm"
      overflow="hidden"
      textOverflow="ellipsis"
      display="-webkit-box"
      style={{ WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
    >
      {title}
    </Text>
  </Box>
))

SimpleDragPreview.displayName = "SimpleDragPreview"

export default SimpleDragPreview
