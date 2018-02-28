#!/bin/sh
# This will run two postgres db
# doron:pass123@:1001 & doron:pass123@:1002
docker run --name db_1 -p 10001:5432 -e POSTGRES_PASSWORD=pass123 -e POSTGRES_USER=doron -e POSTGRES_DB=db_1 -d postgres:9.6 && sleep 10 && docker run --name db_2 -p 10002:5432 -e POSTGRES_PASSWORD=pass123 -e POSTGRES_USER=doron -e POSTGRES_DB=db_2 -d postgres:9.6