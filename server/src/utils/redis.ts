export function parseRedisUrl(redisUrl: string) {
    const parsedUrl = new URL(redisUrl);

    const username = parsedUrl.username;
    const password = parsedUrl.password;
    const host = parsedUrl.hostname;
    const port = parseInt(parsedUrl.port || "0");

    return { username, password, host, port };
}
