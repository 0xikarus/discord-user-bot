const {
    EventEmitter
} = require("events");
const WebSocket = require("ws");
const fetch = require("node-fetch");
const {
    promisify
} = require('util');
const sleep = promisify(setTimeout);
/** Modules **/
const Message = require("./modules/message.js")
const WEBSOCKET_URL = "wss://gateway.discord.gg/?encoding=json&v=8";
const getNonce = () => {
    let n = (Math.random() * 199990990909090090909); /* we just go overboard */
    return n;
}
String.prototype.replaceAll = function(str, newStr) {
    // If a regex pattern
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
        return this.replace(str, newStr);
    }
    // If a string
    return this.replace(new RegExp(str, 'g'), newStr);
};
class Discord extends EventEmitter {
    constructor(token) {
        super();
        this._token = token;
        this.settings = {
            socket: null,
            heartbeat: {
                interval: null,
                sequence: null,
                last_hb: false
            }
        };
        this._userData = {};
        this.toEmit = ["READY", "MESSAGE_CREATE"];
        this.connect();
    }
    async connect() {
        if (this.settings.socket) {
            this.settings.socket.terminate();
        }
        this.settings.socket = new WebSocket(WEBSOCKET_URL);
        this.settings.socket.onmessage = async (data) => {
            await this.handleEvent(data)
        };
    }
    send(data) {
        this.settings.socket.send(JSON.stringify(data));
    }
    heartbeat() {
        if (!this.settings.heartbeat) {
            console.log('NO DISCORD CONNECTION!');
            return; // TODO
        }
        this.send({
            op: 1,
            d: this.settings.heartbeat.sequence
        });
    }
    reconnect(data) {
        if (data.op != 7) return false;
        setTimeout(async () => {
            this.connect();
        }, 5000)
    }
    sigin(data) {
        if (data.op != 10) return false;
        console.log("[!] WebSocket requests token")
        this.send({
            op: 2,
            d: {
                token: this._token,
                intents: 513,
                properties: {
                    $os: 'linux',
                    $browser: 'Spurk',
                    $device: 'Spurk'
                }
            }
		});
		if (this.settings.heartbeat.int) clearInterval(this.settings.heartbeat.int);
        this.settings.heartbeat.int = setInterval(() => {
            this.heartbeat();
        }, data.d.heartbeat_interval);
        return true;
    }
    async joinGuild(guildInvite) {
        let v = await fetch(`https://discord.com/api/v8/invites/${guildInvite}?inputValue=https%3A%2F%2Fdiscord.gg%2${guildInvite}&with_counts=true`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US",
                "authorization": `${this._token}`,
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
            },
            "referrer": "https://discordapp.com/activity",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        }).then(async res => JSON.parse(await res.text()))
        if (v.code != undefined) {
            let g = await fetch(`https://discord.com/api/v8/invites/${v.code}`, {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US",
                    "authorization": `${this._token}`,
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                },
                "referrer": "https://discord.com/channels/@me",
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": null,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            }).then(async res => JSON.parse(await res.text()))
            console.log("g", g);
            if (g.new_member == true) {
                this.emit("guild_joined", g);
                return g;
            }
        }
        return false;
    }
    async loggedIn(data) {
        if (data.t == "READY") {
            this._userData = data.d.user;
            console.log(`[!] Loaded User-Data for Bot ${this._userData.username}#${this._userData.discriminator}`)
            this.emit("logged_in", this._userData);
            return true;
        }
        return false;
    }
    async sendMessageToChannel(channel_id, message) {
        console.log("sendMessageToChannel", channel_id, message)
        try {
            message = message.replaceAll("\n", "\\n")
            let v = await fetch(`https://discord.com/api/v8/channels/${channel_id}/messages`, {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US",
                    "authorization": `${this._token}`,
                    "content-type": "application/json",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                },
                "referrer": `https://discord.com/channels/@me/${channel_id}`,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": `{\"content\":\"${message}\",\"nonce\":\"${getNonce()}\",\"tts\":false}`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            }).then(async res => JSON.parse(await res.text()))
            console.log("send res", v)
            if (v.id != undefined) {
                this.emit("sent_message", v);
                return v;
            }
        } catch (e) {
            console.log("Error sending message", e);
            return -1;
        }
    }
    async createDMChannel(from_guild_id, from_channel_id, discord_id) {
        console.log("getUserChannelID", from_guild_id, from_channel_id, discord_id)
        try {
            let result = await fetch("https://discord.com/api/v8/users/@me/channels", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US",
                    "authorization": `${this._token}`,
                    "content-type": "application/json",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                },
                "referrer": `https://discord.com/channels/${from_guild_id}/${from_channel_id}`,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": `{\"recipients\":[\"${discord_id}\"]}`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            }).then(async res => JSON.parse(await res.text()))
            console.log(result)
            return result;
        } catch (e) {
            console.log("Error parsing channel id", e);
            return -1;
        }
    }
    async message(data) {
        let msg = new Message(data);
        this.emit("new_message", msg);
    }
    async handleUnknown(data) {
        this.emit("unknown", data);
    }
    async handleEvent(data) {
        if (!data.data) return false;
        let message = JSON.parse(data.data);
        if (message.op == 10) {
            this.sigin(message);
            return;
        }
        /*console.log("message.t", message.t)
        console.log("message.op", message.op)*/
        if (message.op == 0) {
            let eventName = message.t;
            if (message.s) {
                this.settings.heartbeat.sequence = message.s;
            }
            /*console.log("eventName", eventName)*/
            switch (eventName) {
                case "READY":
                    await this.loggedIn(message);
                    break;
                case "MESSAGE_CREATE":
                    await this.message(message);
                    break;
                default:
                    await this.handleUnknown(message);
                    break;
            }
        }
        if (message.op == 11) {
            console.log("Pong")
            this.settings.heartbeat.last_hb = true;
        }
        if (message.op == 7) {
            this.reconnect(message);
        }
        return true;
    }
}
module.exports = Discord;
