import { HStack, Text } from "@chakra-ui/react"

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  disabled?: boolean
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
}: DateRangePickerProps) {
  return (
    <HStack gap={2} align="center">
      <Text fontSize="sm" color="gray.600" minWidth="fit-content">
        From:
      </Text>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        disabled={disabled}
        style={{
          height: 32,
          paddingInline: 8,
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          fontSize: 14,
          minWidth: 120,
          backgroundColor: disabled ? "#f7fafc" : "white",
          color: disabled ? "#a0aec0" : "inherit",
        }}
      />
      <Text fontSize="sm" color="gray.600" minWidth="fit-content">
        To:
      </Text>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        disabled={disabled}
        style={{
          height: 32,
          paddingInline: 8,
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          fontSize: 14,
          minWidth: 120,
          backgroundColor: disabled ? "#f7fafc" : "white",
          color: disabled ? "#a0aec0" : "inherit",
        }}
      />
    </HStack>
  )
}
