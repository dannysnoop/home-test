# Use the official Node.js image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock (or package-lock.json) to the working directory
COPY package*.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code to the working directory
COPY . .

# Build the TypeScript code
RUN yarn build

# Expose the application port
EXPOSE 3000

# Define the command to run the application
CMD ["node", "dist/server.js"]