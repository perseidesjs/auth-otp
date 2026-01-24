import {
	createWorkflow,
	WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { Events, type OtpOptions } from "../types"
import { generateOtpStep } from "./steps/generate-otp-step"
import { getActorStep } from "./steps/get-actor-step"
import { preRegisterCheckActorExistenceStep } from "./steps/pre-register-check-actor-existence"

/**
 * The pre-register workflow is used to check if an actor exists with the given identifier.
 * If it does, it throws an error as the actor is already registered
 *
 * If it doesn't, it generates an OTP for the identifier allowing them to validate the OTP
 * when they register using the `/auth/{actor_type}/otp/register` route, that needs the :
 * - identifier
 * - otp
 *
 * To generate the registration token, allowing you to create actors (customers, users, etc.)
 *
 * @param input - The input for the workflow.
 * @param input.identifier - The identifier of the actor to check the existence for.
 * @param input.actorType - The type of actor to check the existence for.
 * @param input.accessorsPerActor - The accessors per actor to use for the workflow.
 *
 */
const preRegisterCheckWorkflow = createWorkflow(
	"pre-register-check",
	(input: {
		identifier: string
		actorType: string
		accessorsPerActor: Required<OtpOptions>["accessorsPerActor"][string]
	}) => {
		const { actor } = getActorStep({
			identifier: input.identifier,
			actorType: input.actorType,
			accessorsPerActor: input.accessorsPerActor,
		})

		preRegisterCheckActorExistenceStep({
			foundActor: actor,
		})

		const generatedOtpResult = generateOtpStep({
			key: input.identifier,
			tag: "pre-register",
		})

		emitEventStep({
			eventName: Events.PRE_REGISTER_OTP_GENERATED,
			data: {
				identifier: input.identifier,
				otp: generatedOtpResult.otp,
			},
		})

		return new WorkflowResponse("OK")
	},
)

export default preRegisterCheckWorkflow
