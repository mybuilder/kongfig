FROM node:5-slim
ENV VERSION=1.2.5
WORKDIR /srv/app
ADD . /srv/app
RUN npm pack && npm install kongfig-$VERSION.tgz -g 