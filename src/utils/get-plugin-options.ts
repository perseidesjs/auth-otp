import { type ConfigModule } from "@medusajs/framework";
import { OtpOptions } from "../types";
import OtpUtils from "./otp";

/**
 * Get the options for the OTP plugin
 * @param configModule The config module
 * @returns The options for the OTP plugin based on the default options and the options from the plugin
 */
export default function getPluginOptions(configModule: ConfigModule) {
  const isPluginWithOptions = (plugin: any): plugin is { resolve: string, options: Record<string, unknown> } => {
    return typeof plugin === 'object' && "resolve" in plugin && "options" in plugin
  }

  const pluginOptions = configModule.plugins.filter(isPluginWithOptions).find((plugin) => plugin.resolve.includes('@perseidejs/auth-otp'))?.options as OtpOptions | undefined

  return {
    ...OtpUtils.DEFAULT_OPTIONS,
    ...pluginOptions
  }
}