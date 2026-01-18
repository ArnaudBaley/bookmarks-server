import { onMounted, onUnmounted } from 'vue'

export interface KeyboardShortcutOptions {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  preventDefault?: boolean
  callback: (event: KeyboardEvent) => void
}

/**
 * Composable pour gérer les raccourcis clavier de manière réutilisable
 * 
 * @param options - Configuration du raccourci clavier
 * @example
 * useKeyboardShortcut({
 *   key: 'k',
 *   ctrl: true,
 *   callback: () => alert('OK')
 * })
 */
export function useKeyboardShortcut(options: KeyboardShortcutOptions): void {
  const {
    key,
    ctrl = false,
    shift = false,
    alt = false,
    meta = false,
    preventDefault = true,
    callback,
  } = options

  function handleKeyDown(event: KeyboardEvent): void {
    // Vérifier si la touche correspond
    if (event.key.toLowerCase() !== key.toLowerCase()) {
      return
    }

    // Vérifier les modificateurs
    // Support CTRL (Windows/Linux) et CMD (Mac) : si ctrl est demandé, on accepte ctrlKey ou metaKey
    const ctrlOrMetaMatch = ctrl
      ? event.ctrlKey || event.metaKey
      : !event.ctrlKey && !event.metaKey
    const shiftMatch = shift ? event.shiftKey : !event.shiftKey
    const altMatch = alt ? event.altKey : !event.altKey
    // meta est utilisé uniquement si on veut spécifiquement metaKey (sans accepter ctrlKey)
    // Si ctrl est true, on ignore la vérification meta car ctrlOrMetaMatch gère déjà les deux
    const metaMatch = ctrl
      ? true // Si ctrl est demandé, on ignore meta (déjà géré par ctrlOrMetaMatch)
      : meta ? event.metaKey : !event.metaKey

    if (ctrlOrMetaMatch && shiftMatch && altMatch && metaMatch) {
      if (preventDefault) {
        event.preventDefault()
      }
      callback(event)
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}
