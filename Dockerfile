FROM node:24
RUN apt update && apt install tshark -y

COPY frontend /build/frontend
RUN rm -r /build/frontend/src/lib
COPY backend/src/lib/* /build/frontend/src/lib/
WORKDIR /build/frontend
RUN npm install
RUN npm run build

COPY backend /build/backend
WORKDIR /build/backend
RUN npm install
RUN npm run build

RUN cp -r /build/backend/ /app/
RUN cp -r /build/frontend/dist/ /app/static/

WORKDIR /app
ENTRYPOINT node dist/index.js