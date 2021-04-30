FROM node:5-slim
ENV VERSION=1.3.0
WORKDIR /srv/app
ADD . /srv/app
RUN npm pack && npm install -g kongfig