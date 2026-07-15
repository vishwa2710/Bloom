# Bloom — Metro / Expo dev-server container.
#
# This image runs the JavaScript dev server (Metro). Your device or emulator
# runs the native dev-client build and connects to this server over the LAN.
#
# What this container CAN do: serve the JS bundle, typecheck, lint, run tests,
# and (with the Android SDK mounted) drive Android builds.
# What it CANNOT do: build the iOS app — that requires macOS + Xcode, which
# cannot run in a Linux container. Use a Mac or EAS Build for iOS. See README.
FROM node:22-bookworm-slim

WORKDIR /app

ENV EXPO_NO_TELEMETRY=1 \
    # Metro must bind to all interfaces so a device on the LAN can reach it.
    REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Install dependencies first for better layer caching.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

# 8081 = Metro bundler.
EXPOSE 8081

CMD ["npx", "expo", "start", "--dev-client", "--host", "lan"]
