import { Box, Container, Grid, GridItem, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

import DashboardStats from "@/components/Dashboard/DashboardStats"
import QuickActions from "@/components/Dashboard/QuickActions"
import UpcomingDueDates from "@/components/Dashboard/UpcomingDueDates"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  return (
    <Container maxW="full">
      <Box pt={8} m={4}>
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr", xl: "2fr 1fr" }} gap={6}>
          {/* Main content area */}
          <GridItem>
            <VStack gap={6} align="stretch">
              {/* Quick Stats */}
              <DashboardStats />
              
              {/* Quick Actions */}
              <QuickActions />
            </VStack>
          </GridItem>

          {/* Upcoming Due Dates */}
          <GridItem>
            <UpcomingDueDates />
          </GridItem>
        </Grid>
      </Box>
    </Container>
  )
}
