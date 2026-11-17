import type { EventPageContent } from '@gyn/core/event-schema'
import { Network } from '@/components/home/Network'

/** The ambassadors map, edited per event. Network draws its own section (white, with soft glows). */
export function Ambassadors({ data }: { data: EventPageContent['ambassadors'] }) {
  return (
    <div id="ambassadors">
      <Network data={data} tone="light" />
    </div>
  )
}
