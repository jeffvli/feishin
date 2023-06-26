FROM node:16.15.0

RUN apt update -qq \
    && apt install -qy \
        wget \
        mpv \
        libnss3-dev \
        git

COPY . /feishin
WORKDIR /feishin

RUN npm install
RUN npm run build

CMD npm run start:web
