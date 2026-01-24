import {
	createWorkflow,
	WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type { OtpOptions } from "../types"
import { getActorStep } from "./steps/get-actor-step"
import { getAuthIdentityStep } from "./steps/get-auth-identity-step"
import { getStoredOtpStep } from "./steps/get-stored-otp-step"
import { validateOtpStep } from "./steps/validate-otp-step"

/**
 * Verifies an OTP for a given identifier and actor type.
 *
 * @param input - The input for the workflow.
 * @param input.identifier - The identifier of the actor to verify the OTP for.
 * @param input.otp - The OTP to verify.
 * @param input.actorType - The type of actor to verify the OTP for.
 * @param input.accessorsPerActor - The accessors per actor to use for the workflow.
 */
const verifyOtpWorkflow = createWorkflow(
	"verify-otp",
	(input: {
		identifier: string
		otp: string
		actorType: string
		accessorsPerActor: Required<OtpOptions>["accessorsPerActor"][string]
	}) => {
		const { actor } = getActorStep({
			identifier: input.identifier,
			actorType: input.actorType,
			accessorsPerActor: input.accessorsPerActor,
		})

		const { authIdentity } = getAuthIdentityStep({
			identifier: input.identifier,
			actorType: input.actorType,
			accessorsPerActor: input.accessorsPerActor,
			foundActor: actor,
		})

		const storedOtpResult = getStoredOtpStep({
			key: authIdentity?.id,
		})

		const validateOtpResult = validateOtpStep({
			storedOtp: storedOtpResult?.storedOtp,
			otp: input.otp,
		})

		// If we reach this point, validation was successful
		return new WorkflowResponse({
			isValid: validateOtpResult?.isValid,
			authIdentity: authIdentity,
		})
	},
)

export default verifyOtpWorkflow
