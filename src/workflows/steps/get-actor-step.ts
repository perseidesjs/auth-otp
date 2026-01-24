import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type { OtpOptions } from "../../types"

/**
 * Gets an actor for a given identifier and actor type.
 *
 * @param input - The input for the step.
 * @param input.identifier - The identifier of the actor to get.
 * @param input.actorType - The type of actor to get.
 * @param input.accessorsPerActor - The accessors per actor to use for the step.
 */
export const getActorStep = createStep(
	"get-actor",
	async (
		input: {
			identifier: string
			actorType: string
			accessorsPerActor: Required<OtpOptions>["accessorsPerActor"][string]
		},
		{ container },
	) => {
		const remoteQuery = container.resolve(
			ContainerRegistrationKeys.REMOTE_QUERY,
		)

		const filters: Record<string, unknown> = {}
		if (Array.isArray(input.accessorsPerActor.accessor)) {
			filters.$or = input.accessorsPerActor.accessor.map((accessor) => ({
				[accessor]: input.identifier,
			}))
		} else {
			filters[input.accessorsPerActor.accessor] = input.identifier
		}

		const actor = await remoteQuery.graph({
			entity: input.actorType,
			fields: ["*"],
			filters,
		})

		const foundActor = actor.data.length ? actor.data[0] : null

		if (!foundActor) {
			return new StepResponse({
				error: true,
				actor: null,
			})
		}

		return new StepResponse({ actor: foundActor, error: false })
	},
)
