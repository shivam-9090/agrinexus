FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL=http://localhost:8000/api/v1
ARG VITE_FEDERATION_API_KEY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FEDERATION_API_KEY=$VITE_FEDERATION_API_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
