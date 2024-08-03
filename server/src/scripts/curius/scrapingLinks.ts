// scrape links 1-5 using https://curius.app/api/linkview/n and header Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mjk1NywiaWF0IjoxNzE1NTUwMzA2LCJleHAiOjE3NDY5OTk5MDZ9.tjIhVHbkf_lc3st0hdLdoUTDfN32VaQPeWYGRKlNGNc

const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mjk1NywiaWF0IjoxNzE1NTUwMzA2LCJleHAiOjE3NDY5OTk5MDZ9.tjIhVHbkf_lc3st0hdLdoUTDfN32VaQPeWYGRKlNGNc";
const headers = {
    Authorization: `Bearer ${token}`,
};

const scrapeCuriusLinks = async () => {
    for (let i = 1; i <= 5; i++) {
        const linkViewUrl = `https://curius.app/api/linkview/${i}`;
        const response = await fetch(linkViewUrl, { headers });
        const data = await response.json();
        console.log(data);
    }
};
