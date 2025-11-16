# === STAGE 1: Build the React Application ===
# Use an official Node.js runtime as the builder environment
FROM node:18-alpine as builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Create the production build
# This creates a 'build' folder with static assets.
RUN npm run build


# === STAGE 2: Serve the application with Nginx ===
# Use a lightweight Nginx image for the production environment
FROM nginx:stable-alpine

# Copy the static files from the 'builder' stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world
EXPOSE 80

# The default command for the nginx image is to start the server.
CMD ["nginx", "-g", "daemon off;"]