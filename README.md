# DIARA

> *"Extra damage to all undead"* - Like the Final Fantasy spell, but for your abandoned repositories

Interactive CLI tool to bulk delete GitHub repositories. Search, filter, select multiple repos, and banish them with a single confirmation.

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

### Via pnpm (recommended)

```bash
pnpm add -g diara
```

### Via npx (no install)

```bash
npx diara
```

### From source

```bash
git clone https://github.com/yourusername/diara.git
cd diara
pnpm install
pnpm link --global
```

## Setup

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click **"Generate new token"** (classic)
3. Give it a name (e.g., "diara")
4. Select the **`delete_repo`** scope
5. Click **"Generate token"**
6. Copy the token (you won't see it again!)

### 2. Run diara

```bash
diara
```

On first run, you'll be prompted to enter your token. It will be saved securely for future use.

**Token storage locations:**
- macOS: `~/Library/Preferences/diara-nodejs/`
- Linux: `~/.config/diara-nodejs/`

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

## Homebrew Installation (Alternative)

If you prefer Homebrew, you can create your own tap:

1. Create a repo named `homebrew-diara`
2. Add the formula from `homebrew/diara.rb`
3. Install:
   ```bash
   brew tap yourusername/diara
   brew install diara
   ```

## Troubleshooting

### "Authentication failed"

Your token may be invalid or expired. The tool will clear it automatically. Run `diara` again to enter a new token.

### "Failed to delete repository"

Make sure your token has the `delete_repo` scope. You may need to generate a new token with the correct permissions.

### Clear saved token

Delete the config file:
- macOS: `rm -rf ~/Library/Preferences/diara-nodejs/`
- Linux: `rm -rf ~/.config/diara-nodejs/`

## Requirements

- Node.js 18.0.0 or higher

## License

MIT
