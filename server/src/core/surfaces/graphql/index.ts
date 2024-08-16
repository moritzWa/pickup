import * as http from "http";
import { ApolloServer } from "apollo-server-express";
import { Express } from "express";
import {
    ApolloServerPluginDrainHttpServer,
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginLandingPageLocalDefault,
} from "apollo-server-core";
import { schema } from "./schema";
import { createContext as context } from "./context";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";
import { config } from "src/config";
import { hasValue } from "src/core/logic";

const startApolloServer = async (app: Express) => {
    const httpServer = http.createServer(app);

    const server = new ApolloServer({
        schema,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })].filter(
            hasValue
        ),
        context,
    });

    await server.start();

    app.use(graphqlUploadExpress({}));

    server.applyMiddleware({
        app,
        path: "/graphql",
    });

    return server;
};

export { startApolloServer };
