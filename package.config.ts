import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  extract: {rules: {'ae-incompatible-release-tags': 'off', 'ae-missing-release-tag': 'off'}},
  tsconfig: 'tsconfig.build.json',
})
