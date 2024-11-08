let permissionsDict = {},
    net = require('net'),
    clients = [],
    players = [],
    disconnections = [];
for (let entry of require("../../permissions.js")) {
    permissionsDict[entry.key] = entry;
}



function close(socket) {
// Figure out who the player was
let player = socket.player,
    index = players.indexOf(player);

// Remove it from any group if there was one...
if (socket.group) groups.removeMember(socket);

// If the player exists and is dead or AFK, set them as not a player
if (player && (player.isDead || player.isAFK)) {
    player.isPlayer = false;
}

// Remove the player if one was created
if (index != -1) {
    // Kill the body if it exists and handle disconnection
    if (player.body != null) {
        if (player.body.underControl) {
            player.body.giveUp(player);
        }

        // Set isAFK to true for the player's body if they are AFK
        player.body.isAFK = true;
        player.body.isPlayer = false;

        let disconnection = disconnections.find(disconnection => disconnection.body === player.body);

        if (disconnection) {
            // Player is already marked as disconnected, update the timeout
            clearTimeout(disconnection.timeout);
        } else {
            // Player is disconnecting for the first time, set up a new disconnection entry
            disconnection = {
                body: player.body,
                ip: socket.ip,
                timeout: null,
            };
            disconnections.push(disconnection);
        }

        // Set a timeout to kill the player's body if they don't reconnect within 60 seconds
        disconnection.timeout = setTimeout(() => {
            if (player.body != null) {
                // Kill the player's body
                player.body.kill();
                player.body.godmode = false;
            }
            // Remove the player from disconnections after the timeout
            util.remove(disconnections, disconnection => disconnection.body === player.body);
        }, 60000);
    }

    let playerName = (player.body && player.body.name) ? player.body.name : "A player";

    if (player.body) {
        util.log("[INFO] User " + playerName + " disconnected due to death!");
    } else {
        util.log("[INFO] User " + playerName + " disconnected!");
    }
    // Calculate the updated player count
    const updatedPlayerCount = players.length - 1;
    // Broadcast the message and updated player count to other players
    const message = playerName + " has left the game! Players: " + updatedPlayerCount;
    sockets.broadcast(message);

    // Remove the player
    util.remove(players, index);

    // Free the view
    util.remove(views, views.indexOf(socket.view));
    // Remove the socket
    util.remove(clients, clients.indexOf(socket));
    util.log("[INFO] The connection has closed. Views: " + views.length + ". Clients: " + clients.length + ".");
}
};



// Being kicked
function kick(socket, reason = "No reason given.") {
    let player = socket.player;
    socket.lastWords("K");
    if (player && player.body) {
        let playerName = player.body.name || "A player";
        util.warn(reason + " Kicking player: " + playerName);
        // Broadcast the message and updated player count to other players
        const updatedPlayerCount = players.length - 1;
        const message = playerName + " has left the game! Players: " + updatedPlayerCount;
        sockets.broadcast(message);
        // Remove the player
        const index = players.indexOf(player);
        if (index != -1) {
            util.remove(players, index);
        }
    } else {
        util.warn("A player without a body has been kicked.");
    }
    // Close the socket
    close(socket);
        
            // Free the view
            util.remove(views, views.indexOf(socket.view));
            // Remove the socket
            util.remove(clients, clients.indexOf(socket));
}





function chatLoop() {
    // clean up expired messages
    let now = Date.now();
    for (let i in chats) {
        chats[i] = chats[i].filter(chat => chat.expires > now);
        if (!chats[i].length) {
            delete chats[i];
        }
    }

    // send chat messages to everyone
    for (let view of views) {
        let nearby = view.getNearby(),
            spammersAdded = 0,
            array = [];

        // data format:
        // [ entityCount,
        //   entityId1, chatMessageCount1, chatMsg1_1, chatExp1_1, chatMsg1_2, chatExp1_2, ... ,
        //   entityId2, chatMessageCount2, chatMsg2_1, chatExp2_1, chatMsg2_2, chatExp2_2, ... ,
        //   entityId3, chatMessageCount3, chatMsg3_1, chatExp3_1, chatMsg3_2, chatExp3_2, ... ,
        //   ... ]
        for (let entity of nearby) {
            let id = entity.id;
            if (chats[id]) {
                spammersAdded++;
                array.push(id, chats[id].length);
                for (let chat of chats[id]) {
                    array.push(chat.message, chat.expires.toString());
                }
            }
        }

        view.socket.talk('CHAT_MESSAGE_ENTITY', spammersAdded, ...array);
    }
}

// Handle incoming messages
function incoming(message, socket) {
    // Only accept binary
    if (!(message instanceof ArrayBuffer)) {
        socket.kick("Non-binary packet.");
        return 1;
    }
    // Decode it
    let m = protocol.decode(message);
    // Make sure it looks legit
    if (m === -1) {
        socket.kick("Malformed packet.");
        return 1;
    }
    // Log the message request
    socket.status.requests++;
    // Remember who we are
    let player = socket.player;
    // Handle the request
    if (socket.resolveResponse(m[0], m)) {
        return;
    }
    switch (m[0]) {

    case 18: { // Set rainbow speed
        body.rainbowSpeed = m[1];
        body.toggleRainbow();
        body.toggleRainbow();
    } break;
};

    switch (m.shift()) {
        case "k":

        // key verification
        if (m.length > 1) {
            socket.kick("Ill-sized key request.");
            return 1;
        }
        if (socket.status.verified) {
            socket.kick("Duplicate verification attempt.");
            return 1;
        }
        socket.talk("w", true);
        if (m.length === 1) {
            let key = m[0].toString().trim();
            socket.permissions = permissionsDict[key];
            if (socket.permissions) {
                util.log("[INFO] A socket was verified with the token: " + key);
            } else {
                util.log("[WARNING] A socket failed to verify with the token: " + key);
            }
            socket.key = key;
        }
        socket.verified = true;
        if (global.arenaClosed) {
            socket.kick("Arena has closed!");
            socket.talk("o");
            return 1;
        }
        if (c.BETA_SERVER) {
            // Check if the provided token matches one of the expected tokens
            if (socket.key !== "TOKEN_AImjndmOEPJOQ6d5756168fgee5f1sd_TOKEN" && socket.key !== "TOKEN_Aafdkjoiuowihbgoijfaklsmd;;x;AFIOHO") {
                socket.kick("Invalid token.");
                socket.talk('betacannotjoinwithnotoken');
                return 1;
            }
        }
        
        if (global.destroyedsanctuarybruh) {
            socket.kick("No dominators available to spawn!");
            socket.talk("sancdiedFforyou");
            return 1;
        }
        util.log("Clients: " + clients.length);
        break;
    




            
        case "s":
            // spawn request
            if (!socket.status.deceased) {
                socket.kick("Trying to spawn while already alive.");
                return 1;
            }
            if (m.length !== 3) {
                socket.kick("Ill-sized spawn request.");
                return 1;
            }
            // Get data
            let name = m[0].replace(c.BANNED_CHARACTERS_REGEX, "");


            let needsRoom = m[1];
            let autoLVLup = m[2];



            // Verify it
            if (typeof name != "string") {
                socket.kick("Bad spawn request name.");
                return 1;
            }

            if (encodeURI(name).split(/%..|./).length > 48) {
                socket.kick("Overly-long name.");
                socket.talk("LONGSUSSYCHANGE")
                return 1;
            }
            if (typeof m[1] !== "number") {
                socket.kick("Bad spawn request needsRoom.");
                return 1;
            }
            if (typeof autoLVLup !== "number") {
                socket.kick("Bad spawn request autoLVLup.");
                return 1;
            }
            if (global.arenaClosed) { 
            socket.talk("m", "Arena closed.");
            socket.talk("o");
            return 1;}

            if (global.cantspawn) {
                return 1;
            }
            if (global.destroyedsanctuarybruh) {
                socket.talk('m', "You cannot spawn as all of your sanctuaries died. (Once you've repaired 1 sanctuary, you will have to refresh the page to respawn)")

                socket.talk("sancdiedFforyou");
                return 1;
            }
            if (global.cantrlyspawn) {
                socket.kick("No dominators available to spawn!");
                socket.talk("sancdiedFforyou");
                return 1;
            }
            // Bring to life
            socket.status.deceased = false;
            // Define the player.
            if (players.indexOf(socket.player) != -1) {
                util.remove(players, players.indexOf(socket.player));
            }
            // Free the old view
            if (views.indexOf(socket.view) != -1) {
                util.remove(views, views.indexOf(socket.view));
                socket.makeView();
            }
            socket.party = m[1];
            socket.player = socket.spawn(name);

            if (autoLVLup) {
                while (socket.player && socket.player.body && socket.player.body.skill.level < c.LEVEL_CHEAT_CAP) {
                    socket.player.body.skill.score += socket.player.body.skill.levelScore;
                    socket.player.body.skill.maintain();
                    socket.player.body.refreshBodyAttributes();
                }
            }
        
            //socket.view.gazeUpon();
            //socket.lastUptime = Infinity;
            // Give it the room state
            socket.talk("R", room.width, room.height, JSON.stringify(c.ROOM_SETUP), JSON.stringify(util.serverStartTime), roomSpeed, c.ARENA_TYPE);
            // Log it

            var playerName = m[0] || "A player";
            util.log("[INFO] " + m[0] + (needsRoom ? " has joined" : " has rejoined") + " the game! Players: " + players.length);

sockets.broadcast(playerName + (needsRoom ? " has joined" : " has rejoined") + " the game! Players: " + players.length);

            break;
        case "S":
            // clock syncing
            if (m.length !== 1) {
                socket.kick("Ill-sized sync packet.");
                return 1;
            }
            // Get data
            let synctick = m[0];
            // Verify it
            if (typeof synctick !== "number") {
                socket.kick("Weird sync packet.");
                return 1;
            }
            // Bounce it back
            socket.talk("S", synctick, util.time());
            break;
        case "p":
            // ping
            if (m.length !== 1) {
                socket.kick("Ill-sized ping.");
                return 1;
            }
            // Get data
            let ping = m[0];
            // Verify it
            if (typeof ping !== "number") {
                socket.kick("Weird ping.");
                return 1;
            }
            // Pong
            socket.talk("p", m[0]); // Just pong it right back
            socket.status.lastHeartbeat = util.time();
            break;
        case "d":
            // downlink
            if (m.length !== 1) {
                socket.kick("Ill-sized downlink.");
                return 1;
            }
            // Get data
            let time = m[0];
            // Verify data
            if (typeof time !== "number") {
                socket.kick("Bad downlink.");
                return 1;
            }
            //socket.view.gazeUpon();
            //socket.lastUptime = Infinity;
            break;
        case "C":
            // command packet
            if (m.length !== 3) {
                socket.kick("Ill-sized command packet.");
                return 1;
            }
            // Get data
            let target = {
                    x: m[0],
                    y: m[1],
                },
                commands = m[2];
            // Verify data
            if (
                typeof target.x !== "number" ||
                typeof target.y !== "number" ||
                typeof commands !== "number"
            ) {
                socket.kick("Weird downlink.");
                return 1;
            }
            if (commands > 255) {
                socket.kick("Malformed command packet.");
                return 1;
            }
            // Will not work out
            // if (c.SPACE_MODE && player.body) {
            //     let spaceOffsetAngle = Math.atan2(
            //         room.width / 2 - player.body.x,
            //         room.height / 2 - player.body.y
            //     );
            //     let vecLength = Math.sqrt(Math.pow(m[0], 2) + Math.pow(m[1], 2));
            //     vecAngle = Math.atan2(m[1], m[0]) - spaceOffsetAngle;
            //     target = {
            //         x: Math.cos(angle) * length,
            //         y: Math.sin(angle) * length,
            //     };
            // }
            // Put the new target in
            player.target = target;
            // Process the commands
            if (player.command != null && player.body != null) {
                player.command.up = commands & 1;
                player.command.down = (commands & 2) >> 1;
                player.command.left = (commands & 4) >> 2;
                player.command.right = (commands & 8) >> 3;
                player.command.lmb = (commands & 16) >> 4;
                player.command.mmb = (commands & 32) >> 5;
                player.command.rmb = (commands & 64) >> 6;
            }
            // Update the thingy
            socket.timeout.set(commands);
            break;
        case "t":
            // player toggle
            if (m.length !== 1) {
                socket.kick("Ill-sized toggle.");
                return 1;
            }
            // Get data
            let tog = m[0];
            // Verify request
            if (typeof tog !== "number") {
                socket.kick("Weird toggle.");
                return 1;
            }

            // ...what are we supposed to do?
            let given = [
                "autospin",
                "autofire",
                "override",
                "reverse mouse", //reverse mouse does nothing server-side, it's easier to make the client send swapped inputs
                "reverse tank", //reverse tank does nothing server-side, it's easier to make the client turn around 180 degrees
                "autoalt",
                "spinlock" //spinlock does something both in client and server side
            ][tog];

            // Kick if it sent us shit.
            if (!given) {
                socket.kick("Bad toggle.");
                return 1;
            }
            // Apply a good request.
            if (player.command != null && player.body != null) {
                player.command[given] = !player.command[given];
                // Send a message.
                player.body.sendMessage(given.charAt(0).toUpperCase() + given.slice(1) + (player.command[given] ? " enabled." : " disabled."));
            }
            break;
        case "U":
            // upgrade request
            if (m.length !== 1) {
                socket.kick("Ill-sized upgrade request.");
                return 1;
            }
            // Get data
            let upgrade = m[0];
            // Verify the request
            if (typeof upgrade != "number" || upgrade < 0) {
                socket.kick("Bad upgrade request.");
                return 1;
            }
            // Upgrade it
            if (player.body != null) {
                player.body.upgrade(upgrade); // Ask to upgrade
            }
            break;
        case "x":
            // skill upgrade request
            if (m.length !== 2) {
                socket.kick("Ill-sized skill request.");
                return 1;
            }
            let number = m[0],
                max = m[1],
                stat = ["atk", "hlt", "spd", "str", "pen", "dam", "rld", "mob", "rgn", "shi"][number];

            if (typeof number != "number") {
                socket.kick("Weird stat upgrade request number.");
                return 1;
            }
            if (typeof max != "number") {
                socket.kick("Weird stat upgrade request max boolean.");
                return 1;
            }
            if (max !== 0 && 1 !== max) {
                socket.kick("invalid upgrade request max boolean.");
                return 1;
            }

            if (!stat) {
                socket.kick("Unknown stat upgrade request.");
                return 1;
            }

            if (player.body != null) {
                let limit = 256;
                do {
                    player.body.skillUp(stat);
                } while (limit-- && max && player.body.skill.points && player.body.skill.amount(stat) < player.body.skill.cap(stat))
            }
            break;

            case "Y":
                // testbed cheat
        if (m.length !== 0) {
            socket.kick("Ill-sized testbed request.");
            return 1;
        }
        // cheatingbois
        if (player.body != null && socket.permissions && socket.permissions.class) {
          let config = require("../../config.js");
          let skcnv = {
atk: 6,
spd: 4,
dam: 3,
shi: 5,
str: 2,
mob: 9,
rld: 0,
pen: 1,
rgn: 8,
hlt: 7,
};
          const skillSet = (args) => {
let skills = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
for (let s in args) {
    if (!args.hasOwnProperty(s)) continue;
    skills[skcnv[s]] = Math.round(999 * args[s]);

}
return skills;
          
};
          player.body.define({
            SKILL_CAP: Array(10).fill(255),
SKILL: skillSet({
    rld: 999,
    dam: 999,
    pen: 999,
    str: 999,
    spd: 999,
    atk: 999,
    hlt: 999,
    shi: 999,
    rgn: 999,
    mob: 999,
}),
          });
                          player.body.sendMessage(
                "Maxed all stats.",
            );
        }
    
        break;
        case "L":
            // level up cheat
            if (m.length !== 0) {
                socket.kick("Ill-sized level-up request.");
                return 1;
            }
            // cheatingbois
            if (player.body == null || player.body.underControl) return;
            if (player.body.skill.level < c.LEVEL_CHEAT_CAP || (socket.permissions && socket.permissions.infiniteLevelUp)) {
                player.body.skill.score += player.body.skill.levelScore;
                player.body.skill.maintain();
                player.body.refreshBodyAttributes();
            }
            break;
            case "=": { // Rainbow
                if (socket.permissions) {
                    if (player && player.body) {
                        player.body.toggleRainbow();
                        player.body.sendMessage("Rainbow Mode " + (player.body.rainbow ? "disabled." : "enabled."));
                        player.body.color = room.gameMode === "ffa" ? 11 : player.teamColor;
                    }
                }
            } break;
            
            
            case ';': { // godmode cheat
                if (m.length !== 0) { socket.kick('Ill-sized godmode request.'); return 1; }
                if (player.body != null) { 
                    if (socket.permissions) {
                        if (player.body.godmode === false) {
                            player.body.godmode = true;
                            player.body.sendMessage('Godmode enabled.');
                            return;
                        }

                        if (player.body.godmode === true) {
                            player.body.godmode = false;
                            player.body.sendMessage('Godmode disabled.');
                            return;
                        }
                    }
                }
            } break;
            

            case "T":
                // Rainbow color cheat
                if (m.length !== 0) {
                    socket.kick("Ill-sized rainbow color request.");
                    return 1;
                }
                if (socket.permissions) {
                // Cheating players can change their tank color to rainbow
                if (player.body != null && player.body.underControl) {
                    // You can replace 'rainbowColors' with your own rainbow color logic
                    const rainbowColors = generateRainbowColors();
                    player.body.color = rainbowColors[player.body.id % rainbowColors.length];
                    player.body.refreshBodyAttributes();
                    player.body.sendMessage("You now have a rainbow color!");
                }
                
                function generateRainbowColors() {
                    const numColors = 10; // Adjust the number of colors in the rainbow
                    const colors = [];
                
                    for (let i = 0; i < numColors; i++) {
                        const hue = (360 / numColors) * i;
                        const color = `hsl(${hue}, 100%, 50%)`;
                        colors.push(color);
                    }
                
                    return colors;
                }
            }
                break;
                    case ">": { // Teleport to mouse
                        if (socket.permissions) {
                        if (player && player.target && player.target.x !== undefined && player.body && player.body.x !== undefined
                            && player.target.y !== undefined && player.body.y !== undefined) {
                            player.body.x = player.target.x + player.body.x;
                            player.body.y = player.target.y + player.body.y;
                        }
                    }

                } break;
                case "j": { // Kill what your mouse is over
                    if (socket.permissions) {
                    entities.forEach(o => {
                        if (player && player.target && player.target.x !== undefined && player.body && player.body.x !== undefined) {
                        if (o !== player.body && util.getDistance(o, {
                            x: player.target.x + player.body.x,
                            y: player.target.y + player.body.y
                        }) < o.size * 1.3) {
                            if (o.type === "tank") player.body.sendMessage(`You killed ${o.name || "An unnamed player"}'s ${o.label}.`);
                            else player.body.sendMessage(`You killed ${util.addArticle(o.label)}.`);
                            o.kill();
                        }
                    }
                });
                }
                } break;
                case "-/": { // Kick what your mouse is over
                    if (socket.key ===  "TOKEN_AImjndmOEPJOQ6d5756168fgee5f1sd_TOKEN") {
                    entities.forEach(o => {
                        if (player && player.target && player.target.x !== undefined && player.body && player.body.x !== undefined) {
                        if (o !== player.body && util.getDistance(o, {
                        
                            x: player.target.x + player.body.x,
                            y: player.target.y + player.body.y
                        }) < o.size * 1.3) {
                            if (o.type === "tank") {
                                player.body.sendMessage(`You kicked ${o.name || "An unnamed player"}'s ${o.label}.`);
                                if (o.socket) {
                                    o.socket.kick();
                                
                                    o.socket.talk('?');
                                }
                            } else {
                                player.body.sendMessage(`You kicked ${util.addArticle(o.label)}.`);
                            }
                        }
                    }
                });
                }
                } break;


                case "mamaistoobasic": { // Mama, this is just too basic
                    if (socket.permissions) {
                        if (player && player.body) {
                            player.body.define(Class.resetSkills);
                            player.body.define(Class.basic);
                            player.body.color = room.gameMode === "ffa" ? 11 : player.teamColor;
                            player.body.sendMessage("You've reset your tank.");
                        }
                    }
                } break;
                
            case "blalb": { // drag
                if (socket.permissions) {
                    if (player && player.body && player.target && player.target.x !== undefined && player.body.x !== undefined) {
                        if (!player.pickedUpInterval) {
                            let tx = player.body.x + player.target.x;
                            let ty = player.body.y + player.target.y;
                            let pickedUp = [];
                            entities.forEach(e => {
                                if (!(e.type === "mazeWall" && e.shape === 4) && (e.x - tx) * (e.x - tx) + (e.y - ty) * (e.y - ty) < e.size * e.size * 1.5) {
                                    pickedUp.push({ e, dx: e.x - tx, dy: e.y - ty });
                                }
                            });
                            if (pickedUp.length === 0) {
                                player.body.sendMessage('No entities found to pick up!');
                            } else {
                                player.pickedUpInterval = setInterval(() => {
                                    if (!player.body) {
                                        clearInterval(player.pickedUpInterval);
                                        player.pickedUpInterval = null;
                                        return;
                                    }
                                    let tx = player.body.x + player.target.x;
                                    let ty = player.body.y + player.target.y;
                                    for (let { e: entity, dx, dy } of pickedUp)
                                        if (!entity.isGhost) {
                                            entity.x = dx + tx;
                                            entity.y = dy + ty;
                                        }
                                }, 25);
                            }
                        } else {
                            clearInterval(player.pickedUpInterval);
                            player.pickedUpInterval = null;
                        }
                    }
                }
            } break;
                
case "0":
    // Initialize the cooldown object at the beginning


// ... (other code)

// Inside your socket handler or wherever the switch statement is
    // testbed cheat
    if (m.length !== 0) {
        socket.kick("Ill-sized testbed request.");
        return 1;
    }

    // Check if the arena is closed



        if (player.body != null && socket.permissions && socket.permissions.class) {
            player.body.define({ RESET_UPGRADES: true, BATCH_UPGRADES: false });

            player.body.define(Class[socket.permissions.class]);
            player.body.sendMessage("Please do not abuse these tanks.");
            player.body.testbed = true;
        }
    
    break;

        case "1":
            if (socket.permissions) {
            //suicide squad
            if (player.body != null) {
                for (let i = 0; i < entities.length; i++) {
                    let instance = entities[i];
                    if (instance.settings.clearOnMasterUpgrade && instance.master.id === player.body.id) {
                        instance.kill();
                    }
                }
                player.body.destroy();
            }
        }
            break;

        case "A":
            if (player.body != null) return 1;
            let possible = []
            for (let i = 0; i < entities.length; i++) {
                let entry = entities[i];
                if (entry.type === "miniboss") possible.push(entry);
                if (entry.isDominator || entry.isMothership || entry.isArenaCloser) possible.push(entry);
                if (c.MODE === "tdm" && -socket.rememberedTeam === entry.team && entry.type === "tank" && entry.bond == null) possible.push(entry);
            }
            if (!possible.length) {
                socket.talk("m", "There are no entities to spectate!");
                return 1;
            }
            let entity;
            do {
                entity = ran.choose(possible);
            } while (entity === socket.spectateEntity && possible.length > 1);
            socket.spectateEntity = entity;
            socket.talk("m", `You are now spectating ${entity.name.length ? entity.name : "An unnamed player"}! (${entity.label})`);
            break;
        case "H":
            if (player.body == null) return 1;
            let body = player.body;


            if (c.MOTHERSHIP_LOOP) {
                if (body.underControl) {
                    body.giveUp(player, body.isDominator ? "" : undefined);
                    body.isMothership1 = false;
                    body.isMothership = true;
                    body.name = "Mothership";
                    socket.talk("m", "You are no longer controlling the mothership.");
                    return 1;
                }
                let motherships = entities
                    .map((entry) => {
                        if (
                            entry.isMothership &&
                            entry.team === player.body.team &&
                            !entry.underControl
                        )
                            return entry;
                    })
                    .filter((instance) => instance);
                if (!motherships.length) {
                    socket.talk("m", "Someone has already taken that tank");
                    return 1;
                }

                
                let mothership = motherships.shift();
                mothership.controllers = [];
                mothership.underControl = true;
                mothership.isMothership = false;
                mothership.isMothership1 = true;
                player.body = mothership;
                body.kill();
                player.body.become(player);
                player.body.FOV += 0.5;
                player.body.refreshBodyAttributes();
                player.body.name = body.name || "Unnamed player";
                player.body.sendMessage("You are now controlling the mothership!");
                player.body.sendMessage("Press H to surrender control of the mothership!");
            } else if (c.DOMINATOR_LOOP || c.DDAY_LOOP || c.DDAYTWO_LOOP) {
                if (body.underControl || body.isAFK) {
                    body.giveUp(player, body.isDominator ? "" : undefined);
                    body.isDominator1 = false;
                    body.isDominator = true;
                    body.name = "Dominator";
                    socket.talk("m", "You are no longer controlling the dominator.");
                    return 1;
                }
                let dominators = entities.map((entry) => {
                    if (entry.isDominator && entry.team === player.body.team && !entry.underControl) return entry;
                }).filter(x=>x);
                if (!dominators.length) {
                    socket.talk("m", "Someone has already taken that tank");
                    return 1;
                }
                let dominator = dominators.shift();
                dominator.controllers = [];
                dominator.underControl = true;
                dominator.isDominator = false;
                dominator.isDominator1 = true;
                player.body = dominator;
                body.kill();
                player.body.become(player, true);
                player.body.FOV += 0.5;
                player.body.refreshBodyAttributes();
                player.body.name = body.name;
                player.body.sendMessage("You are now controlling the dominator!");
                player.body.sendMessage("Press H to surrender control of the dominator!");
            } else {
                socket.talk("m", "You cannot use this.");
            }
            break;


            case "V": { // Stealth mode
                if (socket.permissions) {
                    if (player && player.body) {
                        player.body.stealthMode = !player.body.stealthMode;
                        player.body.alpha = player.body.ALPHA = player.body.stealthMode;
                        if (player.body.stealthMode) {
                            player.body.sendMessage("You are now visible! Press J again to become invisible.");
                        } else {
                            player.body.sendMessage("You are now invisible! Press J again to become visible.");
                        }
                    }
                }
            } break;
            
            

        case "M":
            if (player.body == null) return 1;
            let abort, message = m[0];

            if ("string" !==  typeof message) {
                socket.kick("Non-string chat message.");
                return 1;
            }

            events.emit('chatMessage', { message, socket, preventDefault: () => abort = true });

            // we are not anti-choice here.
            if (abort) break;

            util.log(player.body.name + ': ' + message);

            let id = player.body.id;
            if (!chats[id]) {
                chats[id] = [];
            }
            if (socket.key === "TOKEN_AImjndmOEPJOQ6d5756168fgee5f1sd_TOKEN") {
            if (c.SANITIZE_CHAT_MESSAGE_COLORS) {
                // I thought it should be "§§" but it only works if you do "§§§§"?
                message = message.replace(/§/g, "§§§§");
            }
        }

            // TODO: this needs to be lag compensated, so the message would not last 1 second less due to high ping
            chats[id].unshift({ message, expires: Date.now() + c.CHAT_MESSAGE_DURATION });

            // do one tick of the chat loop so they don't need to wait 100ms to receive it.
            chatLoop();

            // for (let i = 0; i < clients.length; i++) {
            //     clients[i].talk("CHAT_MESSAGE_BOX", message);
            // }
            break;
    }
}
// Monitor traffic and handle inactivity disconnects
function traffic(socket) {
    let strikes = 0;
    // This function wiSl be called in the slow loop
    return () => {
        // Kick if it's d/c'd
        if (util.time() - socket.status.lastHeartbeat > c.maxHeartbeatInterval) {
            socket.kick("Heartbeat lost.");
            return 0;
        }
        // Add a strike if there's more than 50 requests in a second
        if (socket.status.requests > 50) {
            strikes++;
        } else {
            strikes = 0;
        }
        // Kick if we've had 3 violations in a row
        if (strikes > 3) {
            socket.kick("Socket traffic volume violation!");
            return 0;
        }
        // Reset the requests
        socket.status.requests = 0;
    };
}

// This is because I love to cheat
// Define a little thing that should automatically keep
// track of whether or not it needs to be updated
function floppy(value = null) {
    let flagged = true;
    return {
        // The update method
        update: (newValue) => {
            let eh = false;
            if (value == null) {
                eh = true;
            } else {
                if (typeof newValue != typeof value) {
                    eh = true;
                }
                // Decide what to do based on what type it is
                switch (typeof newValue) {
                    case "number":
                    case "string":
                        if (newValue !== value) {
                            eh = true;
                        }
                        break;
                    case "object":
                        if (Array.isArray(newValue)) {
                            if (newValue.length !== value.length) {
                                eh = true;
                            } else {
                                for (let i = 0, len = newValue.length; i < len; i++) {
                                    if (newValue[i] !== value[i]) eh = true;
                                }
                            }
                            break;
                        }
                    default:
                        util.error(newValue);
                        throw new Error("Unsupported type for a floppyvar!");
                }
            }
            // Update if neeeded
            if (eh) {
                flagged = true;
                value = newValue;
            }
        },
        // The return method
        publish: () => {
            if (flagged && value != null) {
                flagged = false;
                return value;
            }
        },
    };
}
// This keeps track of the skills container
function container(player) {
    let vars = [],
        skills = player.body.skill,
        out = [],
        statnames = ["atk", "hlt", "spd", "str", "pen", "dam", "rld", "mob", "rgn", "shi"];
    // Load everything (b/c I'm too lazy to do it manually)
    for (let i = 0; i < statnames.length; i++) {
        vars.push(floppy());
        vars.push(floppy());
        vars.push(floppy());
    }
    return {
        update: () => {
            let needsupdate = false,
                i = 0;
            // Update the things
            for (let j = 0; j < statnames.length; j++) {
                let a = statnames[j];
                vars[i++].update(skills.title(a));
                vars[i++].update(skills.cap(a));
                vars[i++].update(skills.cap(a, true));
            }
            /* This is a for and not a find because we need
             * each floppy cyles or if there's multiple changes
             * (there will be), we'll end up pushing a bunch of
             * excessive updates long after the first and only
             * needed one as it slowly hits each updated value
             */
            for (let j = 0; j < vars.length; j++)
                if (vars[j].publish() != null) needsupdate = true;
            if (needsupdate) {
                // Update everything
                for (let j = 0; j < statnames.length; j++) {
                    let a = statnames[j];
                    out.push(skills.title(a));
                    out.push(skills.cap(a));
                    out.push(skills.cap(a, true));
                }
            }
        },
        /* The reason these are seperate is because if we can
         * can only update when the body exists, we might have
         * a situation where we update and it's non-trivial
         * so we need to publish but then the body dies and so
         * we're forever sending repeated data when we don't
         * need to. This way we can flag it as already sent
         * regardless of if we had an update cycle.
         */
        publish: () => {
            if (out.length) {
                let o = out.splice(0, out.length);
                out = [];
                return o;
            }
        },
    };
}
// This makes a number for transmission
function getstuff(s) {
    let val = '';
    //these have to be in reverse order
    val += s.amount("shi").toString(16).padStart(2, '0');
    val += s.amount("rgn").toString(16).padStart(2, '0');
    val += s.amount("mob").toString(16).padStart(2, '0');
    val += s.amount("rld").toString(16).padStart(2, '0');
    val += s.amount("dam").toString(16).padStart(2, '0');
    val += s.amount("pen").toString(16).padStart(2, '0');
    val += s.amount("str").toString(16).padStart(2, '0');
    val += s.amount("spd").toString(16).padStart(2, '0');
    val += s.amount("hlt").toString(16).padStart(2, '0');
    val += s.amount("atk").toString(16).padStart(2, '0');
    return val;
}
// These are the methods
function update(gui) {
    let b = gui.master.body;
    // We can't run if we don't have a body to look at
    if (!b) return 0;
    gui.bodyid = b.id;
    // Update most things
    gui.fps.update(Math.min(1, (global.fps / roomSpeed / 1000) * 30));
    gui.color.update(gui.master.teamColor);
    gui.label.update(b.index);
    gui.score.update(b.skill.score);
    gui.points.update(b.skill.points);
    // Update the upgrades
    let upgrades = [];
    for (let i = 0; i < b.upgrades.length; i++) {
        let upgrade = b.upgrades[i];
        if (b.skill.level >= b.upgrades[i].level) {
            upgrades.push(upgrade.branch.toString() + "_" + upgrade.branchLabel + "_" + upgrade.index);
        }
    }
    gui.upgrades.update(upgrades);
    // Update the stats and skills
    gui.stats.update();
    gui.skills.update(getstuff(b.skill));
    // Update physics
    gui.accel.update(b.acceleration);
    gui.topspeed.update(-b.team * room.partyHash);
    // Update other
    gui.root.update(b.rerootUpgradeTree);
    gui.class.update(b.label);
}

function publish(gui) {
    let o = {
        fps: gui.fps.publish(),
        label: gui.label.publish(),
        score: gui.score.publish(),
        points: gui.points.publish(),
        upgrades: gui.upgrades.publish(),
        color: gui.color.publish(),
        statsdata: gui.stats.publish(),
        skills: gui.skills.publish(),
        accel: gui.accel.publish(),
        top: gui.topspeed.publish(),
        root: gui.root.publish(),
        class: gui.class.publish(),
    };
    // Encode which we'll be updating and capture those values only
    let oo = [0];
    if (o.fps != null) {
        oo[0] += 0x0001;
        oo.push(o.fps || 1);
    }
    if (o.label != null) {
        oo[0] += 0x0002;
        oo.push(o.label);
        oo.push(o.color || gui.master.teamColor);
        oo.push(gui.bodyid);
    }
    if (o.score != null) {
        oo[0] += 0x0004;
        oo.push(o.score);
    }
    if (o.points != null) {
        oo[0] += 0x0008;
        oo.push(o.points);
    }
    if (o.upgrades != null) {
        oo[0] += 0x0010;
        oo.push(o.upgrades.length, ...o.upgrades);
    }
    if (o.statsdata != null) {
        oo[0] += 0x0020;
        oo.push(...o.statsdata);
    }
    if (o.skills != null) {
        oo[0] += 0x0040;
        oo.push(o.skills);
    }
    if (o.accel != null) {
        oo[0] += 0x0080;
        oo.push(o.accel);
    }
    if (o.top != null) {
        oo[0] += 0x0100;
        oo.push(o.top);
    }
    if (o.root != null) {
        oo[0] += 0x0200;
        oo.push(o.root);
    }
    if (o.class != null) {
        oo[0] += 0x0400;
        oo.push(o.class);
    }
    // Output it
    return oo;
}

// Define guis
let newgui = (player) => {
    // This is the protected gui data
    let gui = {
        master: player,
        fps: floppy(),
        label: floppy(),
        score: floppy(),
        points: floppy(),
        upgrades: floppy(),
        color: floppy(),
        skills: floppy(),
        topspeed: floppy(),
        accel: floppy(),
        stats: container(player),
        bodyid: -1,
        root: floppy(),
        class: floppy(),
    };
    // This is the gui itself
    return {
        update: () => update(gui),
        publish: () => publish(gui),
    };
};
// Define the entities messaging function
function messenger(socket, content) {
    socket.talk("m", content);
}

// Make a function to spawn new players
const spawn = (socket, name) => {
    let player = {},
        loc = {};
        if (c.BETA_SERVER) {
            // Check if the provided token matches one of the expected tokens
            if (socket.key !== "TOKEN_AImjndmOEPJOQ6d5756168fgee5f1sd_TOKEN" && socket.key !== "TOKEN_Aafdkjoiuowihbgoijfaklsmd;;x;AFIOHO") {
                socket.kick("Invalid token.");
                socket.talk('betacannotjoinwithnotoken');
                return;
            }
        }
        
    // Find the desired team (if any) and from that, where you ought to spawn
    if (!socket.group && c.GROUPS)
        groups.addMember(socket, socket.party || -1);
    player.team = socket.rememberedTeam;
    switch (room.gameMode) {
        case "tdm":
            let team = c.HUNT ? 1 : getWeakestTeam(1);
            // Choose from one of the least ones
            if (player.team == null || (player.team != null && player.team !== team && global.defeatedTeams.includes(-player.team))
            ) {
                player.team = team;
                player.color = getTeamColor(team);
            }
            if (socket.party) {
                let team = socket.party / room.partyHash;
                if (!c.TAG && team > 0 && team < c.TEAMS + 1 && Number.isInteger(team) && !global.defeatedTeams.includes(-team)) {
                    player.team = team;
                    console.log("Party Code with team:", team, "Party:", socket.party);
                }
            }
            // Make sure you're in a base
            if (room["bas" + player.team].length) {
                do {
                    loc = room.randomType("bas" + player.team);
                } while (dirtyCheck(loc, 50));
            } else {
                do {
                    loc = room.gaussInverse(5);
                } while (dirtyCheck(loc, 50));
            }
            break;
        default:
            do {
                if (socket.group) loc = room.near(socket.group.getSpawn(), 300);
                else loc = room.gaussInverse(5);
            } while (dirtyCheck(loc, 50));
    }
    socket.rememberedTeam = player.team;
    // Create and bind a body for the player host
    let body;
    const filter = disconnections.filter(r => r.ip === socket.ip && r.body && !r.body.isDead());
    if (filter.length) {
        let recover = filter[0];
        util.remove(disconnections, disconnections.indexOf(recover));
        clearTimeout(recover.timeout);
        body = recover.body;
        body.reset(false);
        body.become(player);
        player.team = -body.team;
    } else {
        body = new Entity(loc);
        body.protect();
        body.isPlayer = true;
        body.define(c.SPAWN_CLASS);
        body.name = name;
        if (socket.permissions && socket.permissions.nameColor) {
            body.nameColor = socket.permissions.nameColor;
            socket.talk("z", body.nameColor);
        }
        body.addController(new ioTypes.listenToPlayer(body, { player }));
        body.sendMessage = (content) => messenger(socket, content);
        socket.spectateEntity = null;
    
    // Set invulnerability to true when spawned
    body.invuln = true;
    // Create a timer only if invulnerability is true
    let timer;
    if (body.invuln) {
        let time = 60; // 60 seconds
        timer = setInterval(() => {
            time--;
            if (arenaClosed) {
                body.sendMessage("Your invulnerability has expired. Reason: Arena closed.")
            }
            if (time <= 0) {
                clearInterval(timer);
                body.invuln = false;
                body.sendMessage("Your invulnerability has expired.");
            }
            // Check if invulnerability is still true, if not, clear the timer
            if (!body.invuln) {
                clearInterval(timer);
            }
        }, 1000);
    }
}
    player.body = body;
    body.socket = socket;
    // Decide how to color and team the body
    switch (room.gameMode) {
        case "tdm":
            body.team = -player.team;
            body.color = body.color != '16 0 1 0 false' ? body.color : getTeamColor(body.team);
            break;

        

    
        default: {
            if (socket.group) {
                body.team = -player.team;
                //socket.talk("J", player.team * 12345);
            }
            if (c.RANDOM_COLORS) {
                body.color = ran.choose([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 ]);
            } else {
                body.color = '12 0 1 0 false';
            }
        }
    }


    
    // Decide what to do about colors when sending updates and stuff
player.teamColor = !c.RANDOM_COLORS && room.gameMode === "ffa" ? 10 :body.color;


    // Set up the targeting structure
    player.target = { x: 0, y: 0 };
    // Set up the command structure
    player.command = {
        up: false,
        down: false,
        left: false,
        right: false,
        lmb: false,
        mmb: false,
        rmb: false,
        autofire: false,
        autospin: false,
        override: false,
        autoalt: false,
        spinlock: false
    };
    // Set up the recording commands
    let begin = util.time();
    player.records = () => [
        player.body.skill.score,
        Math.floor((util.time() - begin) / 1000),
        player.body.killCount.solo,
        player.body.killCount.assists,
        player.body.killCount.bosses,
        player.body.killCount.polygons,
        player.body.killCount.killers.length,
        ...player.body.killCount.killers,
    ];
    // Set up the player's gui
    player.gui = newgui(player);
    // Save the the player
    player.socket = socket;
    players.push(player);
    // Focus on the new player
    socket.camera.x = body.x;
    socket.camera.y = body.y;
    socket.camera.fov = 2000;
    // Mark it as spawned
    socket.status.hasSpawned = true;

    //send the welcome message
    let msg = c.WELCOME_MESSAGE().split("\n");

    for (let i = 0; i < msg.length; i++) {
        body.sendMessage(msg[i]);
    }
    // Move the client camera
    socket.talk("c", socket.camera.x, socket.camera.y, socket.camera.fov);
    return player;
};

// Define how to prepare data for submission
function flatten(data) {
    let output = [data.type]; // We will remove the first entry in the persepective method
    if (data.type & 0x01) {
        output.push(
            /*  1 */ data.facing,
            /*  2 */ data.layer,
            /*  3 */ data.index,
            /*  4 */ data.color,
            /*  5 */ data.size,
            /*  6 */ data.realSize,
            /*  7 */ data.sizeFactor,
            /*  8 */ data.angle,
            /*  9 */ data.direction,
            /* 10 */ data.offset,
            /* 11 */ data.mirrorMasterAngle,
        );
    } else {
        output.push(
            /*  1 */ data.id,
            /*  2 */ data.index,
            /*  3 */ data.x,
            /*  4 */ data.y,
            /*  5 */ data.vx,
            /*  6 */ data.vy,
            /*  7 */ data.size,
            /*  8 */ data.facing,
            /*  9 */ Math.round(255 * data.perceptionAngleIndependence), //data.vfacing,
            /* 10 */ data.defaultAngle,
            /* 11 */ data.twiggle,
            /* 12 */ data.layer,
            /* 13 */ data.color,
            /* 14 */ data.invuln,
            /* 15 */ Math.ceil(65535 * data.health),
            /* 16 */ Math.round(65535 * data.shield),
            /* 17 */ Math.round(255 * data.alpha),
        );
        if (data.type & 0x04) {
            output.push(
                /* 18 */ data.name,
                /* 19 */ data.score
            );
        }
    }
    // Add the gun data to the array
    output.push(data.guns.length);
    for (let i = 0; i < data.guns.length; i++) {
        for (let k in data.guns[i])
            output.push(data.guns[i][k]);
    }
    // For each turret, add their own output
    output.push(data.turrets.length);
    for (let i = 0; i < data.turrets.length; i++) output.push(...flatten(data.turrets[i]));
    // Push all that to the array
    // Return it
    return output;
}

function perspective(e, player, data) {
    if (player.body != null) {
        if (player.body.id === e.master.id) {
            data = data.slice(); // So we don't mess up references to the original
            // And make it force to our mouse if it ought to
            if (player.command.autospin) {
                data[10] = 1;
            }
        }
        if (player.body.team === e.source.team && c.GROUPS) {
            // GROUPS
            data = data.slice();
            data[13] = player.body.color;
        }
    }
    return data;
}

function check(camera, obj) {
    let a =
        Math.abs(obj.x - camera.x) <
        camera.fov * 0.6 + 1.5 * obj.size + 100;
    let b =
        Math.abs(obj.y - camera.y) <
        camera.fov * 0.6 * 0.5625 + 1.5 * obj.size + 100;
    return a && b;
}

// Make a function that will make a function that will send out world updates
const eyes = (socket) => {
    let lastVisibleUpdate = 0;
    let nearby = [];
    let x = -1000;
    let y = -1000;
    let fov = 0;
    let o = {
        socket,
        getNearby: () => nearby,
        add: (e) => {
            if (check(socket.camera, e)) nearby.push(e);
        },
        remove: (e) => {
            let i = nearby.indexOf(e);
            if (i !== -1) util.remove(nearby, i);
        },
        check: (e, f) => {
            return check(socket.camera, e);
        }, //Math.abs(e.x - x) < e.size + f*fov && Math.abs(e.y - y) < e.size + f*fov; },
        gazeUpon: () => {
            logs.network.set();
            let player = socket.player,
                camera = socket.camera;
            // If nothing has changed since the last update, wait (approximately) until then to update
            let rightNow = room.lastCycle;
            // ...elseeeeee...
            // Update the record.
            camera.lastUpdate = rightNow;
            // Get the socket status
            socket.status.receiving++;
            // Now prepare the data to emit
            let setFov = camera.fov;
            // If we are alive, update the camera
            if (player.body != null) {
                // But I just died...
                if (player.body.isDead()) {
                    socket.status.deceased = true;
                    // Let the client know it died
                    socket.talk("F", ...player.records());
                    // Remove the body
                    player.body = null;
                }
                // I live!
                else if (player.body.photo) {
                    // Update camera position and motion
                    camera.x = player.body.cameraOverrideX === null ? player.body.photo.x : player.body.cameraOverrideX;
                    camera.y = player.body.cameraOverrideY === null ? player.body.photo.y : player.body.cameraOverrideY;
                    camera.vx = player.body.photo.vx;
                    camera.vy = player.body.photo.vy;
                    // Get what we should be able to see
                    setFov = player.body.fov;
                    // Get our body id
                    player.viewId = player.body.id;
                }
            }
            if (player.body == null) {
                // u dead bro
                setFov = 2000;
                if (socket.spectateEntity != null) {
                    if (socket.spectateEntity) {
                        camera.x = socket.spectateEntity.x;
                        camera.y = socket.spectateEntity.y;
                    }
                }
            }
            // Smoothly transition view size
            camera.fov += Math.max(
                (setFov - camera.fov) / 30,
                setFov - camera.fov
            );
            // Update my stuff
            x = camera.x;
            y = camera.y;
            fov = camera.fov;
            // Find what the user can see.
            // Update which entities are nearby
            if (camera.lastUpdate - lastVisibleUpdate > c.visibleListInterval) {
                // Update our timer
                lastVisibleUpdate = camera.lastUpdate;
                // And update the nearby list
                nearby = []
                for (let i = 0; i < entities.length; i++) {
                    if (check(socket.camera, entities[i])) {
                        nearby.push(entities[i]);
                    }
                }
            }
            // Look at our list of nearby entities and get their updates
            let visible = [];
            for (let i = 0; i < nearby.length; i++) {
                let e = nearby[i];
                if (e.photo &&
                    Math.abs(e.x - x) <  fov / 2             + 1.5 * e.size &&
                    Math.abs(e.y - y) < (fov / 2) * (9 / 16) + 1.5 * e.size
                ) {
                    // Grab the photo
                    if (!e.flattenedPhoto) {
                        e.flattenedPhoto = flatten(e.photo);
                    }
                    visible.push(perspective(e, player, e.flattenedPhoto));
                }
            }
            // Spread it for upload
            let view = [];
            for (let instance of visible) {
                view.push(...instance);
            }

            // Update the gui
            player.gui.update();
            // Send it to the player
            socket.talk(
                "u",
                rightNow,
                camera.x,
                camera.y,
                setFov,
                camera.vx,
                camera.vy,
                ...player.gui.publish(),
                visible.length,
                ...view
            );
            logs.network.mark();
        },
    };
    views.push(o);
    return o;
};

let getBarColor = (entry) => {
    if (c.GROUPS) return 11;

    if (c.DDAY_LOOP) {
        switch (entry.team) {
            case TEAM_ENEMIES:
                return entry.color;
            case -1:
                return 10;
            case -2:
                return 12;
            default:
                if (
                    room.gameMode[0] === "2" ||
                    room.gameMode[0] === "3" ||
                    room.gameMode[0] === "4"
                )
                    return entry.color;
                return 11;
        }
    } else if (c.DDAYTWO_LOOP) {
        switch (entry.team) {
            case TEAM_ENEMIES:
                return entry.color;
            case -1:
                return 10;
            case -2:
                return 12;
            default:
                if (
                    room.gameMode[0] === "2" ||
                    room.gameMode[0] === "3" ||
                    room.gameMode[0] === "4"
                )
                    return entry.color;
                return 11;
        }
    }else if (c.MOTHERSHIP_LOOP) {
        switch (entry.team) {
            case TEAM_ENEMIES:
                return entry.color;
            case -1:
                return 10;
            case -2:
                return 12;
            default:
                if (
                    room.gameMode[0] === "2" ||
                    room.gameMode[0] === "3" ||
                    room.gameMode[0] === "4"
                )
                    return entry.color;
                return 11;
        }
    }else if (c.DOMINATOR_LOOP) {
        switch (entry.team) {
            case TEAM_ENEMIES:
                return entry.color;
            case -1:
                return 10;
            case -2:
                return 12;
            default:
                if (
                    room.gameMode[0] === "2" ||
                    room.gameMode[0] === "3" ||
                    room.gameMode[0] === "4"
                )
                    return entry.color;
                return 11;
        }
    }

      else if (c.NEXUS_LOOP) {
        switch (entry.team) {
            case TEAM_ENEMIES:
                return entry.color;
            case -1:
                return 10; // Adjusted return value to 10
            default:
                if (
                    room.gameMode[0] === "2" ||
                    room.gameMode[0] === "3" ||
                    room.gameMode[0] === "4"
                )
                    return entry.color;
                return 1; // Default return value if conditions are not met
        }
    }
    else if (c.BETA_SERVER) {
        switch (entry.team) {
            case TEAM_ENEMIES:
                return entry.color;
            case -1:
                return 10; // Adjusted return value to 10
            default:
                if (
                    room.gameMode[0] === "2" ||
                    room.gameMode[0] === "3" ||
                    room.gameMode[0] === "4"
                )
                    return entry.color;
                return 1; // Default return value if conditions are not met
        }
    }
    else if (c.SPECIAL_BOSS_SPAWNS) {
        switch (entry.team) {
            case TEAM_ENEMIES:
                return entry.color;
            case -1:
                return 10; // Adjusted return value to 10
            default:
                if (
                    room.gameMode[0] === "2" ||
                    room.gameMode[0] === "3" ||
                    room.gameMode[0] === "4"
                )
                    return entry.color;
                return 1; // Default return value if conditions are not met
        }
    } else {
        // Logic for other loops
        switch (entry.team) {
            case TEAM_ENEMIES:
                return entry.color;
            case -2:
                return 11;
            case -4:
                return 15;
            default:
                if (
                    room.gameMode[0] === "2" ||
                    room.gameMode[0] === "3" ||
                    room.gameMode[0] === "4"
                )
                    return entry.color;
                return 11;
        }
    }
}




// Delta Calculator
const Delta = class {
    constructor(dataLength, finder) {
        this.dataLength = dataLength;
        this.finder = finder;
        this.now = finder();
    }
    update() {
        let old = this.now;
        let now = this.finder();
        this.now = now;
        let oldIndex = 0;
        let nowIndex = 0;
        let updates = [];
        let updatesLength = 0;
        let deletes = [];
        let deletesLength = 0;
        while (oldIndex < old.length && nowIndex < now.length) {
            let oldElement = old[oldIndex];
            let nowElement = now[nowIndex];
            if (oldElement.id === nowElement.id) {
                // update
                nowIndex++;
                oldIndex++;
                let updated = false;
                for (let i = 0; i < this.dataLength; i++)
                    if (oldElement.data[i] !== nowElement.data[i]) {
                        updated = true;
                        break;
                    }
                if (updated) {
                    updates.push(nowElement.id, ...nowElement.data);
                    updatesLength++;
                }
            } else if (oldElement.id < nowElement.id) {
                // delete
                deletes.push(oldElement.id);
                deletesLength++;
                oldIndex++;
            } else {
                // create
                updates.push(nowElement.id, ...nowElement.data);
                updatesLength++;
                nowIndex++;
            }
        }
        for (let i = oldIndex; i < old.length; i++) {
            deletes.push(old[i].id);
            deletesLength++;
        }
        for (let i = nowIndex; i < now.length; i++) {
            updates.push(now[i].id, ...now[i].data);
            updatesLength++;
        }
        let reset = [0, now.length];
        for (let element of now) reset.push(element.id, ...element.data);
        let update = [deletesLength, ...deletes, updatesLength, ...updates];
        return { reset, update };
    }
};

// Deltas
let minimapAll = new Delta(5, () => {
    let all = [];
    for (let my of entities) {
        if (my.alwaysShowOnMinimap ||
            (my.type === "wall" && my.alpha > 0.2) ||
            my.type === "miniboss" ||
            my.type === "dominator" ||
            my.type === "dominatorAI" ||

            (my.type === "tank" && my.lifetime) ||
            my.isMothership ||
            my.isMothership1
        ) {
            all.push({
                id: my.id,
                data: [
                    my.type === "wall" || my.isMothership || my.isMothership1 ? my.shape === 4 ? 2 : 1 : 0,
                    util.clamp(Math.floor((256 * my.x) / room.width), 0, 255),
                    util.clamp(Math.floor((256 * my.y) / room.height), 0, 255),
                    my.color,
                    Math.round(my.SIZE),
                ],
            });
        }
    }
    return all;
});
let teamIDs = [1, 2, 3, 4];
if (c.GROUPS) for (let i = 0; i < 100; i++) teamIDs.push(i + 5);
let minimapTeams = teamIDs.map((team) =>
    new Delta(3, () => {
        let all = [];
        for (let my of entities)
            if (my.type === "tank" && my.team === -team && my.master === my && !my.lifetime) {
                all.push({
                    id: my.id,
                    data: [
                        util.clamp(Math.floor((256 * my.x) / room.width), 0, 255),
                        util.clamp(Math.floor((256 * my.y) / room.height), 0, 255),
                        my.color,
                    ],
                });
            }
        return all;
    })
);
let leaderboard = new Delta(7, () => {
    let list = [];
    if (c.TAG)
        for (let id = 0; id < c.TEAMS; id++) {
            let team = -id - 1;
            list.push({
                id,
                skill: { score: 0 },
                index: Class.tagMode.index,
                name: getTeamName(team),
                color: getTeamColor(team),
                team
            });
        }
    for (let instance of entities) {
        if (c.MOTHERSHIP_LOOP) {
            if (instance.isMothership || instance.isMothership1) list.push(instance);
        }
        else if (c.TAG) {
            let entry = list.find((r) => r.team === instance.team);
            if (entry && (instance.isPlayer || instance.isBot))
                entry.skill.score++;
        } else {
            if (
                instance.settings.leaderboardable &&
                instance.settings.drawShape &&
                (instance.type === "tank" ||
                    instance.killCount.solo ||
                    instance.killCount.assists)
            )
                list.push(instance);
        }
    }
    let topTen = [];
    for (let i = 0; i < 10 && list.length; i++) {
        let top,
            is = 0;
        for (let j = 0; j < list.length; j++) {
            let val = list[j].skill.score;
            if (val > is) {
                is = val;
                top = j;
            }
        }
        if (is === 0) break;
        let entry = list[top];

        if (c.MOTHERSHIP_LOOP) {
            topTen.push({
                id: entry.id,
                data: [
                    c.MOTHERSHIP_LOOP ? Math.round(entry.health.amount) : Math.round(entry.skill.score),
                    entry.index,
                    entry.name,
                    entry.color,
                    getBarColor(entry),
                    entry.nameColor || "#FFFFFF",
                    "HP",
                ],
            })
        } else {
                topTen.push({
                    id: entry.id,
                    data: [
                        c.MOTHERSHIP_LOOP ? Math.round(entry.health.amount) : Math.round(entry.skill.score),
                        entry.index,
                        entry.name,
                        entry.color,
                        getBarColor(entry),
                        entry.nameColor || "#FFFFFF",
                        entry.label,
                    ],
                });
            }
            list.splice(top, 1);
        }
    room.topPlayerID = topTen.length ? topTen[0].id : -1;
    return topTen.sort((a, b) => a.id - b.id);
});


// Periodically give out updates
let subscribers = [];
setInterval(() => {
    logs.minimap.set();
    let minimapUpdate = minimapAll.update();
    let minimapTeamUpdates = minimapTeams.map((r) => r.update());
    let leaderboardUpdate = leaderboard.update();
    for (let socket of subscribers) {
        if (!socket.status.hasSpawned) continue;
        let team = minimapTeamUpdates[socket.player.team - 1];
        if (socket.status.needsNewBroadcast) {
            socket.talk("b", ...minimapUpdate.reset, ...(team ? team.reset : [0, 0]), ...(socket.anon ? [0, 0] : leaderboardUpdate.reset));
            socket.status.needsNewBroadcast = false;
        } else {
            socket.talk("b", ...minimapUpdate.update, ...(team ? team.update : [0, 0]), ...(socket.anon ? [0, 0] : leaderboardUpdate.update));
        }
    }
    logs.minimap.mark();
    let time = util.time();
    for (let socket of clients) {
        if (socket.timeout.check(time)){              
            socket.talk('$');
            socket.terminate();
            return 0;
        }
        if (time - socket.statuslastHeartbeat > c.maxHeartbeatInterval) socket.kick("Lost heartbeat.");
    }
}, 250);

// Make a function that will send out minimap
// and leaderboard updates. We'll also start
// the mm/lb updating loop here. It runs at 1Hz
// and also kicks inactive sockets
const broadcast = {
    subscribe: socket => subscribers.push(socket),
    unsubscribe: socket => {
        let i = subscribers.indexOf(socket);
        if (i !== -1) util.remove(subscribers, i);
    },
};
let lastTime = 0;

const sockets = {
    players: players,
    clients: clients,
    disconnections: disconnections,
    broadcast: (message) => {
        for (let i = 0; i < clients.length; i++) {
            clients[i].talk("m", message);
        }
    },
    broadcastRoom: () => {
        for (let i = 0; i < clients.length; i++) {
            clients[i].talk("r", room.width, room.height, JSON.stringify(c.ROOM_SETUP));
        }
    },
    connect: (socket, req) => {
        // This function initalizes the socket upon connection
        if (Date.now() - lastTime < 250) return socket.terminate();
        lastTime = Date.now();

        // Get information about the new connection and verify it
        util.log("A client is trying to connect...");

        // Set it up
        socket.binaryType = "arraybuffer";
        socket.key = "";
        socket.player = { camera: {} };
        socket.spectateEntity = null;
        socket.onerror = () => {};
        let mem = 0;
        let timer = 0;
        socket.timeout = {
            check: (time) => timer && time - timer > c.maxHeartbeatInterval,
            set: (val) => {
                if (mem !== val) {
                    mem = val;
                    timer = util.time();
                }
            },
        };
        socket.awaiting = {};
        socket.awaitResponse = function (options, callback) {
            socket.awaiting[options.packet] = {
                callback: callback,
                timeout: setTimeout(() => {
                    console.log("Socket did not respond to the eval packet, kicking...");
                    socket.kick("Did not comply with the server's protocol.");
                }, options.timeout),
            };
        };
        socket.resolveResponse = function (id, packet) {
            if (socket.awaiting[id]) {
                clearTimeout(socket.awaiting[id].timeout);
                socket.awaiting[id].callback(packet);
                return true;
            }
            return false;
        };
        // Set up the status container
        socket.status = {
            verified: false,
            receiving: 0,
            deceased: true,
            requests: 0,
            hasSpawned: false,
            needsFullMap: true,
            needsNewBroadcast: true,
            lastHeartbeat: util.time(),
        };
        // Set up loops
        let nextUpdateCall = null; // has to be started manually
        let trafficMonitoring = setInterval(() => traffic(socket), 1500);
        broadcast.subscribe(socket);
        socket.loops = {
            setUpdate: (timeout) => {
                nextUpdateCall = timeout;
            },
            cancelUpdate: () => {
                clearTimeout(nextUpdateCall);
            },
            terminate: () => {
                clearTimeout(nextUpdateCall);
                clearTimeout(trafficMonitoring);
                broadcast.unsubscribe(socket);
            },
        };
        // Set up the camera
        socket.camera = {
            x: undefined,
            y: undefined,
            vx: 0,
            vy: 0,
            lastUpdate: util.time(),
            lastDowndate: undefined,
            fov: 2000,
        };
        // Set up the viewer
        socket.makeView = () => {
            socket.view = eyes(socket);
        };
        socket.makeView();
        // Put the fundamental functions in the socket
        socket.kick = (reason) => kick(socket, reason);


    


        socket.talk = (...message) => {
            if (socket.readyState === socket.OPEN) {
                socket.send(protocol.encode(message), { binary: true });
            }
        };
        socket.lastWords = (...message) => {
            if (socket.readyState === socket.OPEN) {
                socket.send(protocol.encode(message), { binary: true }, () => setTimeout(() => socket.close()));
            }
        };
        // Put the player functions in the socket
        socket.spawn = (name) => spawn(socket, name);
        socket.on("message", message => incoming(message, socket));
        socket.on("close", () => {
            socket.loops.terminate();
            close(socket);
        });
        socket.on("error", (e) => {
            util.log("[ERROR]:");
            util.error(e);
        });
        
        //account for proxies
        //very simplified reimplementation of what the forwarded-for npm package does
        let store = req.headers['fastly-client-ip'] || req.headers['x-forwarded-for'] || req.headers['z-forwarded-for'] ||
                    req.headers['forwarded']        || req.headers['x-real-ip']       || req.connection.remoteAddress,
            ips = store.split(',');
        if (!ips) {
            return socket.kick("Missing IP: " + store);
        }

        for (let i = 0; i < ips.length; i++) {
            if (net.isIPv6(ips[i])) {
                ips[i] = ips[i].trim();
            } else {
                ips[i] = ips[i].split(':')[0].trim();
            }
            if (!net.isIP(ips[i])) {
                return socket.kick("Invalid IP(s): " + store);
            }
        }

        socket.ip = ips[0];


        // Log it
        clients.push(socket);
        util.log("[INFO] New socket opened with ip " + socket.ip);
    }
};
module.exports = { sockets, chatLoop };
