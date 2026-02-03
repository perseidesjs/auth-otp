import {
	createWorkflow,
	transform,
	WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { Events, type EventOptions, type OtpOptions } from "../types"
import { generateOtpStep } from "./steps/generate-otp-step"
import { getActorStep } from "./steps/get-actor-step"
import { getAuthIdentityStep } from "./steps/get-auth-identity-step"

/**
 * Generates an OTP for a given identifier and actor type.
 *
 * @param input - The input for the workflow.
 * @param input.identifier - The identifier of the actor to generate the OTP for.
 * @param input.actorType - The type of actor to generate the OTP for.
 * @param input.accessorsPerActor - The accessors per actor to use for the workflow.
 * @param input.eventOptions - The event options for OTP_GENERATED event.
 *
 */
const generateOtpWorkflow = createWorkflow(
	"generate-otp",
	function (input: {
		identifier: string
		actorType: string
		accessorsPerActor: Required<OtpOptions>["accessorsPerActor"][string]
		eventOptions?: EventOptions
	}) {
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

		const generatedOtpResult = generateOtpStep({
			key: authIdentity?.id,
		})

		const emitEventInput = transform(
			{ identifier: input.identifier, otp: generatedOtpResult.otp, eventOptions: input.eventOptions },
			(data) => ({
				eventName: Events.OTP_GENERATED,
				data: {
					identifier: data.identifier,
					otp: data.otp,
				},
				options: data.eventOptions?.priority ? { priority: data.eventOptions.priority } : undefined,
			}),
		)

		emitEventStep(emitEventInput)

		return new WorkflowResponse("OK")
	},
)

export default generateOtpWorkflow
