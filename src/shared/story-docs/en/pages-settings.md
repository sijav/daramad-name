Personal details, backup and restore, display preferences, privacy.

Both destructive controls sit behind a typed confirmation, and both offer a
backup first. There is no server copy, so a mis-click here ends the data.

## stories

- `Default`: Profile, language, appearance, calendar, backup and restore, and the destructive reset. The language and appearance controls change the persisted setting, which is what the Storybook toolbars stand in for elsewhere.
- `Backup Survives A Wipe`: Scenario 6, driven through the real controls rather than the mutations. A JSON file is what moves a ledger between devices, so a restore that drops a field turns fourteen days of records into an empty demo. The database is wiped for real and brought back through the file input, then every field of every record is compared rather than the row count.
- `Display Preferences Persist`: Language, theme and calendar have to survive a reload. Storybook's toolbars drive the rendered locale and colour scheme, so this asserts what they cannot: the choice reaches IndexedDB and the app reads it back. Number rendering is the visible half, so the year pill is checked for Latin digits after switching to English and Persian ones after switching back.
- `Profile Round Trip`: The certificate's identity block, saved and read back. `fullNameEn`, `passportNumber` and `addressEn` exist only for the English document, so losing them on the way to disk changes nothing in the Persian interface.
- `Erase Refuses The Wrong Word`: The second step of the confirmation, from the side that matters. `BackupSurvivesAWipe` shows the erase works; this shows it does not when the word has not been typed.
- `Rejects A Bad Backup File`: A file that is not a backup. Restore replaces the database, so validation happens before anything is deleted. Per rule 9 the message names what is wrong and what to do about it: "restore failed" is not something anyone can act on.
