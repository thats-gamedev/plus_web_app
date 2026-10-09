"use client"

import { createContext, useContext } from "react"
import { createStore, type StoreApi, useStore } from "zustand"
import * as ops from "@/lib/lists/editor"
import type { ListDocument } from "@/lib/lists/schema"

// Editor state (spec: "Zustand store holding the document"). One store per
// editor instance, provided through context. Every change goes through the
// pure operations in lib/lists/editor and bumps `revision`, which drives
// autosave.

export type SaveStatus =
  | { state: "saved"; at: string | null }
  | { state: "dirty" }
  | { state: "saving" }
  | { state: "error"; message: string }
  | { state: "conflict" }

export type EditorState = {
  doc: ListDocument
  selectedItemId: string | null
  /** Changes since load; autosave watches it. */
  revision: number
  /** Last document before a destructive change, for the undo toast. */
  undoDoc: ListDocument | null
  /** The server's draft_updated_at the editor last saw, for the conflict check. */
  draftToken: string | null
  save: SaveStatus

  change: (fn: (doc: ListDocument) => ListDocument, options?: { undoable?: boolean }) => void
  select: (itemId: string | null) => void
  undo: () => void
  setSave: (save: SaveStatus, draftToken?: string | null) => void
}

export function createEditorStore(initial: { doc: ListDocument; draftToken: string | null; savedAt: string | null }) {
  return createStore<EditorState>()((set, get) => ({
    doc: initial.doc,
    selectedItemId: null,
    revision: 0,
    undoDoc: null,
    draftToken: initial.draftToken,
    save: { state: "saved", at: initial.savedAt },

    change: (fn, { undoable = false } = {}) => {
      const before = get().doc
      const after = fn(before)
      if (after === before) return
      set((s) => ({
        doc: after,
        revision: s.revision + 1,
        undoDoc: undoable ? before : s.undoDoc,
        save: s.save.state === "conflict" ? s.save : { state: "dirty" },
      }))
    },

    select: (itemId) => set({ selectedItemId: itemId }),

    undo: () => {
      const { undoDoc } = get()
      if (!undoDoc) return
      set((s) => ({ doc: undoDoc, undoDoc: null, revision: s.revision + 1, save: { state: "dirty" } }))
    },

    setSave: (save, draftToken) => set(draftToken === undefined ? { save } : { save, draftToken }),
  }))
}

export type EditorStore = StoreApi<EditorState>

export const EditorContext = createContext<EditorStore | null>(null)

export function useEditor<T>(selector: (state: EditorState) => T): T {
  const store = useContext(EditorContext)
  if (!store) throw new Error("useEditor must be used inside the list editor")
  return useStore(store, selector)
}

export function useEditorStore(): EditorStore {
  const store = useContext(EditorContext)
  if (!store) throw new Error("useEditorStore must be used inside the list editor")
  return store
}

export { ops }
