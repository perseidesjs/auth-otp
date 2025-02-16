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
    })
  })

  describe("generateOTPSecret", () => {
    it("should generate a 64-character hex string", () => {
      const secret = service.generateOTPSecret()
      expect(secret).toMatch(/^[0-9a-f]{64}$/)
    })

    it("should generate unique secrets", () => {
      const secret1 = service.generateOTPSecret()
      const secret2 = service.generateOTPSecret()
      expect(secret1).not.toBe(secret2)
    })
  })

  describe("generateTOTP", () => {
    it("should generate a 6-digit OTP by default", () => {
      const secret = service.generateOTPSecret()
      const totp = service.generateTOTP(secret, 300) // 5 minutes
      expect(totp).toMatch(/^\d{6}$/)
    })

    it("should generate different OTPs for different secrets", () => {
      const secret1 = service.generateOTPSecret()
      const secret2 = service.generateOTPSecret()
      const totp1 = service.generateTOTP(secret1, 300)
      const totp2 = service.generateTOTP(secret2, 300)
      expect(totp1).not.toBe(totp2)
    })
  })

  describe("verify", () => {
    it("should return true for valid OTP", async () => {
      const key = "test-key"
      const otp = "123456"
      jest.spyOn(mockCacheService, 'get').mockResolvedValueOnce(otp)

      const isValid = await service.verify(key, otp)
      expect(isValid).toBe(true)
      expect(mockCacheService.get).toHaveBeenCalledWith(`totp:${key}`)
      expect(mockCacheService.invalidate).toHaveBeenCalledWith(`totp:${key}`)
    })

    it("should return false for invalid OTP", async () => {
      const key = "test-key"
      jest.spyOn(mockCacheService, 'get').mockResolvedValueOnce("123456")

      const isValid = await service.verify(key, "654321")
      expect(isValid).toBe(false)
      expect(mockCacheService.invalidate).not.toHaveBeenCalled()
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

    it("should return error when identifier is missing", async () => {
      const result = await service.authenticate({
        body: {}
      }, mockAuthIdentityProviderService)

      expect(result).toEqual({
        success: false,
        error: "Identifier is required"
      })
    })

    it("should generate and cache OTP when only identifier is provided", async () => {
      jest.spyOn(mockAuthIdentityProviderService, 'retrieve').mockResolvedValueOnce(mockAuthIdentity)

      const result = await service.authenticate({
        body: { identifier: "user@example.com" }
      }, mockAuthIdentityProviderService)

      expect(result.success).toBe(true)
      expect(result.location).toBe(OTP_RETURN_KEY)
      expect(mockCacheService.set).toHaveBeenCalled()
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
        error: "Invalid OTP for user@example.com"
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
        provider_metadata: {
          otp_secret: expect.any(String)
        }
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