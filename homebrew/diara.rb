# Homebrew Formula for diara
#
# To use this formula:
# 1. Create a GitHub repo named "homebrew-diara"
# 2. Add this file as "Formula/diara.rb"
# 3. Update the url and sha256 below with your release info
# 4. Users can then install via:
#    brew tap yourusername/diara
#    brew install diara

class Diara < Formula
  desc "Banish your abandoned GitHub repositories - Extra damage to all undead repos"
  homepage "https://github.com/yourusername/diara"
  url "https://github.com/yourusername/diara/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "UPDATE_THIS_WITH_ACTUAL_SHA256"
  license "MIT"

  depends_on "node@18"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    # Basic test to ensure the command exists
    assert_match "diara", shell_output("#{bin}/diara --help 2>&1", 1)
  end
end

# =============================================================================
# SETUP INSTRUCTIONS
# =============================================================================
#
# 1. Create a GitHub Release:
#    - Tag your repo with a version (e.g., v1.0.0)
#    - Create a release from the tag
#    - GitHub will auto-generate a tarball
#
# 2. Get the SHA256:
#    curl -sL https://github.com/yourusername/diara/archive/refs/tags/v1.0.0.tar.gz | shasum -a 256
#
# 3. Create Homebrew Tap:
#    - Create a new repo: homebrew-diara
#    - Add this file as: Formula/diara.rb
#    - Update url and sha256 with your values
#
# 4. Test locally:
#    brew install --build-from-source ./diara.rb
#
# 5. Users install via:
#    brew tap yourusername/diara
#    brew install diara
