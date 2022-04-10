const Discord = require("./app.js")
const botToken = '{{TOKEN}}'; // replace with your own token
function sleep(ms) => new Promise(resolve => setTimeout(resolve, ms));
/* This example shows how to set the bot up so it automatically bumps a server on disboard */

var bump_channels = [{
    channel_id: "846894203296284734",
    last_bump: 0
}]
var bump_interval = false;
var last_bump = 0;
let d = new Discord(botToken);
async function bump_loop() {
    bump_channels.forEach(async e => {
        if (e.last_bump + ((Math.random() * (150 - 125) + 125) * 60 * 1000) < Date.now()) { //random interval because we are cool
            e.last_bump = Date.now();
            console.log(`bumping ${e.channel_id}`)
            await d.sendMessageToChannel(e.channel_id, "!d bump");
            await sleep(10000); // wait 10 sec because discord api doesnt like fast interactions
        }
    })
}
d.on("logged_in", async data => {
    console.log(data)
    if (bump_interval) clearInterval(bump_interval);
    bump_interval = setInterval(bump_loop, 60 * 1000);
});
