# syntax=docker/dockerfile:1

ARG NODE_VERSION=23.11.1

################################################################################
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app

################################################################################
FROM base as deps
COPY package.json package-lock.json* ./
RUN npm install

################################################################################
FROM base as build
RUN npm install
COPY . .

# ADD THESE LINES HERE ↓
ENV NEXTAUTH_URL=https://kapogian.xyz
ENV AUTH_TRUST_HOST=true
ENV NEXTAUTH_SECRET=K8pX2mNqR5vY9wL3jH7tF4cA6dB0eG1iJ
ENV NEXT_PUBLIC_X_CLIENT_ID=d2pLcXA4bC1MTzJybWJZMEFMcU06MTpjaQ

RUN npm run build

################################################################################
FROM base as final

ENV NODE_ENV=production
# ADD THESE LINES HERE TOO ↓
ENV NEXTAUTH_URL=https://kapogian.xyz
ENV AUTH_TRUST_HOST=true
ENV NEXTAUTH_SECRET=K8pX2mNqR5vY9wL3jH7tF4cA6dB0eG1iJ
ENV NEXT_PUBLIC_X_CLIENT_ID=d2pLcXA4bC1MTzJybWJZMEFMcU06MTpjaQ

USER node
COPY package.json .
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/src ./src

EXPOSE 3000
CMD ["npm", "start"]