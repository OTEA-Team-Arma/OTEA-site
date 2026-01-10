FROM nginx:1.25-alpine AS nginx
FROM php:8.2-fpm-alpine AS php

WORKDIR /var/www/html
COPY . /var/www/html

FROM nginx:1.25-alpine
COPY --from=php /var/www/html /var/www/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
