# build
FROM node:16.18.1-slim
WORKDIR /web
COPY . .
RUN npm install --registry=https://registry.npm.taobao.org && npm run build
# run
FROM nginx
COPY --from=0 /web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=0 /web/build/ /usr/share/nginx/html
EXPOSE 80