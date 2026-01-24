import type {
	IAuthModuleService,
	ICacheService,
	ICustomerModuleService,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
	testSuite: ({ api, getContainer }) => {
		let customerModuleService: ICustomerModuleService
		let cacheService: ICacheService
		let authModuleService: IAuthModuleService

		beforeAll(() => {
			customerModuleService = getContainer().resolve(Modules.CUSTOMER)
			cacheService = getContainer().resolve(Modules.CACHE)
			authModuleService = getContainer().resolve(Modules.AUTH)
		})

		// Helper to create a customer with linked auth identity
		const createCustomerWithAuth = async (
			email: string,
			firstName: string,
			lastName: string,
		) => {
			const customer = await customerModuleService.createCustomers({
				email,
				first_name: firstName,
				last_name: lastName,
			})

			const authIdentity = await authModuleService.createAuthIdentities({
				provider_identities: [
					{
						provider: "emailpass",
						entity_id: email,
					},
				],
				app_metadata: {
					customer_id: customer.id,
				},
			})

			return { customer, authIdentity }
		}

		describe("OTP Auth Routes", () => {
			describe("POST /auth/:actor_type/otp/generate", () => {
				it("returns success message for existing customer", async () => {
					const { customer, authIdentity } = await createCustomerWithAuth(
						"generate-test@example.com",
						"Test",
						"Customer",
					)

					const response = await api.post("/auth/customer/otp/generate", {
						identifier: customer.email,
					})

					expect(response.status).toEqual(200)
					expect(response.data).toHaveProperty("message")

					// Verify OTP was stored in cache
					const cachedOtp = await cacheService.get(`otp:${authIdentity.id}`)
					expect(cachedOtp).toBeDefined()
					expect(cachedOtp).toHaveLength(6)

					// Cleanup
					await customerModuleService.deleteCustomers(customer.id)
					await authModuleService.deleteAuthIdentities([authIdentity.id])
				})

				it("returns success even for non-existent customer (prevents enumeration)", async () => {
					const response = await api.post("/auth/customer/otp/generate", {
						identifier: "nonexistent@example.com",
					})

					// Default behavior: alwaysReturnSuccess=true prevents user enumeration
					expect(response.status).toEqual(200)
					expect(response.data).toHaveProperty("message")
				})

				it("fails with missing identifier", async () => {
					const response = await api
						.post("/auth/customer/otp/generate", {})
						.catch((e) => e.response)

					expect(response.status).toEqual(400)
				})
			})

			describe("POST /auth/:actor_type/otp/verify", () => {
				it("returns token for valid OTP", async () => {
					const { customer, authIdentity } = await createCustomerWithAuth(
						"verify-test@example.com",
						"Verify",
						"Test",
					)

					// Manually set OTP in cache (simulating generate step)
					const testOtp = "123456"
					await cacheService.set(`otp:${authIdentity.id}`, testOtp, 300)

					const response = await api.post("/auth/customer/otp/verify", {
						identifier: customer.email,
						otp: testOtp,
					})

					expect(response.status).toEqual(200)
					expect(response.data).toHaveProperty("token")
					expect(typeof response.data.token).toBe("string")

					// Cleanup
					await customerModuleService.deleteCustomers(customer.id)
					await authModuleService.deleteAuthIdentities([authIdentity.id])
				})

				it("fails with invalid OTP", async () => {
					const { customer, authIdentity } = await createCustomerWithAuth(
						"invalid-otp-test@example.com",
						"Invalid",
						"OTP",
					)

					await cacheService.set(`otp:${authIdentity.id}`, "123456", 300)

					const response = await api
						.post("/auth/customer/otp/verify", {
							identifier: customer.email,
							otp: "000000", // Wrong OTP
						})
						.catch((e) => e.response)

					expect(response.status).toEqual(400)
					expect(response.data.message).toContain("Invalid OTP")

					// Cleanup
					await customerModuleService.deleteCustomers(customer.id)
					await authModuleService.deleteAuthIdentities([authIdentity.id])
				})

				it("fails with missing OTP", async () => {
					const response = await api
						.post("/auth/customer/otp/verify", {
							identifier: "test@example.com",
						})
						.catch((e) => e.response)

					expect(response.status).toEqual(400)
				})

				it("fails with missing identifier", async () => {
					const response = await api
						.post("/auth/customer/otp/verify", {
							otp: "123456",
						})
						.catch((e) => e.response)

					expect(response.status).toEqual(400)
				})
			})

			describe("POST /auth/:actor_type/otp/pre-register", () => {
				it("generates OTP for new identifier (no existing customer)", async () => {
					const newEmail = "new-user@example.com"

					const response = await api.post("/auth/customer/otp/pre-register", {
						identifier: newEmail,
					})

					expect(response.status).toEqual(200)
					expect(response.data).toHaveProperty("message")

					// Verify OTP was stored with pre-register tag
					const cachedOtp = await cacheService.get(
						`otp:pre-register:${newEmail}`,
					)
					expect(cachedOtp).toBeDefined()
					expect(cachedOtp).toHaveLength(6)
				})

				it("returns success when customer already exists (prevents enumeration)", async () => {
					const { customer, authIdentity } = await createCustomerWithAuth(
						"existing-preregister@example.com",
						"Existing",
						"Customer",
					)

					const response = await api.post("/auth/customer/otp/pre-register", {
						identifier: customer.email,
					})

					// Default behavior: alwaysReturnSuccess=true prevents user enumeration
					expect(response.status).toEqual(200)
					expect(response.data).toHaveProperty("message")

					// Cleanup
					await customerModuleService.deleteCustomers(customer.id)
					await authModuleService.deleteAuthIdentities([authIdentity.id])
				})

				it("fails with missing identifier", async () => {
					const response = await api
						.post("/auth/customer/otp/pre-register", {})
						.catch((e) => e.response)

					expect(response.status).toEqual(400)
				})
			})

			describe("Full OTP flow", () => {
				it("completes generate -> verify flow for existing customer", async () => {
					const { customer, authIdentity } = await createCustomerWithAuth(
						"full-flow@example.com",
						"Full",
						"Flow",
					)

					// Step 1: Generate OTP
					const generateResponse = await api.post(
						"/auth/customer/otp/generate",
						{
							identifier: customer.email,
						},
					)
					expect(generateResponse.status).toEqual(200)

					// Get the OTP from cache
					const otp = await cacheService.get(`otp:${authIdentity.id}`)
					expect(otp).toBeDefined()

					// Step 2: Verify OTP
					const verifyResponse = await api.post("/auth/customer/otp/verify", {
						identifier: customer.email,
						otp: otp as string,
					})

					expect(verifyResponse.status).toEqual(200)
					expect(verifyResponse.data).toHaveProperty("token")

					// Cleanup
					await customerModuleService.deleteCustomers(customer.id)
					await authModuleService.deleteAuthIdentities([authIdentity.id])
				})
			})
		})
	},
})
