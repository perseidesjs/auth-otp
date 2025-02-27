import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { OtpOptions } from "../../types"

export const getActorStep = createStep(
  "get-actor",
  async (input: {
    identifier: string
    actorType: string
    accessorsPerActor: Required<OtpOptions>['accessorsPerActor'][string]
  }, { container }) => {
    const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

    const filters: Record<string, unknown> = {}
    if (Array.isArray(input.accessorsPerActor.accessor)) {
      filters['$or'] = input.accessorsPerActor.accessor.map(accessor => ({
        [accessor]: input.identifier
      }))
    } else {
      filters[input.accessorsPerActor.accessor] = input.identifier
    }

    const actor = await remoteQuery.graph({
      entity: input.actorType,
      fields: ['*'],
      filters
    })

    if (!actor.data.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `No actor found`)
    }

    return new StepResponse({ actor })
  }
)