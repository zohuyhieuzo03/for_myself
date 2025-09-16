import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiCalendar, FiRefreshCw } from "react-icons/fi"

import { GmailService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"

interface MonthlySyncProps {
  connectionId: string
  onSyncComplete?: () => void
}

export default function MonthlySync({
  connectionId,
  onSyncComplete,
}: MonthlySyncProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const syncEmailsByMonthMutation = useMutation({
    mutationFn: async () => {
      const response = await GmailService.syncEmailsByMonth({
        connectionId,
        year: selectedYear,
        month: selectedMonth,
      })
      return response
    },
    onSuccess: (data) => {
      showSuccessToast(
        data.message ||
          `Successfully synced emails for ${selectedYear}/${selectedMonth.toString().padStart(2, "0")}`,
      )
      queryClient.invalidateQueries({ queryKey: ["email-transactions"] })
      queryClient.invalidateQueries({ queryKey: ["gmail-connections"] })
      onSyncComplete?.()
    },
    onError: (error) => {
      showErrorToast(`Failed to sync emails: ${error.message}`)
    },
  })

  // Generate year options (current year and previous 5 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Generate month options
  const monthOptions = [
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
  ]

  const handleSync = () => {
    syncEmailsByMonthMutation.mutate()
  }

  return (
    <Card.Root p={6}>
      <VStack gap={4} align="stretch">
        <HStack>
          <FiCalendar />
          <Heading size="md">Sync Email Theo Tháng</Heading>
        </HStack>

        <Text color="gray.600" fontSize="sm">
          Chọn tháng và năm để sync email từ Gmail. Chỉ những email chưa được
          sync sẽ được xử lý.
        </Text>

        <HStack gap={4}>
          <Box flex={1}>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Năm
            </Text>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
              }}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </Box>

          <Box flex={1}>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Tháng
            </Text>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
              }}
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </Box>
        </HStack>

        <Button
          onClick={handleSync}
          loading={syncEmailsByMonthMutation.isPending}
          loadingText="Đang sync..."
          colorPalette="blue"
          size="sm"
          disabled={!selectedYear || !selectedMonth}
        >
          <HStack>
            <FiRefreshCw />
            <span>
              Sync Email {selectedYear}/
              {selectedMonth.toString().padStart(2, "0")}
            </span>
          </HStack>
        </Button>

        {syncEmailsByMonthMutation.isPending && (
          <HStack justify="center" py={2}>
            <Spinner size="sm" />
            <Text fontSize="sm" color="gray.600">
              Đang sync email từ Gmail...
            </Text>
          </HStack>
        )}
      </VStack>
    </Card.Root>
  )
}
