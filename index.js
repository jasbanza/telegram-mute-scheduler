
import { config } from "./config/config.js";


import { TelegramClient } from "telegram"; // npm i telegram
import { Api } from "telegram/tl";
import { StringSession } from "telegram/sessions/index.js";
import input from "input"; // npm i input
import { promises as fs } from 'fs';


/* RESUME SESSION */
let stringSession = new StringSession("");
let sessionJson = {};
try {
    sessionJson = JSON.parse(await fs.readFile("session.json"));
    stringSession = new StringSession(sessionJson.stringSession);
} catch (err) {
    console.log("Unable to load existing session. Time to log in!");
}


/* ESTABLISH CONNECTION */
(async () => {
    console.log("Loading interactive example...");
    const client = new TelegramClient(stringSession, config.api_id, config.api_hash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: async () => await input.text("number ?"),
        password: async () => await input.text("password?"),
        phoneCode: async () => await input.text("Code ?"),
        onError: (err) => console.log(err),
    });
    console.log("You should now be connected.");
    saveSession(client.session.save());
    await client.sendMessage("me", { message: "Hello!" });
})();

async function saveSession(stringSession) {
    const jsonString = JSON.stringify({ stringSession: stringSession });
    await fs.writeFile('./session.json', jsonString);
}

// Api.Channel.