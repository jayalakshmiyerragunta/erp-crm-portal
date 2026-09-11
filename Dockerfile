FROM node:20-alpine

WORKDIR /app

# Copy backend manifest files into the app dir
COPY backend/package*.json ./
RUN npm ci

# Copy backend source (excludes backend/node_modules + backend/.env via Railway's default)
COPY backend/ ./

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]