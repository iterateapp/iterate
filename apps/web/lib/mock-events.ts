export interface AmplitudeEvent {
  id: string
  eventType: string
  userId: string
  timestamp: string
  properties: Record<string, string | number | boolean>
}

export function generateMockEvents(): AmplitudeEvent[] {
  const eventTypes = [
    "page_view",
    "button_click",
    "search_performed",
    "item_viewed",
    "signup_completed",
    "feature_used",
    "session_start",
    "onboarding_step",
    "creator_profile_viewed",
    "content_shared",
  ]

  const pages = ["/home", "/discover", "/profile", "/settings", "/feed"]

  return Array.from({ length: 50 }, (_, i) => {
    const eventType = eventTypes[i % eventTypes.length]
    const daysAgo = Math.floor(i / 5)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(Math.floor(Math.random() * 24))
    date.setMinutes(Math.floor(Math.random() * 60))

    return {
      id: `evt_${String(i + 1).padStart(4, "0")}`,
      eventType,
      userId: `user_${String((i % 12) + 1).padStart(3, "0")}`,
      timestamp: date.toISOString(),
      properties: {
        page: pages[i % pages.length],
        duration_ms: Math.floor(Math.random() * 30000) + 500,
        is_new_user: i % 4 === 0,
      },
    }
  })
}
