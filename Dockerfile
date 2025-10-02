# Use the official Node.js image as the base
FROM node:18

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with pnpm
RUN pnpm install

# Copy the rest of the backend code
COPY . .

# Expose the backend port
EXPOSE 3000

# Command to run the backend
CMD ["pnpm", "start"]