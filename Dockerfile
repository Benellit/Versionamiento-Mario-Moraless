FROM nginx:alpine

COPY index.html styles.css functions.js /usr/share/nginx/html/

EXPOSE 80