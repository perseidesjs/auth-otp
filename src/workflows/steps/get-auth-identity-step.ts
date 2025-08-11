import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { OtpOptions } from "../../types"
import { isDefined } from "../../utils/is-defined"

/**
 * Gets an auth identity for a given identifier and actor type.
 *
 * @param input - The input for the step.
 * @param input.identifier - The identifier of the actor to get the auth identity for.
 * @param input.actorType - The type of actor to get the auth identity for.
 * @param input.foundActor - The found actor to get the auth identity for.
 * @param input.accessorsPerActor - The accessors per actor to use for the step.
 */
export const getAuthIdentityStep = createStep(
  "get-auth-identity",
  async (input: {
    identifier: string,
    actorType?: string,
    foundActor?: Record<string, unknown>
    accessorsPerActor?: Required<OtpOptions>['accessorsPerActor'][string]
  }, { container }) => {
    const authModule = container.resolve(Modules.AUTH)

    const entityId = input.foundActor?.[input.accessorsPerActor?.entityIdAccessor!] as string

    const authIdentities = await authModule.listAuthIdentities({
      provider_identities: {
        entity_id: entityId
      }
    }, {
      relations: ['provider_identities']
    })


    if (authIdentities.length === 0) {
      throw new Error("Auth identity not found")
    }

    const authIdentity = authIdentities.find(identity =>
      isDefined(identity.app_metadata) &&
      isDefined(identity.app_metadata[`${input.actorType}_id`])
    )

    if (!authIdentity) {
      throw new Error("Auth identity not found")
    }

    return new StepResponse({
      authIdentity
    })
  }
)
