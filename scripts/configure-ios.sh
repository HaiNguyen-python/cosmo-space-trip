#!/bin/sh
# Applies the game's iOS settings to the Xcode project that `npx cap add ios` generates.
# Runs on macOS (Codemagic does this automatically; see codemagic.yaml).
set -e

PLIST="ios/App/App/Info.plist"
LANDSCAPE='["UIInterfaceOrientationLandscapeLeft","UIInterfaceOrientationLandscapeRight"]'

# Name under the icon on the Home Screen (short so it is not cut off).
plutil -replace CFBundleDisplayName -string "Space Trip" "$PLIST"

# Landscape only, full screen (required on iPad when not every orientation is supported).
plutil -replace UISupportedInterfaceOrientations -json "$LANDSCAPE" "$PLIST"
plutil -replace "UISupportedInterfaceOrientations~ipad" -json "$LANDSCAPE" "$PLIST"
plutil -replace UIRequiresFullScreen -bool YES "$PLIST"

# No status bar over the game.
plutil -replace UIStatusBarHidden -bool YES "$PLIST"
plutil -replace UIViewControllerBasedStatusBarAppearance -bool NO "$PLIST"

# The app uses no encryption beyond Apple's own (answers the export compliance question).
plutil -replace ITSAppUsesNonExemptEncryption -bool NO "$PLIST"

echo "iOS project configured: landscape, full screen, no status bar."
