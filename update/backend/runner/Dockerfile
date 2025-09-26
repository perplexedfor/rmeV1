# Use the official Node.js 20 as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /code

# Copy package.json and package-lock.json first
COPY package*.json ./

# RUN NPM INSTALL *INSIDE* THE CONTAINER
# This ensures node-pty is compiled against node:20
RUN npm install

# Now, copy the rest of your application's source code
COPY . .

# Build your app (if necessary)
RUN npm run build

# Expose the port
EXPOSE 3000

# Define the command to run your app
CMD [ "node", "dist/index.js" ]
