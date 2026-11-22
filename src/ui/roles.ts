import { ROLE_CLASSES } from './labels'
import { content } from './run'

/** Label, Leitfrage und Farbklassen einer Segment-Rolle. */
export function roleInfo(role: string) {
  const r = content.roles.get(role)
  return { label: r?.label ?? role, question: r?.question ?? '', cls: ROLE_CLASSES[r?.color ?? 'slate'] }
}
