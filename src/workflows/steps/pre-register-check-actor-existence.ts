import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * Checks if an actor exists
 * If it does, it throws an error as the actor is already registered.
 *
 * @param input - The input for the step.
 * @param input.foundActor - The found actor to check the existence for.
 */
export const preRegisterCheckActorExistenceStep = createStep(
	"pre-register-check-actor-existence",
	async (input: { foundActor?: Record<string, unknown> }) => {
		if (input.foundActor) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, "Actor already exists")
		}

		return new StepResponse(input)
	},
)
