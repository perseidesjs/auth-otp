import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import OtpAuthProviderService from "./services/otp"

const services = [OtpAuthProviderService]

export default ModuleProvider(Modules.AUTH, {
	services,
})
