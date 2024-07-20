#!/bin/bash

cd ../server

npm run generate:nexus

cd ../app

npm run graphql:codegen

# chmod +x graphql.sh