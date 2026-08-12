# dev-22-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node@sha256:1f13af93fc9b845a4ee55c84d6e6c6ad2c6419b0fdeef4a6c13ad5a3f561d034

RUN npm install -g @angular/cli

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

USER node
WORKDIR /workspace
