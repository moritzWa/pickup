import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";
import cors from "cors";
import express, { Express } from "express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";
import * as http from "http";
import { createContext as context } from "./context";
import { schema } from "./schema";

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
        cors<cors.CorsRequest>({
            origin: (origin, callback) => {
                const allowedOrigins = [
                    "http://localhost:3000",
                    "https://talkpickup.com",
                ];
                if (
                    !origin ||
                    allowedOrigins.includes(origin) ||
                    origin.startsWith("chrome-extension://")
                ) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true,
        }),
        express.json(),
        expressMiddleware(server, {
            context: context,
        })
    );

    return server;
};

export { startApolloServer };
