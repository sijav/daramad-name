import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@chromatic-com/storybook', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },
  // The theme paints its own surface and the Theme toolbar already switches
  // light and dark, so the backgrounds addon would only offer a third, wrong
  // answer. Turned off here rather than through `parameters.backgrounds`:
  // that parameter is the deprecated config API the CLI warns about, and the
  // automigration's own fix renames `disable` to `disabled` — a key the 10.5
  // runtime never reads, so it silences the warning and re-enables the addon.
  features: { backgrounds: false },
}

export default config
