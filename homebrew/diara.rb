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
      sha256 "84f049824e45b850d6947a61e573c079814afa2b0aa76bfdb070156447ae17e0"

      def install
        bin.install "diara-macos-arm64" => "diara"
      end
    end
    on_intel do
      url "https://github.com/CharlExMachina/diara/releases/download/v1.0.0/diara-macos-x64.tar.gz"
      sha256 "c60d74db08ed4d4a26063be5d8d0522f6778f4d24a41ba62f66fce249d01f0da"

      def install
        bin.install "diara-macos-x64" => "diara"
      end
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/CharlExMachina/diara/releases/download/v1.0.0/diara-linux-arm64.tar.gz"
      sha256 "515abe755c4f078b41a626ebe74cc55645e7053bd3813195eccdc1ab49c0f7e8"

      def install
        bin.install "diara-linux-arm64" => "diara"
      end
    end
    on_intel do
      url "https://github.com/CharlExMachina/diara/releases/download/v1.0.0/diara-linux-x64.tar.gz"
      sha256 "088ab240474e3eec3e269617d97be10d64bb06cf222ac873832e7276c8728e9f"

      def install
        bin.install "diara-linux-x64" => "diara"
      end
    end
  end

  test do
    assert_match "DIARA", shell_output("#{bin}/diara 2>&1", 1)
  end
end
