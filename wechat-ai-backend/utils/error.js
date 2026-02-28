import { isAppError } from '../errors/AppError.js';

export function sendError(res, err, fallbackMsg) {
  if (isAppError(err)) {
    if (err.payload) {
      return res.status(err.status).json(err.payload);
    }
    return res.status(err.status).json({ msg: err.message });
  }
  return res.status(500).json({ msg: fallbackMsg, err: err.message });
}
