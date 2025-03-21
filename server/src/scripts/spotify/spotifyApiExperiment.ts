import axios from "axios";

// Client credentials
const CLIENT_ID = "676ed65f9e6b4123ac3c9e5c259187e7";
const CLIENT_SECRET = "bcc731707a20484fb18eca9cea1c31a1";

async function getAccessToken() {
    try {
        const response = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "client_credentials",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        console.log("Access Token:", response.data.access_token);
        return response.data.access_token;
    } catch (error) {
        console.error("Error getting access token:", error);
        return null;
    }
}

const accessToken =
    "BQBgXwCQXGWjvdSHXqHDsqvsAfv-yQVNQCr-f_UpZdIbY0_wKT3tRMUpBauCuSO6x1fLoUSs2pKKjIC2VfoKrJ1AFpGjRtIkRv45VGU-mPiBwgBpvJ4";
const steveLacyArtistId = "57vWImR43h4CaDao012Ofp";

async function getArtistData(accessToken: string, artistId: string) {
    try {
        const response = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        console.log("Artist Data:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error("Error fetching artist data:", error);
        return null;
    }
}

// Main function to run the script
async function main() {
    //
    // const accessToken = await getAccessToken()
    if (accessToken) {
        await getArtistData(accessToken, steveLacyArtistId);
    }
}

main();
