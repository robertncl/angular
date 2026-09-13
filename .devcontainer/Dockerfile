# dev-22-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:7a81958053c4e3b5b20fa122f7a422d32dd0eebe87a6726f7b14483585ea60fd

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
