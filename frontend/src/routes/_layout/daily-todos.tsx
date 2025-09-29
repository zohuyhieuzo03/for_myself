import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import DailyTodosView from "@/components/Todos/DailyTodosView"

export const Route = createFileRoute("/_layout/daily-todos")({
  component: DailyTodosPage,
})

function DailyTodosPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <DailyTodosView 
      selectedId={selectedId} 
      onSelectedIdChange={setSelectedId}
    />
  )
}
