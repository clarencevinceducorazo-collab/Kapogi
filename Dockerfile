# syntax=docker/dockerfile:1

ARG NODE_VERSION=23.11.1

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app


################################################################################
# Create a stage for installing production dependecies.
FROM base as deps

# Copy dependency manifests first to leverage Docker layer caching.
COPY package.json package-lock.json ./

# Install only production dependencies for the deps stage.
RUN npm ci --omit=dev

################################################################################
# Create a stage for building the application.
FROM deps as build

# Install full (prod + dev) dependencies needed for building.
RUN npm ci

# Copy the rest of the source files into the image.
COPY . .

# The .env files are already included in COPY . . above!
# No need for separate COPY commands

# Run the build script.
RUN npm run build

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM base as final

# Use production node environment by default.
ENV NODE_ENV production

# Run the application as a non-root user.
USER node

# Copy package.json so that package manager commands can be used.
COPY package.json .

# Copy the production dependencies from the deps stage and also
# the built application assets from the build stage into the image.
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy only the built Next.js output and necessary source/public files
# (this avoids copying dev dependencies from the build stage).
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/src ./src

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD npm start