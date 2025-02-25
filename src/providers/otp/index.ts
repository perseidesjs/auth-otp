import OtpAuthProviderService from "./services/otp"
import {
  ModuleProvider,
  Modules
} from "@medusajs/framework/utils"

const services = [OtpAuthProviderService]

export default ModuleProvider(Modules.AUTH, {
  services,
  loaders:[]
})