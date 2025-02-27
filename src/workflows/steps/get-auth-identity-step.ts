import { ContainerRegistrationKeys, isDefined, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { OtpOptions } from "../../types"

export const getAuthIdentityStep = createStep(
  "get-auth-identity",
  async (input: {
    identifier: string,
    provider?: string,
    actorType?: string,
    foundActor?: Record<string, unknown>
    actorOptions?: Required<OtpOptions>['actorsOptions'][string]
  }, { container }) => {
    const authModule = container.resolve(Modules.AUTH)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info(`Getting auth identity for identifier: ${input.identifier}`)
    logger.info(`Provider: ${input.provider}`)
    logger.info(`Actor type: ${input.actorType}`)
    logger.info(`Found actor: ${JSON.stringify(input.foundActor)}`)
    logger.info(`Actor options: ${JSON.stringify(input.actorOptions)}`)

    const entityId = input.foundActor?.[input.actorOptions?.entityIdAccessor!] as string
    logger.info(`Entity ID: ${entityId}`)

    const authIdentities = await authModule.listAuthIdentities({
      provider_identities: {
        ...(input.provider ? { provider: input.provider } : {}),
        entity_id: entityId
      }
    }, {
      relations: ['provider_identities']
    })


    if (authIdentities.length === 0) {
      throw new Error("Auth identity not found")
    }

    // If no provider is specified (secondary mode), filter out OTP provider entities
    if (!input.provider) {
      authIdentities.forEach(identity => {
        if (identity.provider_identities && Array.isArray(identity.provider_identities)) {
          identity.provider_identities = identity.provider_identities.filter(
            providerIdentity => providerIdentity.provider !== 'otp'
          )
        }
      })
      logger.info(`Auth identities after filtering OTP providers: ${JSON.stringify(authIdentities)}`)
    }

    logger.info(`Auth identities: ${JSON.stringify(authIdentities)}`)


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
