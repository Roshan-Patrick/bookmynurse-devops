FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npm install -g @angular/cli@17
COPY . .
RUN npm run build --prod

FROM nginx:alpine
COPY --from=builder /app/dist/bmn /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
