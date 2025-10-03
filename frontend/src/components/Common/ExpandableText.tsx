import { Box, Button, Text } from "@chakra-ui/react"
import { useState } from "react"

interface ExpandableTextProps {
  text: string
  maxHeight?: string
  fontSize?: string
  color?: string
  whiteSpace?: string
  lineHeight?: string
  bgColor?: string
  borderColor?: string
  p?: string
  borderRadius?: string
}

export function ExpandableText({
  text,
  maxHeight = "4.5em", // ~3 lines with default line height
  fontSize = "sm",
  color = "gray.600",
  whiteSpace = "pre-wrap",
  lineHeight,
  bgColor,
  borderColor,
  p = "3",
  borderRadius = "md",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Box
      bg={bgColor}
      borderColor={borderColor}
      borderWidth={borderColor ? "1px" : "0"}
      p={p}
      borderRadius={borderRadius}
    >
      <Box
        maxHeight={isExpanded ? "none" : maxHeight}
        overflow={isExpanded ? "visible" : "hidden"}
        position="relative"
      >
        <Text
          fontSize={fontSize}
          color={color}
          whiteSpace={whiteSpace}
          lineHeight={lineHeight}
        >
          {text}
        </Text>
        {!isExpanded && (
          <Box
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            height="2em"
            bgGradient="linear(to-t, white, transparent)"
            pointerEvents="none"
          />
        )}
      </Box>
      <Button
        variant="ghost"
        size="xs"
        color="blue.600"
        fontWeight="medium"
        onClick={() => setIsExpanded(!isExpanded)}
        mt={1}
        p={0}
        h="auto"
        minH="auto"
        _hover={{ bg: "transparent", textDecoration: "underline" }}
      >
        {isExpanded ? "Show less" : "Show more"}
      </Button>
    </Box>
  )
}
