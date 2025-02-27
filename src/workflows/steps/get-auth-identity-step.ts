import { AuthIdentityDTO } from "@medusajs/framework/types"
import { isDefined, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const getAuthIdentityStep = createStep(
  "get-auth-identity",
  async (input: {
    identifier: string,
    provider?: string,
    actorType?: string
  }, { container }) => {
    const authModule = container.resolve(Modules.AUTH)

    const authIdentities = await authModule.listAuthIdentities({
      provider_identities: {
        ...(input.provider ? { provider: input.provider } : {}),
        entity_id: input.identifier
      }
    }, {
      relations: ['provider_identities']
    })

    let authIdentity: AuthIdentityDTO | undefined

    if (isDefined(input.actorType)) {
      authIdentity = authIdentities.find(identity => isDefined(identity.app_metadata) && isDefined(identity.app_metadata[`${input.actorType}`]))
    } else {
      authIdentity = authIdentities.at(0)
    }

    if (!authIdentity) {
      throw new Error("Auth identity not found")
    }

    return new StepResponse({
      authIdentity,
      identifier: input.identifier
    })
  }
)
