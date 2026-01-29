# DIARA

> *"Extra damage to all undead"* - Like the Final Fantasy spell, but for your abandoned repositories

Interactive CLI tool to bulk delete GitHub repositories. Search, filter, select multiple repos, and banish them with a single confirmation.

**Built with [Bun](https://bun.sh)** - Fast, lightweight standalone executable. No runtime dependencies.

```
        *  .  *       .   *   .    *    .
    .    *    ╭──────────────────╮   .   *
   *   .      │     D I A R A    │    .
        .     ╰──────────────────╯  *
    ˚ · .     ·  ˚   ˚  ·  . ˚   · ˚  ·

      Banish your abandoned repositories
```

## Features

- **Search by name** - Find repos with partial text matching
- **Filter by criteria** - Zero stars, forks only, age-based filters
- **Multi-select** - Use arrow keys and spacebar to select multiple repos
- **Safe deletion** - Type "DELETE" to confirm (no accidental deletions)
- **Persistent config** - Token saved securely, no re-entry needed

## Installation

### Via Homebrew (recommended)

```bash
brew tap CharlExMachina/diara
brew install diara
```

### Download Binary

Download the latest release for your platform from [GitHub Releases](https://github.com/CharlExMachina/diara/releases):

- `diara-macos-arm64` - macOS Apple Silicon
- `diara-macos-x64` - macOS Intel
- `diara-linux-x64` - Linux x64
- `diara-linux-arm64` - Linux ARM64

```bash
# Example for macOS ARM64
curl -L https://github.com/CharlExMachina/diara/releases/latest/download/diara-macos-arm64.tar.gz | tar xz
chmod +x diara-macos-arm64
mv diara-macos-arm64 /usr/local/bin/diara
```

### From source (requires Bun)

```bash
git clone https://github.com/CharlExMachina/diara.git
cd diara
bun install
bun run build
./dist/diara
```

## Setup

### 1. Create a GitHub Personal Access Token

1. Go to **[Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)**
2. **Token name:** `diara` (or anything you like)
3. **Expiration:** Choose your preference
4. **Repository access:** Select **"All repositories"**
5. **Permissions** → **Repository permissions:**
   - **Administration:** Set to **"Read and write"**
6. Click **"Generate token"** and copy it

> **Note:** The Administration permission is required to delete repositories.

### 2. Run diara

```bash
diara
```

On first run, you'll be prompted to enter your token. It will be saved securely for future use.

**Token storage locations:**
- macOS: `~/Library/Preferences/diara/`
- Linux: `~/.config/diara/`

## Usage

```bash
diara
```

### Workflow

1. **Authenticate** - Enter token on first run (saved for later)
2. **Choose method** - Search by name, filter by criteria, or show all
3. **Select repos** - Use arrow keys to navigate, spacebar to select
4. **Confirm** - Type "DELETE" to confirm deletion
5. **Repeat** - Delete more or exit

### Example Session

```
$ diara

        *  .  *       .   *   .    *    .
    .    *    ╭──────────────────╮   .   *
   *   .      │     D I A R A    │    .
        .     ╰──────────────────╯  *
    ˚ · .     ·  ˚   ˚  ·  . ˚   · ˚  ·

      Banish your abandoned repositories

✓ Authenticated as @carlos
📦 Fetching repositories... Found 47 repos

? How would you like to find repositories?
❯ Search by name
  Filter by criteria
  Show all

? Search repos (partial match): test
Found 5 repos matching "test"

? Select repositories to delete (space to select, enter to confirm):
  ◯ api-test (⭐ 0, updated 2 years ago)
❯ ◉ old-test-project (⭐ 0, updated 3 years ago)
  ◉ testing-ground (⭐ 0, updated 1 year ago)

⚠️  You are about to DELETE these repositories:
   • carlos/old-test-project
   • carlos/testing-ground

   This action is IRREVERSIBLE!

? Type "DELETE" to confirm: DELETE

🗑️  Deleting repositories...
  ✓ Deleted carlos/old-test-project
  ✓ Deleted carlos/testing-ground

✅ Successfully deleted 2 repositories
```

### Filter Options

- **Show all** - Display all your repositories
- **Only repos with 0 stars** - Empty/unused repos
- **Only forked repos** - Repos you forked from others
- **Only non-forked repos** - Your original repos
- **Not updated in 1+ year** - Stale repos
- **Not updated in 2+ years** - Very old repos

## Building

Build standalone executables for all platforms:

```bash
bun install
bun run build:all
```

This creates binaries in `dist/`:
- `diara-macos-arm64`
- `diara-macos-x64`
- `diara-linux-x64`
- `diara-linux-arm64`

## Troubleshooting

### "Authentication failed"

Your token may be invalid or expired. The tool will clear it automatically. Run `diara` again to enter a new token.

### "Failed to delete repository"

Make sure your token has the **Administration: Read and write** permission. You may need to generate a new token with the correct permissions.

### Clear saved token

Delete the config file:
- macOS: `rm -rf ~/Library/Preferences/diara/`
- Linux: `rm -rf ~/.config/diara/`

## License

MIT
