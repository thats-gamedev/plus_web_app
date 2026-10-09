/** "CR-3197F683": short, readable request number for receipts and pages. */
export function requestNumber(id: string): string {
  return `CR-${id.slice(0, 8).toUpperCase()}`
}
