interface Event {
  brand_id: string;
  vendor_id: string;
  ip: string;
  user_agent: string | null;
  created_at: string;
}

interface RotationState {
  brand_id: string;
  last_vendor_index: number;
}

const events: Event[] = [];
const rotationStates = new Map<string, RotationState>();

export function addEvent(event: Event): void {
  events.push(event);
  if (events.length > 1000) events.splice(0, events.length - 200);
}

export function getRecentEvents(brandId: string, ip: string, since: string): Event[] {
  const sinceDate = new Date(since).getTime();
  return events.filter(e => e.brand_id === brandId && e.ip === ip && new Date(e.created_at).getTime() >= sinceDate);
}

export function getRotationState(brandId: string): RotationState | undefined {
  return rotationStates.get(brandId);
}

export function setRotationState(state: RotationState): void {
  rotationStates.set(state.brand_id, state);
}

export function getAllEvents(): Event[] {
  return events.slice();
}
