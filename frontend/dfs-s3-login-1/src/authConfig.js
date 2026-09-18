export const msalConfig = {
    auth: {
        clientId: "3cbc0426-09ed-4e59-b1ff-60981daa8762",

        authority:
            "https://login.microsoftonline.com/c2154212-c473-414a-9t88-8860491a518c",

        redirectUri: "http://localhost:3000/"
    },

    cache: {
        cacheLocation: "sessionStorage"
    }
};

export const loginRequest = {
    scopes: ["openid", "profile", "email"]
};

export const apiRequest = {
    scopes: [
        "api://c639b2a3-10c3-4611-b3c8-8acb71c2afc6/access_as_user"
    ]
};