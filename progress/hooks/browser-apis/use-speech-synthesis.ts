import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useSpeechSynthesis(__sauron_id__ = _sid()) {
  return createHook(
    "useSpeechSynthesis",
    __sauron_id__,

    () => ({
      value: {
        speaking: false,
        supported:
          typeof window !== "undefined" &&
          "speechSynthesis" in window,
        voices: [],
        utterance: null as SpeechSynthesisUtterance | null
      }
    }),

    (state, key, notify) => {
      const s = state.value

      // load voices once
      if (!state.cleanup && s.supported) {
        const loadVoices = () => {
          s.voices = window.speechSynthesis.getVoices()
          notify(key)
        }

        window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
        loadVoices()

        state.cleanup = () => {
          window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
        }
      }

      const speak = (text: string, options: any = {}) => {
        if (!s.supported) return

        if (s.speaking) {
          window.speechSynthesis.cancel()
        }

        const utter = new SpeechSynthesisUtterance(text)

        if (options.voice) utter.voice = options.voice
        if (options.pitch) utter.pitch = options.pitch
        if (options.rate) utter.rate = options.rate
        if (options.volume) utter.volume = options.volume
        if (options.lang) utter.lang = options.lang

        utter.onstart = () => {
          s.speaking = true
          s.utterance = utter
          notify(key)
        }

        utter.onend = () => {
          s.speaking = false
          s.utterance = null
          notify(key)
        }

        window.speechSynthesis.speak(utter)
      }

      const cancel = () => {
        if (s.supported && s.speaking) {
          window.speechSynthesis.cancel()
          s.speaking = false
          s.utterance = null
          notify(key)
        }
      }

      const getVoices = () => s.voices

      return [
        s.speaking,
        speak,
        cancel,
        getVoices
      ] as const
    }
  )
}
