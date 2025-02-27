import { createHmac, randomBytes } from 'node:crypto'
import { OtpOptions } from '../types'

/**
 * Static utility class for OTP operations
 */
export class OtpUtils {
  static DEFAULT_OPTIONS: OtpOptions = {
    digits: 6, // 6 digits
    ttl: 60 * 5, // 5 minutes
    mode: 'main',
    identifierKey: 'email'
  }

  /**
   * Generate a random numeric OTP of specified length
   * @param digits The number of digits the OTP should have
   * @returns {string} The OTP
   */
  static generateRandomOTP(digits: number): string {
    const timeStep = 30
    const secret = randomBytes(32).toString('hex')
    const time = Math.floor(Date.now() / 1000 / timeStep)

    const hmac = createHmac('sha1', Buffer.from(secret, 'hex'))
    hmac.update(Buffer.from(time.toString(), 'utf-8'))
    const hmacResult = hmac.digest()

    const offset = hmacResult[hmacResult.length - 1] & 0xf
    const binary =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff)

    return (binary % Math.pow(10, digits)).toString().padStart(digits, '0')
  }
}

export default OtpUtils