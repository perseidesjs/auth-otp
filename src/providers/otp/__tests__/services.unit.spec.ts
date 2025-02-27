import { ICacheService, Logger, AuthIdentityProviderService, AuthIdentityDTO, ProviderIdentityDTO } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import OTPAuthProviderService, { OTP_RETURN_KEY } from "../services/otp"

describe("OTPAuthProviderService", () => {
  let service: OTPAuthProviderService
  let mockCacheService: ICacheService
  let mockLogger: Logger
  let mockAuthIdentityProviderService: jest.Mocked<AuthIdentityProviderService>

  beforeEach(() => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
    }

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      progress: jest.fn(),
      panic: jest.fn(),
      shouldLog: jest.fn(),
      setLogLevel: jest.fn(),
      unsetLogLevel: jest.fn(),
      activity: jest.fn(),
      failure: jest.fn(),
      success: jest.fn(),
      log: jest.fn(),
    }

    mockAuthIdentityProviderService = {
      retrieve: jest.fn(),
      create: jest.fn(),
    } as any

    service = new OTPAuthProviderService({
      [Modules.CACHE]: mockCacheService,
      [ContainerRegistrationKeys.LOGGER]: mockLogger,
    }, {
      digits: 6,
      ttl: 60 * 5,
      mode: 'main'
    })
  })

  describe("authenticate", () => {
    const mockProviderIdentity: ProviderIdentityDTO = {
      id: "provider_id",
      entity_id: "user@example.com",
      provider: "otp",
      provider_metadata: {
        otp_secret: "test-secret"
      }
    }

    const mockAuthIdentity: AuthIdentityDTO = {
      id: "auth_id",
      provider_identities: [mockProviderIdentity]
    }

    it("should return error when identifier OR OTP is missing", async () => {
      const result = await service.authenticate({
        body: {}
      }, mockAuthIdentityProviderService)

      expect(result).toEqual({
        success: false,
        error: "Identifier and OTP are required"
      })
    })

    it("should verify OTP when both identifier and OTP are provided", async () => {
      jest.spyOn(mockAuthIdentityProviderService, 'retrieve').mockResolvedValueOnce(mockAuthIdentity)
      jest.spyOn(mockCacheService, 'get').mockResolvedValueOnce("123456")

      const result = await service.authenticate({
        body: {
          identifier: "user@example.com",
          otp: "123456"
        }
      }, mockAuthIdentityProviderService)

      expect(result).toEqual({
        success: true,
        authIdentity: mockAuthIdentity
      })
    })

    it("should return error for invalid OTP", async () => {
      jest.spyOn(mockAuthIdentityProviderService, 'retrieve').mockResolvedValueOnce(mockAuthIdentity)
      jest.spyOn(mockCacheService, 'get').mockResolvedValueOnce("123456")

      const result = await service.authenticate({
        body: {
          identifier: "user@example.com",
          otp: "654321"
        }
      }, mockAuthIdentityProviderService)

      expect(result).toEqual({
        success: false,
        error: "Invalid OTP"
      })
    })
  })

  describe("register", () => {
    it("should return error when identifier is missing", async () => {
      const result = await service.register({
        body: {}
      }, mockAuthIdentityProviderService)

      expect(result).toEqual({
        success: false,
        error: "Identifier is required"
      })
    })

    it("should create new identity when user doesn't exist", async () => {
      const notFoundError = new MedusaError(MedusaError.Types.NOT_FOUND, "Not found")
      jest.spyOn(mockAuthIdentityProviderService, 'retrieve').mockRejectedValueOnce(notFoundError)

      const mockCreatedIdentity: AuthIdentityDTO = {
        id: "new_auth_id",
        provider_identities: []
      }
      jest.spyOn(mockAuthIdentityProviderService, 'create').mockResolvedValueOnce(mockCreatedIdentity)

      const result = await service.register({
        body: { identifier: "new_user@example.com" }
      }, mockAuthIdentityProviderService)

      expect(result).toEqual({
        success: true,
        authIdentity: mockCreatedIdentity
      })
      expect(mockAuthIdentityProviderService.create).toHaveBeenCalledWith({
        entity_id: "new_user@example.com",
      })
    })

    it("should return existing identity when user exists", async () => {
      const existingIdentity: AuthIdentityDTO = {
        id: "existing_auth_id",
        provider_identities: []
      }
      jest.spyOn(mockAuthIdentityProviderService, 'retrieve').mockResolvedValueOnce(existingIdentity)

      const result = await service.register({
        body: { identifier: "existing_user@example.com" }
      }, mockAuthIdentityProviderService)

      expect(result).toEqual({
        success: true,
        authIdentity: existingIdentity
      })
      expect(mockAuthIdentityProviderService.create).not.toHaveBeenCalled()
    })
  })
})