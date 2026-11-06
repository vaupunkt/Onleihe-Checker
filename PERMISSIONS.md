# Permissions (version 1.3, sunset release)

| Permission | Purpose |
|---|---|
| `storage` | On update, the old settings (selected library, language) are deleted from `storage.local` and `storage.sync`. No new data is stored. |

Removed compared to version 1.2:

- Chrome: `activeTab`, `tabs`, `scripting` and all `host_permissions` (Amazon.de, Goodreads and all Onleihe domains)
- Firefox: `activeTab`, `tabs`, `webNavigation` and all host permissions (Amazon.de, Goodreads and all Onleihe domains)
- Content scripts on Amazon.de and Goodreads, and `web_accessible_resources`

Opening the notice page via `tabs.create` and calling `management.uninstallSelf()` require no additional permission.
