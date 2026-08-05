# dev-22-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:8e293115f2d7fbe69d8934ea59f95d5eeeaeb9a3ca09d0bd9b08a15a8c8bec13

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
