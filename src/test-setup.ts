import 'fake-indexeddb/auto'
import { db } from 'src/core/db'
import { beforeEach } from 'vitest'

// The data layer is the half of this app that can be wrong without anyone
// noticing, so it is tested against a real IndexedDB implementation rather than
// a mocked Dexie. `fake-indexeddb/auto` installs one over the global before any
// module imports Dexie, which is why this runs as a setup file and not as an
// import inside a test.
//
// Every test starts from an empty database. Dexie caches the connection, so
// clearing the tables is both cheaper and safer than deleting and reopening it
// between cases.
beforeEach(async () => {
  await Promise.all([db.receipts.clear(), db.clients.clear(), db.settings.clear()])
})
