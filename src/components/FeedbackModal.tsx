import { useState } from 'react'
import { submitFeedback } from '../lib/feedback'

interface FeedbackModalProps {
  onClose: () => void
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const { error } = await submitFeedback(message.trim())
    setSubmitting(false)
    if (error) {
      setError(error)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-16">
      <div className="w-full max-w-lg rounded-xl bg-neutral-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">Feedback</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <p className="text-sm text-indigo-400">Thanks — feedback sent ✓</p>
        ) : (
          <>
            <textarea
              autoFocus
              rows={4}
              placeholder="Bugs, ideas, anything you'd change…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mb-3 w-full resize-none rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-indigo-500 focus:outline-none"
            />
            {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting || message.trim().length === 0}
              className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
