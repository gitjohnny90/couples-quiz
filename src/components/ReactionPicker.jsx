/**
 * Re-export barrel for the reaction system.
 * Old imports of `ReactionPicker` from this file will get ReactionPopup.
 * New code can import { ReactionBadge } or { useLongPress } directly.
 */
export { default } from './ReactionPopup'
export { default as ReactionPopup } from './ReactionPopup'
export { default as ReactionBadge } from './ReactionBadge'
export { default as useLongPress } from '../hooks/useLongPress'
