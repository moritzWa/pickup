import * as http from "http";
import { Express } from "express";
import { schema } from "./schema";
import { createContext as context } from "./context";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";
import { config } from "src/config";
import { hasValue } from "src/core/logic";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import express from "express";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";

const startApolloServer = async (app: Express) => {
    const httpServer = http.createServer(app);

    const server = new ApolloServer({
        schema,
        cache: new InMemoryLRUCache({
            maxSize: Math.pow(2, 20) * 100,
            // 5 minutes (in seconds)
            ttl: 300,
        }),
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();

    app.use(graphqlUploadExpress({}));

    app.use(
        "/graphql",
        cors<cors.CorsRequest>(),
        express.json(),
        expressMiddleware(server, {
            context: context,
        })
    );

    return server;
};

export { startApolloServer };
