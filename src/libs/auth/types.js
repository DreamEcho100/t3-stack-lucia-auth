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
 * @typedef {Omit<
 * 	 User_,
 * 	 | 'isEmailVerified'
 * 	 | 'is2FARegistered'
 * 	 | 'passwordHash'
 * 	 | 'recoveryCode'
 * 	 | 'totpKey'
 * 	 | 'isTwoFactorEnabled'
 * 	 | 'createdAt'
 * 	 | 'updatedAt'
 * 	> & {
 * 	 is2FARegistered: boolean;
 * 	 isEmailVerified: boolean;
 * 	 isTwoFactorEnabled: boolean;
 * 	 createdAt: DateLike;
 * 	 updatedAt?: DateLike | null;
 * }} User
 * @typedef {Session_} DBSession
 * @typedef {Omit<
 * 		Session_,
 * 		| 'expiresAt'
 * 		| 'isTwoFactorVerified'
 * > & {
 * 	expiresAt: DateLike;
 * 	isTwoFactorVerified: boolean;
 * }} Session
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
 * @typedef {Omit<
 * 	PasswordResetSession_,
 * 	| 'expiresAt'
 * 	| 'isEmailVerified'
 * 	| 'isTwoFactorVerified'
 * > & {
 *  expiresAt: DateLike;
 *  isEmailVerified: boolean;
 *  isTwoFactorVerified: boolean;
 *  createdAt: DateLike;
 * }} PasswordResetSession
 *
 * @typedef {{ session: PasswordResetSession; user: User }} PasswordResetSessionValidationSuccessResult
 * @typedef {{ session: null; user: null }} PasswordResetSessionValidationFailureResult
 * @typedef {PasswordResetSessionValidationSuccessResult | PasswordResetSessionValidationFailureResult} PasswordResetSessionValidationResult
 */

export {};
