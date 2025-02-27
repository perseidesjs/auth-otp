import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
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

    const actor = await remoteQuery.graph({
      entity: input.actorType,
      fields: ['*'],
      filters: {
        [input.accessorsPerActor.accessor]: input.identifier
      }
    })

    return new StepResponse({ actor })
  }
)