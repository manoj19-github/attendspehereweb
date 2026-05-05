# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM nginx:stable-alpine

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA (React Router support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]