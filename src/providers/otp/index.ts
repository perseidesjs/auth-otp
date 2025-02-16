import OTPAuthProviderService from "./services/otp"
import {
  ModuleProvider,
  Modules
} from "@medusajs/framework/utils"

const services = [OTPAuthProviderService]

export default ModuleProvider(Modules.AUTH, {
  services
})