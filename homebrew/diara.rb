# Homebrew Formula for diara
#
# This formula downloads pre-built standalone binaries from GitHub releases.
# No runtime dependencies required - the Bun runtime is bundled in the executable.

class Diara < Formula
  desc "Banish your abandoned GitHub repositories - Extra damage to all undead repos"
  homepage "https://github.com/CharlExMachina/diara"
  version "1.0.0"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/CharlExMachina/diara/releases/download/v1.0.0/diara-macos-arm64.tar.gz"
      sha256 "UPDATE_WITH_ACTUAL_SHA256_FOR_MACOS_ARM64"
    end
    on_intel do
      url "https://github.com/CharlExMachina/diara/releases/download/v1.0.0/diara-macos-x64.tar.gz"
      sha256 "UPDATE_WITH_ACTUAL_SHA256_FOR_MACOS_X64"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/CharlExMachina/diara/releases/download/v1.0.0/diara-linux-arm64.tar.gz"
      sha256 "UPDATE_WITH_ACTUAL_SHA256_FOR_LINUX_ARM64"
    end
    on_intel do
      url "https://github.com/CharlExMachina/diara/releases/download/v1.0.0/diara-linux-x64.tar.gz"
      sha256 "UPDATE_WITH_ACTUAL_SHA256_FOR_LINUX_X64"
    end
  end

  def install
    bin.install "diara"
  end

  test do
    assert_match "DIARA", shell_output("#{bin}/diara 2>&1", 1)
  end
end

# =============================================================================
# RELEASE WORKFLOW
# =============================================================================
#
# 1. Build all platform binaries:
#    bun run build:all
#
# 2. Create tarballs for each platform:
#    cd dist
#    tar -czvf diara-macos-arm64.tar.gz diara-macos-arm64
#    tar -czvf diara-macos-x64.tar.gz diara-macos-x64
#    tar -czvf diara-linux-x64.tar.gz diara-linux-x64
#    tar -czvf diara-linux-arm64.tar.gz diara-linux-arm64
#
# 3. Create GitHub release and upload tarballs
#
# 4. Get SHA256 for each tarball:
#    shasum -a 256 diara-*.tar.gz
#
# 5. Update this formula with the SHA256 values
#
# 6. Create Homebrew tap repo: homebrew-diara
#    - Add this file as: Formula/diara.rb
#
# 7. Users install via:
#    brew tap CharlExMachina/diara
#    brew install diara
