'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EventInfo, validateEventCode } from '@/lib/api'

interface CodeModalProps {
    event: EventInfo
    onClose: () => void
    onSuccess: (event: EventInfo) => void
}

export function CodeModal({ event, onClose, onSuccess }: CodeModalProps) {
    const [code, setCode] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const result = await validateEventCode(event.slug, code.trim())

            if (result.valid) {
                onSuccess(event)
            } else {
                setError(result.error || 'Código inválido')
            }
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-4xl mb-3">🔐</div>
                    <h2 className="text-xl font-bold mb-1">Código de acceso</h2>
                    <p className="text-sm text-text-secondary">
                        Ingresa el código para unirte a <span className="text-primary font-medium">{event.name}</span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase())
                            setError(null)
                        }}
                        placeholder="CÓDIGO"
                        className="w-full px-4 py-3 text-center text-lg font-mono tracking-widest rounded-xl bg-surface border border-white/10 focus:border-primary focus:outline-none transition-colors mb-3"
                        autoFocus
                        maxLength={10}
                    />

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-error text-sm text-center mb-3"
                        >
                            ❌ {error}
                        </motion.p>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn flex-1 bg-surface hover:bg-surface-light"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!code.trim() || isLoading}
                            className="btn btn-primary flex-1 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verificando...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
