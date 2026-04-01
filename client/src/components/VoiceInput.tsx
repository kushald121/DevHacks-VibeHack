import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  onTranscript: (text: string) => void
}

type SpeechResult = { transcript: string }
type SpeechResultEvent = { results: ArrayLike<ArrayLike<SpeechResult>> }
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export default function VoiceInput({ onTranscript }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    const Ctor = (((window as Window & { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition) ||
      window.webkitSpeechRecognition) as SpeechRecognitionCtor | undefined
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onresult = (event: SpeechResultEvent) => {
      const text = Array.from(event.results)
        .map((res: ArrayLike<SpeechResult>) => res[0]?.transcript ?? '')
        .join(' ')
      setLiveText(text.trim())
      onTranscript(text.trim())
    }
    recognition.onerror = () => {
      setError('Microphone permission denied or unavailable.')
      setIsRecording(false)
    }
    recognition.onend = () => setIsRecording(false)
    recognitionRef.current = recognition
  }, [onTranscript])

  const toggleRecord = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.')
      return
    }
    if (isRecording) {
      recognitionRef.current.stop()
      return
    }
    setError('')
    setIsRecording(true)
    recognitionRef.current.start()
  }

  return (
    <div className="voice-wrap">
      <button className={`ui-btn ui-btn--ghost ui-btn--icon voice-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecord} type="button" aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
      {liveText && <p className="voice-live">{liveText}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
