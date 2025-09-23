# Use the official Node.js image as the base image for building the application.
FROM node:21-alpine3.18 AS builder

# Enable Corepack and prepare for PNPM installation
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml files to the working directory
COPY package*.json pnpm-lock.yaml ./

# Install git for potential dependencies
RUN apk add --no-cache git

# Install PM2 globally using PNPM
RUN pnpm install pm2 -g

# Copy the application source code into the container
COPY . .

# Install dependencies using PNPM
RUN pnpm install

# Build the TypeScript application
RUN pnpm run build

# Create a new stage for deployment
FROM builder AS deploy

# Copy the built application and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Install production dependencies using frozen lock file
RUN pnpm install --frozen-lockfile --production

# Define the command to start the application using PM2 runtime
CMD ["pm2-runtime", "start", "./dist/app.js", "--name", "ticket-wa", "--max-memory-restart", "500M", "--cron", "0 */12 * * *"]