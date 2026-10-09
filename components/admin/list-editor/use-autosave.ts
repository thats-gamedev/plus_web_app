"use client"

import { useCallback, useEffect, useRef } from "react"
import { saveListDraft } from "@/app/admin/content/list-actions"
import { useEditor, useEditorStore } from "./store"

const AUTOSAVE_MS = 1500

/**
 * Saves the draft 1.5 s after the last change (spec). A conflict (the draft
 * changed elsewhere) stops autosaving until the admin picks Reload or
 * Overwrite. Returns `saveNow` for Overwrite and for saving before Publish.
 */
export function useAutosave(resourceId: string) {
  const store = useEditorStore()
  const revision = useEditor((s) => s.revision)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const saveNow = useCallback(
    async ({ overwrite = false } = {}) => {
      clearTimeout(timer.current)
      const { doc, draftToken, revision: savingRevision, setSave } = store.getState()
      setSave({ state: "saving" })
      const result = await saveListDraft(resourceId, doc, draftToken, overwrite)
      if (result.ok) {
        // Edits made while saving keep the editor dirty; the next run saves them.
        const changedMeanwhile = store.getState().revision !== savingRevision
        setSave(changedMeanwhile ? { state: "dirty" } : { state: "saved", at: result.draftUpdatedAt }, result.draftUpdatedAt)
        return true
      }
      setSave(result.conflict ? { state: "conflict" } : { state: "error", message: result.message })
      return false
    },
    [resourceId, store]
  )

  useEffect(() => {
    if (revision === 0) return
    if (store.getState().save.state === "conflict") return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void saveNow(), AUTOSAVE_MS)
    return () => clearTimeout(timer.current)
  }, [revision, saveNow, store])

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const state = store.getState().save.state
      if (state === "dirty" || state === "saving" || state === "conflict") event.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [store])

  return { saveNow }
}
