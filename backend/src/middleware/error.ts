import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten() })
    return
  }

  const message = err instanceof Error ? err.message : 'Internal server error'
  const status = message.includes('not found') ? 404
    : message.includes('not active') || message.includes('already') ? 409
    : 500

  console.error(err)
  res.status(status).json({ error: message })
}
