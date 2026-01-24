import type {
	AuthenticationInput,
	AuthenticationResponse,
	AuthIdentityDTO,
	AuthIdentityProviderService,
	ICacheService,
	Logger,
} from "@medusajs/framework/types"
import {
	AbstractAuthModuleProvider,
	ContainerRegistrationKeys,
	MedusaError,
	Modules,
} from "@medusajs/framework/utils"
import { isDefined } from "../../../utils/is-defined"

type InjectedDependencies = {
	[Modules.CACHE]: ICacheService
	[ContainerRegistrationKeys.LOGGER]: Logger
}

export const OTP_RETURN_KEY = "otp_generated"
// Special key used to store recently registered identifiers for direct authentication
export const RECENTLY_REGISTERED_KEY = "recently_registered"

export class OtpAuthProviderService extends AbstractAuthModuleProvider {
	static identifier = "otp"

	protected cacheService_: ICacheService
	protected logger_: Logger

	constructor(container: InjectedDependencies) {
		super()
		this.cacheService_ = container[Modules.CACHE]
		this.logger_ = container[ContainerRegistrationKeys.LOGGER]
	}

	async authenticate(
		data: AuthenticationInput,
		authIdentityProviderService: AuthIdentityProviderService,
	): Promise<AuthenticationResponse> {
		if (!isDefined(data.body?.identifier)) {
			return {
				success: false,
				error: "Identifier is required",
			}
		}

		const identifier = data.body?.identifier

		try {
			// Check if this is a recently registered user (within the TTL window)
			const isRecentlyRegistered = await this.cacheService_.get(
				`${RECENTLY_REGISTERED_KEY}:${identifier}:${data.body?.otp}`,
			)

			if (isRecentlyRegistered === "true") {
				// If recently registered, allow direct authentication without OTP
				try {
					const authIdentity = await authIdentityProviderService.retrieve({
						entity_id: identifier,
					})

					await this.cacheService_.invalidate(
						`${RECENTLY_REGISTERED_KEY}:${identifier}`,
					)

					return {
						success: true,
						authIdentity,
					}
				} catch (_error) {
					return {
						success: false,
						error: "Authentication failed",
					}
				}
			}

			// If not recently registered and no OTP provided, we need to generate a new OTP
			if (!isDefined(data.body?.otp)) {
				return {
					success: false,
					error: "OTP is required for authentication",
				}
			}

			// Verify the OTP
			const otp = await this.cacheService_.get(`otp:${identifier}`)

			if (otp !== data.body?.otp) {
				return {
					success: false,
					error: "Invalid OTP",
				}
			}

			// OTP is valid, retrieve the auth identity
			const authIdentity = await authIdentityProviderService.retrieve({
				entity_id: identifier,
			})

			return {
				success: true,
				authIdentity,
			}
		} catch (error) {
			this.logger_.error(error)
			return {
				success: false,
				error: "Authentication failed",
			}
		}
	}

	async register(
		data: AuthenticationInput,
		authIdentityProviderService: AuthIdentityProviderService,
	): Promise<AuthenticationResponse> {
		if (!isDefined(data.body?.identifier)) {
			return {
				success: false,
				error: "Identifier is required",
			}
		}

		if (!isDefined(data.body?.otp)) {
			return {
				success: false,
				error: "OTP is required",
			}
		}

		const otp = await this.cacheService_.get(
			`otp:pre-register:${data.body?.identifier}`,
		)

		if (otp !== data.body?.otp) {
			return {
				success: false,
				error: "Invalid OTP",
			}
		}

		let authIdentity: AuthIdentityDTO | undefined
		try {
			authIdentity = await authIdentityProviderService.retrieve({
				entity_id: data.body?.identifier,
			})
		} catch (error: unknown) {
			if (!(error instanceof MedusaError))
				return { success: false, error: JSON.stringify(error) }

			if (error.type !== MedusaError.Types.NOT_FOUND)
				return { success: false, error: error.message }

			// If the identity is not found, we create it
			authIdentity = await authIdentityProviderService.create({
				entity_id: data.body?.identifier,
			})
		}

		if (!authIdentity) {
			return {
				success: false,
				error: "Failed to create identity",
			}
		}

		const REGISTER_TTL = 60 // seconds
		// Mark this identifier as recently registered to allow direct one time authentication
		await this.cacheService_.set(
			`${RECENTLY_REGISTERED_KEY}:${data.body?.identifier}:${otp}`,
			"true",
			REGISTER_TTL,
		)

		return {
			success: true,
			authIdentity,
		}
	}
}

export default OtpAuthProviderService
