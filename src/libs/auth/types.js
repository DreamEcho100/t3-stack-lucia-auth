/**
 * @import { User as User_, Session as Session_, EmailVerificationRequest as EmailVerificationRequest_, PasswordResetSession as PasswordResetSession_ } from "@prisma/client"
 */

/**
 *
 * @typedef {string|number|Date} DateLike
 * @typedef {(name: string, value: string, options: object) => void} SetCookie
 * @typedef {(name: string) => string | null | undefined} GetCookie
 */
/**
 *
 * @typedef {User_} DBUser
 * @typedef {Omit<User_, 'emailVerified' | 'registered2FA' | 'passwordHash' | 'recoveryCode' | 'totpKey' | 'isTwoFactorEnabled'> & { registered2FA: boolean; emailVerified: boolean; isTwoFactorEnabled: boolean; }} User
 * @typedef {Session_} DBSession
 * @typedef {Omit<Session_, 'expiresAt' | 'twoFactorVerified'> & { expiresAt: DateLike; twoFactorVerified: boolean; }} Session
 *
 * @typedef {{ session: Session; user: User }} ValidSessionResult
 * @typedef {{ session: null; user: null }} InvalidSessionResult
 * @typedef {ValidSessionResult	| InvalidSessionResult} SessionValidationResult
 */

/**
 * @typedef {EmailVerificationRequest_} DBEmailVerificationRequest
 * @typedef {Omit<EmailVerificationRequest_, 'expiresAt'> & { expiresAt: DateLike }} EmailVerificationRequest
 */

/**
 * @typedef {PasswordResetSession_} DBPasswordResetSession
 * @typedef {Omit<PasswordResetSession_, 'expiresAt' | 'emailVerified' | 'twoFactorVerified'> & { expiresAt: DateLike; emailVerified: boolean; twoFactorVerified: boolean; }} PasswordResetSession
 *
 * @typedef {{ session: PasswordResetSession; user: User }} PasswordResetSessionValidationSuccessResult
 * @typedef {{ session: null; user: null }} PasswordResetSessionValidationFailureResult
 * @typedef {PasswordResetSessionValidationSuccessResult | PasswordResetSessionValidationFailureResult} PasswordResetSessionValidationResult
 */

export {};
