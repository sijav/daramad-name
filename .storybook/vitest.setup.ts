import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview'
import { setProjectAnnotations } from '@storybook/react-vite'
import { beforeAll } from 'vitest'
import preview from './preview'

// Applies the same decorators, globals and parameters the browser Storybook
// uses, so a story under test renders inside the real providers — i18n, the
// theme, the router and a seeded query client — rather than bare.
//
// KEEP THIS FILE even though addon-vitest prints "you can safely remove the
// setProjectAnnotations call". Following that advice hands setup back to the
// addon's own `setup-file-with-project-annotations.js`, which fails to import:
//
//   SyntaxError: The requested module 'aria-query/lib/index.js' does not
//   provide an export named 'elementRoles'
//
// — a CJS/ESM interop break in a transitive dependency of addon-a11y. All 41
// story files fail to load. Declaring the annotations here means the addon
// skips that file entirely, which is what makes the suite run.
const annotations = setProjectAnnotations([a11yAddonAnnotations, preview])

beforeAll(annotations.beforeAll)
