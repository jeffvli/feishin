FROM nginx:alpine-slim
COPY release/app/dist/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 9180