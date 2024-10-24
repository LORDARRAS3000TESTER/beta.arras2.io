/* jshint esversion: 11 */

import { util } from "./lib/util.js";
import { global } from "./lib/global.js";
import { settings } from "./lib/settings.js";
import { Canvas } from "./lib/canvas.js";
import { color } from "./lib/color.js";
import { gameDraw } from "./lib/gameDraw.js";
import * as socketStuff from "./lib/socketInit.js";
(async function (util, global, settings, Canvas, color, gameDraw, socketStuff) {

    let { socketInit, gui, leaderboard, minimap, moveCompensation, lag, getNow } = socketStuff;
    // fetch("changelog.md", { cache: "no-cache" })
    // .then((response) => response.text())
    // .then((response) => {
    //     const changelogs = response.split("\n\n").map((changelog) => changelog.split("\n"));
    //     for (let changelog of changelogs) {
    //         changelog[0] = changelog[0].split(":").map((line) => line.trim());
    //         document.getElementById("patchNotes").innerHTML += `<div><b>${changelog[0][0].slice(1).trim()}</b>: ${changelog[0].slice(1).join(":") || "Update lol"}<ul>${changelog.slice(1).map((line) => `<li>${line.slice(1).trim()}</li>`).join("")}</ul><hr></div>`;
    //     }
    // });

    fetch("changelog.html", { cache: "no-cache" })
        .then(async ChangelogsHTMLFile => {
            let patchNotes = document.querySelector("#patchNotes");
            try {
                let parser = new DOMParser(),
                    RawHTMLString = await ChangelogsHTMLFile.text(),
                    ParsedHTML = parser.parseFromString(RawHTMLString, "text/html"),
                    titles = ParsedHTML.documentElement.getElementsByTagName('h1');
                for (const title of titles) {
                    title.classList.add('title');
                }

                patchNotes.innerHTML += ParsedHTML.documentElement.innerHTML;
            } catch (error) {
                patchNotes.innerHTML = `<p>An error occured while trying to fetch 'changelogs.html'</p><p>${error}</p>`;
                console.error(error);
            }
        });

    fetch("info.html", { cache: "no-cache" }).then(r => r.text()).then(info => document.getElementById("tabRulesAndInfo").innerHTML = info);
    fetch("faq.html", { cache: "no-cache" }).then(r => r.text()).then(faq => document.getElementById("tabGuideAndFaq").innerHTML = faq);

    const loginBtn = document.getElementById("discordLoginBtn"),
        logoutBtn = document.getElementById("discordLogoutBtn"),
        loginBtnImg = loginBtn.firstElementChild,
        loginBtnText = loginBtn.lastElementChild;
    let loggedInDiscord = false;
    let i = 0;
    loginBtn.addEventListener("click", () => {
        if (loggedInDiscord) {
            logoutBtn.style.visibility = logoutBtn.style.visibility === "visible" ? "hidden" : "visible";
            if (++i === 20) document.getElementById("gameLogo").classList.add("enabled");
        }
        else window.location = "/api/discord/login";
    });
    logoutBtn.addEventListener("click", () => {
        window.location = "/api/discord/logout";
    });

    fetch("/api/discord/loggedIn").then(response => response.json()).then(loggedIn => {
        loggedInDiscord = loggedIn;
        if (loggedInDiscord) {
            fetch("/api/discord/loginInfo").then(response => response.json()).then(loginInfo => {
                loginBtnText.innerText = `Logged in as ${loginInfo.username}`;
                loginBtn.classList.add("loggedIn");
                if (loginInfo.theme) document.body.classList.add(loginInfo.theme);
                switch (loginInfo.theme) {
                    case "shiny":
                        document.getElementById("gameLogo").src = "/assets/shinyLogo.png";
                        break;
                }
                loginBtnImg.addEventListener("load", () => {
                    loginBtn.style.visibility = "visible";
                });
                loginBtnImg.src = loginInfo.avatarURL;
            }).catch(console.error);
        }
        else {
            loginBtnText.innerText = "Login with Discord";
            loginBtn.style.visibility = "visible";
        }
    }).catch(console.error);

    window.getSubscriber = function () {
        let subBtn = document.getElementById("subscriberBtn");
        let text = subBtn.innerText;
        localStorage.setItem("subscriber", "true");
        global.subscriber = true;
        alert("Special tanks activated! Do not hesitate to subscribe to YanisDiss!");
        window.open("https://www.youtube.com/@YanisDiss2?sub_confirmation=1", '_blank');
        subBtn.innerText = "Activated!";
        setTimeout(() => {
            subBtn.innerText = text;
        }, 15000);
    }

    class Animation {
        constructor(start, to, smoothness = 0.05) {
            this.start = start;
            this.to = to;
            this.value = start;
            this.smoothness = smoothness;
        }
        reset() {
            this.value = this.start;
            return this.value;
        }
        getLerp() {
            this.value = util.lerp(this.value, this.to, this.smoothness, true);
            return this.value;
        }
        getNoLerp() {
            this.value = this.to;
            return this.value;
        }
        get() {
            return settings.graphical.fancyAnimations ? this.getLerp() : this.getNoLerp();
        }
        flip() {
            const start = this.to;
            const to = this.start;
            this.start = start;
            this.to = to;
        }
        goodEnough(val = 0.5) {
            return Math.abs(this.to - this.value) < val;
        }
    }
    let controls = document.getElementById("controlSettings"),
        resetButton = document.getElementById("resetControls"),
        moreControls = document.getElementById("moreControls"),
        moreControlsLength = null,
        selectedElement = null,
        controlsArray = [],
        defaultKeybinds = {},
        keybinds = {},
        animations = window.animations = {
            connecting: new Animation(1, 0),
            disconnected: new Animation(1, 0),
            deathScreen: new Animation(1, 0),
            error: new Animation(1, 0),
        };

    // Mockup functions
    // Prepare stuff
    global.player = {
        //Set up the player
        id: -1,
        x: global.screenWidth / 2,
        y: global.screenHeight / 2,
        vx: 0,
        vy: 0,
        cx: 0,
        cy: 0,
        renderx: global.screenWidth / 2,
        rendery: global.screenHeight / 2,
        isScoping: false,
        screenx: 0,
        screeny: 0,
        renderv: 1,
        slip: 0,
        view: 1,
        time: 0,
        screenWidth: global.screenWidth,
        screenHeight: global.screenHeight,
        nameColor: "#ffffff",
    };
    var upgradeSpin = 0,
        lastPing = 0,
        renderTimes = 0;
    global.clearUpgrades = () => gui.upgrades = [];
    // Build the leaderboard object
    global.player = global.player;
    global.canUpgrade = false;
    global.canSkill = false;
    global.subscriber = localStorage.getItem("subscriber") === "true";
    if (!global.subscriber && localStorage.getItem("playerKeyInputValue") === "Thanks4Subbing2YanisDissOnYT!1!1") getSubscriber();
    global.message = "";
    global.errormessage = ""; // this is for when the client crashes and shows the error.
    global.connectingmsg = "Connecting...";
    global.disconnectedmsg = "Disconnected";
    global.tips = [
        "Tip: You can have the shield and health bar be separated by going to the options menu.",
        "If you behave like a bad player or being toxic you can be punished.",
        "ArrasDiss is growing up! thank you for the support!",
        "Want to play ArrasDiss in mobile? of course! just go to arrasdiss.xyz on mobile!",
        "If you hack like multibox or breaking the system, you can be banned.",
        "Lagging constantly? Try the /clear command!",
        "Tip: If arras is having a low frame rate, you can try enabling low graphics in the options menu.",
        "Tip: You can make traps rounded with the classic trap setting in the options menu.",
        "Tip: You can get FREE new tank access by clicking the Get Token button on the main menu.",
        "Tip: If you are on PC, you can press Enter to chat.",
        "Tip: you can see all keybinds in the options menu.",
        "well, good job, you found a not so rare message.",
        "POV: You are connecting.",
        "Tip: You can join ArrasDiss discord by going in the options menu.",
        "Feeling lonely ? Go in the Discord, ask people to join you !",
        "OMG, you found the SUPER RARE mesage !!! QUICK! SCREENSHOT IT !!!!!!!!!!!",
        "Does anybody even read this ?",
        "Causing heavy lag may have consequences.",
    ][Math.floor(Math.random() * 18)];
    global.time = 0;
    // Window setup <3
    global.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    var serverName = "Connected";
    var provider = "Unknown";
    (function () {


        // Do screen size adjustment
        let element = document.getElementById("mainWrapper");
        let scalval = 130; ///Android|webOS|iPhone|iPad|iPod|BlackBerry|android|mobi/i.test(navigator.userAgent) ? 150 : 120;
        function adjust() {
            if (navigator.userAgent.search("Firefox") === -1) element.style.zoom = `${Math.round(Math.min(window.innerWidth / 1920, window.innerHeight / 1080) * scalval)}%`;
        }
        setInterval(adjust, 25);
        adjust();

    })();
    function getKeybinds() {
        let kb = localStorage.getItem("keybinds");
        keybinds = typeof kb === "string" && kb.startsWith("{") ? JSON.parse(kb) : {};
    }
    function setKeybinds() {
        localStorage.setItem("keybinds", JSON.stringify(keybinds));
    }
    function unselectElement() {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
        selectedElement.element.parentNode.parentNode.classList.remove("editing");
        selectedElement = null;
    }
    function selectElement(element) {
        selectedElement = element;
        selectedElement.element.parentNode.parentNode.classList.add("editing");
        if (selectedElement.keyCode !== -1 && window.getSelection) {
            let selection = window.getSelection();
            selection.removeAllRanges();
            let range = document.createRange();
            range.selectNodeContents(selectedElement.element);
            selection.addRange(range);
        }
    }
    function setKeybind(key, keyCode) {
        selectedElement.element.parentNode.parentNode.classList.remove("editing");
        resetButton.classList.add("active");
        if (keyCode !== selectedElement.keyCode) {
            let otherElement = controlsArray.find(c => c.keyCode === keyCode);
            if (keyCode !== -1 && otherElement) {
                otherElement.keyName = selectedElement.keyName;
                otherElement.element.innerText = selectedElement.keyName;
                otherElement.keyCode = selectedElement.keyCode;
                global.keys[otherElement.keyId] = selectedElement.keyCode;
                keybinds[otherElement.keyId] = [selectedElement.keyName, selectedElement.keyCode];
            }
        }
        selectedElement.keyName = key;
        selectedElement.element.innerText = key;
        selectedElement.keyCode = keyCode;
        global.keys[selectedElement.keyId] = keyCode;
        keybinds[selectedElement.keyId] = [key, keyCode];
        setKeybinds();
    }
    function getElements(kb, storeInDefault) {
        for (let row of controls.rows) {
            for (let cell of row.cells) {
                let element = cell.firstElementChild.firstElementChild;
                if (!element) continue;
                let key = element.dataset.key;
                if (storeInDefault) defaultKeybinds[key] = [element.innerText, global.keys[key]];
                if (kb[key]) {
                    element.innerText = kb[key][0];
                    global.keys[key] = kb[key][1];
                    resetButton.classList.add("active");
                }
                let obj = {
                    element,
                    keyId: key,
                    keyName: element.innerText,
                    keyCode: global.keys[key]
                };
                controlsArray.push(obj);
            }
        }
    }
    window.onload = async () => {
        /*  window.serverAdd = (await (await fetch("/serverData.json")).json()).ip; // originial.
          if (Array.isArray(window.serverAdd)) {
              window.isMultiserver = true;
              const servers = window.serverAdd;
              let serverSelector = document.getElementById("serverSelector"),
                  tbody = document.createElement("tbody");
              serverSelector.style.display = "block";
              document.getElementById("startMenuSlidingContent").removeChild(document.getElementById("serverName"));
              serverSelector.classList.add("serverSelector");
              serverSelector.classList.add("shadowscroll");
              serverSelector.appendChild(tbody);
              let myServer = {
                  classList: {
                      contains: () => false,
                  },
              };
              for (let server of servers) {
                  try {
                      const tr = document.createElement("tr");
                      const td = document.createElement("td");
                      td.textContent = `${server.gameMode} | ${server.players} Players`;
                      td.onclick = () => {
                          if (myServer.classList.contains("selected")) {
                              myServer.classList.remove("selected");
                          }
                          tr.classList.add("selected");
                          myServer = tr;
                          window.serverAdd = server.ip;
                         // getMockups();
                      };
                      tr.appendChild(td);
                      tbody.appendChild(tr);
                      myServer = tr;
                  } catch (e) {
                      console.log(e);
                  }
              }
              if (Array.from(myServer.children)[0].onclick) {
                  Array.from(myServer.children)[0].onclick();
              }
          } else {
            //  getMockups();
              util.pullJSON("gamemodeData").then((json) => {
                  document.getElementById("serverName").innerHTML = `<h4 class="nopadding">${json.gameMode} | ${json.players} Players</h4>`;
              });
          }
          */
        let additionalServers = [{
            id: "x",
            gamemode: "Private",
            players: "?",
            location: "Local",
            domain: "localhost",
            port: "26301",
            hidden: true
        }];
        const serverData = await (await fetch("/api/servers")).json(); // Get the serverJson.json data.
        window.serverAdd = serverData[0].ip; // get all ips
        let servers = serverData; // define it.
        servers.unshift(...additionalServers);
        global.servers = servers;
        let serverSelector = document.getElementById("serverSelector"),
            tbody = document.createElement("tbody");
        serverSelector.appendChild(tbody); // appear it.
        let myServer = {
            classList: {
                contains: () => true,
            },
        };
        let hashId = location.hash.slice(1);
        if (hashId.startsWith("url=")) {
            let url = hashId.split("=")[1].split(":");
            let x = additionalServers.find(server => server.id === "x");
            x.domain = url[0];
            if (url[1]) x.port = url[1];
            hashId = "x";
        }
        if (!hashId || !servers.find(s => s.id === hashId)) hashId = localStorage.getItem("selectedServer");
        if (!hashId || !servers.find(s => s.id === hashId)) hashId = servers.find(s => !s.hidden).id;
        let serversElements = {};
        global.serversElements = {};
        servers.forEach(async (server) => {
            try {
                const tr = document.createElement("tr"); // make it.
                const td1 = document.createElement("td"); // Left text.
                td1.textContent = `${server.location}`;
                const td2 = document.createElement("td"); // middle text.
                td2.textContent = `${server.gamemode}`;
                const td3 = document.createElement("td"); // right text.
                td3.textContent = `${server.players}/30`;
                tr.appendChild(td1);
                tr.appendChild(td2); // appear all of them.
                tr.appendChild(td3);
                server.featured && tr.classList.add("featured"); // make the text yellow if its featured.
                if (server.hidden) tr.hidden = true;
                tr.onclick = (e, hashChange) => {
                    if (myServer.classList.contains("selected")) {
                        myServer.classList.remove("selected");
                        // when a server is selected in the server selector this command will activate.
                        if (!hashChange) location.hash = "#" + server.id;
                    }
                    myServer = tr;
                    if (tr.hidden) tr.hidden = false;
                    tr.classList.add("selected"), (window.serverAdd = server.domain); // change the server ip to connect.
                    if (server.domain == "localhost")
                        window.serverAdd = window.serverAdd + ":" + server.port;
                    localStorage.setItem("selectedServer", server.id);
                };
                tbody.appendChild(tr); // appear the server selector texts.
                serversElements[server.id] = tr;
                global.serversElements[server.domain] = tr;
                if (server.id === hashId) myServer = tr;
            } catch (e) {
                console.log(e); // if something happens then show it.
                alert("Failed to fetch, please reload, if it happens again, contact one of our developers at our discord server.")
            }
        });
        if (myServer.onclick) myServer.onclick(); // make it to function.
        serverSelector.style.visibility = "visible";
        window.addEventListener("hashchange", () => {
            let id = location.hash.slice(1);
            if (!id || !(id in serversElements)) return;
            let element = serversElements[id];
            if (!element.classList.contains("selected")) element.onclick(null, true);
        })
        // Save forms
        util.retrieveFromLocalStorage("playerNameInput");
        util.retrieveFromLocalStorage("optScreenshotMode");
        util.retrieveFromLocalStorage("optPredictive");
        util.retrieveFromLocalStorage("optFancy");
        util.retrieveFromLocalStorage("coloredHealthbars");
        util.retrieveFromLocalStorage("centerTank");
        util.retrieveFromLocalStorage("optColors");
        util.retrieveFromLocalStorage("optNoPointy");
        util.retrieveFromLocalStorage("optBorders");
        util.retrieveFromLocalStorage("seperatedHealthbars");
        util.retrieveFromLocalStorage("autoLevelUp");
        // Set default theme
        if (document.getElementById("optColors").value === "") {
            document.getElementById("optColors").value = "normal";
        }
        if (document.getElementById("optBorders").value === "") {
            document.getElementById("optBorders").value = "normal";
        }
        // Game start stuff
        document.getElementById("startButton").onclick = () => startGame();
        document.onkeydown = (e) => {
            if (!(global.gameStart || e.shiftKey || e.ctrlKey || e.altKey)) {
                if (selectedElement) {
                    if (1 !== e.key.length || /[0-9]/.test(e.key) || 3 === e.location) {
                        if (!("Backspace" !== e.key && "Delete" !== e.key)) {
                            setKeybind("", -1);
                        }
                    } else {
                        setKeybind(e.key.toUpperCase(), selectedElement.element.dataset.code ? e.code : e.key);
                    }
                } else if (e.key === global.keys.ENTER && !global.gameStart && !global.gameLoading) {
                    startGame();
                }
            }
        };
        window.addEventListener("resize", resizeEvent);
        resizeEvent();
        // Keybinds stuff
        getKeybinds();
        getElements(keybinds, true);
        document.addEventListener("click", event => {
            if (!global.gameStart) {
                if (selectedElement) {
                    unselectElement();
                } else {
                    let element = controlsArray.find(({ element }) => element === event.target);
                    if (element) selectElement(element);
                }
            }
        });
        resetButton.addEventListener("click", () => {
            keybinds = {};
            setKeybinds();
            controlsArray = [];
            getElements(defaultKeybinds);
            resetButton.classList.add("spin");
            setTimeout(() => {
                resetButton.classList.remove("active");
                resetButton.classList.remove("spin");
            }, 400);
        });
        moreControls.addEventListener("click", () => {
            if (moreControlsLength) {
                for (var b = 0; b < moreControlsLength.length; b++) moreControlsLength[b].classList.add("hidden");
                moreControlsLength = null;
                moreControls.classList.remove("x");
            } else {
                moreControlsLength = document.querySelectorAll("#controlSettings tr.hidden");
                for (b = 0; b < moreControlsLength.length; b++) moreControlsLength[b].classList.remove("hidden");
                moreControls.classList.add("x");
            }
        });
    };
    // Sliding between options menu.
    function toggleOptionsMenu() {
        let clicked = false,
            a = document.getElementById("startMenuSlidingTrigger"), // Trigger ID
            c = document.getElementById("optionArrow"), // Arrow
            h = document.getElementById("viewOptionText"), // Text (view options)
            u = document.getElementsByClassName("sliderHolder")[0], // Sliding.
            y = document.getElementsByClassName("slider"), // For animations things.
            toggle = () => {
                c.style.transform = c.style.webkitTransform = clicked // Rotate the arrow.
                    ? "translate(2px, -2px) rotate(45deg)"
                    : "rotate(-45deg)";
                h.innerText = clicked ? "close options" : "view options"; // Change the text.
                clicked ? u.classList.add("slided") : u.classList.remove("slided"); // Slide it up.
                y[0].style.opacity = clicked ? 0 : 1; // Fade it away.
                y[2].style.opacity = clicked ? 1 : 0; // same for this.
            };
        a.onclick = () => { // When the button is triggered, This code runs.
            clicked = !clicked;
            toggle();
        };
        return () => {
            clicked || ((clicked = !0), toggle());
        };
    };
    function changelogMenuSwitcher() {
        let buttonTabs = document.getElementById("changelogMenuTabs"),
            tabOptions = [
                document.getElementById("tabChangelog"),
                document.getElementById("tabRulesAndInfo"),
                document.getElementById("tabGuideAndFaq"),
            ];
        for (let g = 1; g < tabOptions.length; g++) {
            tabOptions[g].style.display = "none";
        }
        let e = 0;
        for (let g = 0; g < buttonTabs.children.length; g++) {
            buttonTabs.children[g].addEventListener("click", () => {
                if (e !== g) {
                    buttonTabs.children[e].classList.remove("active"); // Remove the active class
                    buttonTabs.children[g].classList.add("active"); // Add the clicked active class
                    tabOptions[e].style.display = "none"; // Dont display the old menu.
                    tabOptions[g].style.display = "block"; // Display the menu.
                    e = g;
                }
            });
        }
    }
    function resizeEvent() {
        let scale = window.devicePixelRatio;
        if (!settings.graphical.fancyAnimations) {
            scale *= 0.5;
        }
        global.screenWidth = window.innerWidth * scale;
        global.screenHeight = window.innerHeight * scale;
        c.resize(global.screenWidth, global.screenHeight);
        global.ratio = scale;
        global.screenSize = Math.min(1920, Math.max(window.innerWidth, 1280));
    }
    window.resizeEvent = resizeEvent;
    window.canvas = new Canvas();
    var c = window.canvas.cv;
    var ctx = c.getContext("2d");
    var c2 = document.createElement("canvas");
    var ctx2 = c2.getContext("2d");
    ctx2.imageSmoothingEnabled = true;
    toggleOptionsMenu();
    changelogMenuSwitcher();
    // Animation things
    function Smoothbar(value, speed, sharpness = 3, lerpValue = 0.025) {
        let time = Date.now();
        let display = value;
        let oldvalue = value;
        return {
            set: (val) => {
                if (value !== val) {
                    oldvalue = display;
                    value = val;
                    time = Date.now();
                }
            },
            get: (round = false) => {
                display = util.lerp(display, value, lerpValue);
                if (Math.abs(value - display) < 0.1 && round) display = value;
                return display;
            },
            force: (val) => {
                display = value = val;
            },
        };
    }
    global.player = {
        vx: 0,
        vy: 0,
        lastvx: 0,
        lastvy: 0,
        renderx: global.player.cx,
        rendery: global.player.cy,
        lastx: global.player.x,
        lasty: global.player.y,
        cx: 0,
        cy: 0,
        target: global.mobile ? window.canvas.target : calculateTarget(),
        name: "",
        lastUpdate: 0,
        time: 0,
        nameColor: "#ffffff",
    };
    function calculateTarget() {
        global.target.x =
            global.mouse.x * global.ratio -
            ((global.player.screenx / global.screenWidth) * window.canvas.width +
                window.canvas.width / 2);
        global.target.y =
            global.mouse.y * global.ratio -
            ((global.player.screeny / global.screenHeight) * window.canvas.height +
                window.canvas.height / 2);
        if (window.canvas.reverseDirection) {
            global.target.x *= -1;
            global.target.y *= -1;
        }
        global.target.x *= global.screenWidth / window.canvas.width;
        global.target.y *= global.screenHeight / window.canvas.height;
        if (
            settings.graphical.screenshotMode &&
            Math.abs(Math.atan2(global.target.y, global.target.x) + Math.PI / 2) <
            0.035
        )
            global.target.x = 0;
        return global.target;
    }
    function parseTheme(string) {
        // Decode from base64
        try {
            let stripped = string.replace(/\s+/g, '');
            if (stripped.length % 4 == 2)
                stripped += '==';
            else if (stripped.length % 4 == 3)
                stripped += '=';
            let data = atob(stripped);

            let name = 'Unknown Theme',
                author = '';
            let index = data.indexOf('\x00');
            if (index === -1) return null;
            name = data.slice(0, index) || name;
            data = data.slice(index + 1);
            index = data.indexOf('\x00');
            if (index === -1) return null;
            author = data.slice(0, index) || author;
            data = data.slice(index + 1);
            let border = data.charCodeAt(0) / 0xff;
            data = data.slice(1);
            let paletteSize = Math.floor(data.length / 3);
            if (paletteSize < 2) return null;
            let colorArray = [];
            for (let i = 0; i < paletteSize; i++) {
                let red = data.charCodeAt(i * 3)
                let green = data.charCodeAt(i * 3 + 1)
                let blue = data.charCodeAt(i * 3 + 2)
                let color = (red << 16) | (green << 8) | blue
                colorArray.push('#' + color.toString(16).padStart(6, '0'))
            }
            let content = {
                teal: colorArray[0],
                lgreen: colorArray[1],
                orange: colorArray[2],
                yellow: colorArray[3],
                lavender: colorArray[4],
                pink: colorArray[5],
                vlgrey: colorArray[6],
                lgrey: colorArray[7],
                guiwhite: colorArray[8],
                black: colorArray[9],

                blue: colorArray[10],
                green: colorArray[11],
                red: colorArray[12],
                gold: colorArray[13],
                purple: colorArray[14],
                magenta: colorArray[15],
                grey: colorArray[16],
                dgrey: colorArray[17],
                white: colorArray[18],
                guiblack: colorArray[19],

                paletteSize,
                border,
            }
            return { name, author, content };
        } catch (e) { }

        // Decode from JSON
        try {
            let output = JSON.parse(string);
            if (typeof output !== 'object')
                return null;
            let { name = 'Unknown Theme', author = '', content } = output;

            for (let colorHex of [
                content.teal,
                content.lgreen,
                content.orange,
                content.yellow,
                content.lavender,
                content.pink,
                content.vlgrey,
                content.lgrey,
                content.guiwhite,
                content.black,

                content.blue,
                content.green,
                content.red,
                content.gold,
                content.purple,
                content.magenta,
                content.grey,
                content.dgrey,
                content.white,
                content.guiblack,
            ]) {
                if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) return null;
            }

            return {
                name: (typeof name === 'string' && name) || 'Unknown Theme',
                author: (typeof author === 'string' && author) || '',
                content,
            }
        } catch (e) { }

        return null;
    }
    // This starts the game and sets up the websocket
    function startGame() {
        // Set flag
        global.gameLoading = true;
        console.log('Started connecting.')
        // Get options
        util.submitToLocalStorage("optFancy");
        util.submitToLocalStorage("centerTank");
        util.submitToLocalStorage("optBorders");
        util.submitToLocalStorage("optNoPointy");
        util.submitToLocalStorage("autoLevelUp");
        util.submitToLocalStorage("optPredictive");
        util.submitToLocalStorage("optScreenshotMode");
        util.submitToLocalStorage("coloredHealthbars");
        util.submitToLocalStorage("seperatedHealthbars");
        settings.graphical.fancyAnimations = !document.getElementById("optFancy").checked;
        settings.graphical.centerTank = document.getElementById("centerTank").checked;
        settings.graphical.pointy = !document.getElementById("optNoPointy").checked;
        settings.game.autoLevelUp = document.getElementById("autoLevelUp").checked;
        settings.lag.unresponsive = document.getElementById("optPredictive").checked;
        settings.graphical.screenshotMode = document.getElementById("optScreenshotMode").checked;
        settings.graphical.coloredHealthbars = document.getElementById("coloredHealthbars").checked;
        settings.graphical.seperatedHealthbars = document.getElementById("seperatedHealthbars").checked;
        switch (document.getElementById("optBorders").value) {
            case "normal":
                settings.graphical.darkBorders = settings.graphical.neon = false;
                break;
            case "dark":
                settings.graphical.darkBorders = true;
                settings.graphical.neon = false;
                break;
            case "glass":
                settings.graphical.darkBorders = false;
                settings.graphical.neon = true;
                break;
            case "neon":
                settings.graphical.darkBorders = settings.graphical.neon = true;
                break;
        }
        util.submitToLocalStorage("optColors");
        let a = document.getElementById("optColors").value;
        color = color[a === "" ? "normal" : a];
        gameDraw.color = color;
        // Other more important stuff
        let playerNameInput = document.getElementById("playerNameInput");
        // Name
        util.submitToLocalStorage("playerNameInput");
        global.playerName = global.player.name = playerNameInput.value;
        // Change the screen
        global.screenWidth = window.innerWidth;
        global.screenHeight = window.innerHeight;
        document.getElementById("startMenuWrapper").style.top = "-1000px";
        document.getElementById("gameAreaWrapper").style.opacity = 1;
        setTimeout(() => {
            document.getElementById("startMenuWrapper").style.display = "none";
        }, 1000)
        document.getElementById("discordLoginBtn").style.display = "none";
        document.getElementById("discordLogoutBtn").style.display = "none";
        // Set up the socket
        if (!global.socket) {
            global.socket = socketInit(26301);
        }
        if (!global.animLoopHandle) {
            animloop();
        }
        window.canvas.socket = global.socket;
        setInterval(() => moveCompensation.iterate(global.socket.cmd.getMotion()), 1000 / 30);
        document.getElementById("gameCanvas").focus();
        window.onbeforeunload = () => true;
    }
    // Background clearing
    function clearScreen(clearColor, alpha) {
        ctx.fillStyle = clearColor;
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx.globalAlpha = 1;
    }
    // Text functions
    function arrayifyText(rawText) {
        //we want people to be able to use the section sign in writing too
        // string with double §           txt   col   txt                      txt
        // "...§text§§text§..." => [..., "text", "", "text", ...] => [..., "text§text", ...]
        // this code is balanced on tight threads, holy shit
        let textArrayRaw = rawText.split('§'),
            textArray = [];
        if (!(textArrayRaw.length & 1)) {
            textArrayRaw.unshift('');
        }
        while (textArrayRaw.length) {
            let first = textArrayRaw.shift();
            if (!textArrayRaw.length) {
                textArray.push(first);
            } else if (textArrayRaw[1]) {
                textArray.push(first, textArrayRaw.shift());
            } else {
                textArrayRaw.shift();
                textArray.push(first + '§' + textArrayRaw.shift(), textArrayRaw.shift());
            }
        }
        return textArray;
    }
    const measureText = (text, fontSize, withHeight = false) => {
        fontSize += settings.graphical.fontSizeBoost;
        ctx.font = "bold " + fontSize + "px Ubuntu";
        let measurement = ctx.measureText(arrayifyText(text).reduce((a, b, i) => (i & 1) ? a : a + b, ''));
        return withHeight ? { width: measurement.width, height: fontSize } : measurement.width;
    };
    function splitTextIntoLines(text, startFontSize, maxWidth, maxHeight, lineSpacing) {
        let lines = [];
        let fontSize = startFontSize;
        let linesHeight;

        while (true) {
            let words = text.split(" ");
            let line = "";

            while (words.length > 0) {
                let newlineIndex = words[0].indexOf("\n");
                if (newlineIndex !== -1) {
                    line += words[0].slice(0, newlineIndex);
                    lines.push(line);
                    line = "";
                    words[0] = words[0].slice(newlineIndex + 1);
                } else {
                    let testLine = line + words[0] + " ";
                    let textWidth = measureText(testLine, fontSize);
                    if (textWidth > maxWidth && line !== "") {
                        lines.push(line);
                        line = "";
                    } else {
                        line = testLine;
                        words.shift();
                    }
                }
            }

            if (line !== '') lines.push(line);

            let lineHeight = fontSize * (1 + lineSpacing);
            linesHeight = lines.length * lineHeight;

            if (linesHeight <= maxHeight) break;
            else {
                fontSize--;
                lines = [];
            }
        }

        return { lines, fontSize, height: linesHeight };
    }
    function drawText(rawText, x, y, size, defaultFillStyle, align = "left", center = false, fade = 1, stroke = true, context = ctx) {
        size += settings.graphical.fontSizeBoost;
        // Get text dimensions and resize/reset the canvas
        let offset = size / 5,
            ratio = 1,
            textArray = arrayifyText(rawText),
            renderedFullText = textArray.reduce((a, b, i) => (i & 1) ? a : a + b, '');
        if (context.getTransform) {
            ratio = ctx.getTransform().d;
            offset *= ratio;
        }
        if (ratio !== 1) {
            size *= ratio;
        }
        context.font = "bold " + size + "px Ubuntu";
        let Xoffset = offset,
            Yoffset = (size + 2 * offset) / 2,
            alignMultiplier = 0;
        switch (align) {
            //case "left":
            //    //do nothing.
            //    break;
            case "center":
                alignMultiplier = 0.5;
                break;
            case "right":
                alignMultiplier = 1;
        }
        if (alignMultiplier) {
            Xoffset -= ctx.measureText(renderedFullText).width * alignMultiplier;
        }
        // Draw it
        context.lineWidth = (size + 1) / settings.graphical.fontStrokeRatio;
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.strokeStyle = color.black;
        context.fillStyle = defaultFillStyle;
        context.save();
        context.lineCap = settings.graphical.miterText ? "miter" : "round";
        context.lineJoin = settings.graphical.miterText ? "miter" : "round";
        if (ratio !== 1) {
            context.scale(1 / ratio, 1 / ratio);
        }
        Xoffset += x * ratio - size / 4; //this extra size-dependant margin is a guess lol // apparently this guess worked out to be a hella good one
        Yoffset += y * ratio - Yoffset * (center ? 1.05 : 1.5);
        if (stroke) {
            context.strokeText(renderedFullText, Xoffset, Yoffset);
        }
        for (let i = 0; i < textArray.length; i++) {
            let str = textArray[i];

            // odd index = this is a color to set the fill style to
            if (i & 1) {

                //reset color to default
                if (str === "reset") {
                    context.fillStyle = defaultFillStyle;
                } else {
                    str = gameDraw.getColor(str) ?? str;
                }
                context.fillStyle = str;

            } else {
                // move forward a bit taking the width of the last piece of text + "kerning" between
                // the last letter of last text and the first letter of current text,
                // making it align perfectly with what we drew with strokeText earlier
                if (i) {
                    Xoffset += ctx.measureText(textArray[i - 2] + str).width - ctx.measureText(str).width;
                }
                context.fillText(str, Xoffset, Yoffset);
            }
        }
        context.restore();
    }
    // Gui drawing functions
    function drawGuiRect(x, y, length, height, stroke = false) {
        switch (stroke) {
            case true:
                ctx.strokeRect(x, y, length, height);
                break;
            case false:
                ctx.fillRect(x, y, length, height);
                break;
        }
    }

    function drawGuiCircle(x, y, radius, stroke = false) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (stroke) {
            ctx.stroke();
        } else {
            ctx.fill();
        }
    }

    function drawGuiLine(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.lineTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
        ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
        ctx.closePath();
        ctx.stroke();
    }

    function drawBar(x1, x2, y, width, color) {
        ctx.beginPath();
        ctx.lineTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.closePath();
        ctx.stroke();
    }

    function drawDisabled(x, y, width, height) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = color.dgrey;
        drawGuiRect(x, y, width, height);
        ctx.globalAlpha = 1;
    }

    //checking for images in the shape so we can draw them
    function isImageURL(url) {
        try {
            const parsedUrl = new URL(url);
            const path = parsedUrl.pathname;
            const ext = path.split('.').pop().toLowerCase(); // Get the lowercase file extension

            // List of common image file extensions
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

            return imageExtensions.includes(ext) || parsedUrl.protocol == 'data:';
        } catch (error) {
            return false; // URL parsing failed, or it's not an image URL.
        }
    }
    // Sub-drawing functions
    const drawPolyImgs = [];
    function drawPoly(context, centerX, centerY, radius, sides, angle = 0, borderless, fill, imageInterpolation) {
        // Start drawing
        context.beginPath();
        if (sides instanceof Array) {
            let dx = Math.cos(angle);
            let dy = Math.sin(angle);
            for (let [x, y] of sides)
                context.lineTo(
                    centerX + radius * (x * dx - y * dy),
                    centerY + radius * (y * dx + x * dy)
                );
        } else {
            if ("string" === typeof sides) {
                if (isImageURL(sides)) {
                    //ideally we'd preload images when mockups are loaded but im too lazy for that atm
                    if (!drawPolyImgs[sides]) {
                        drawPolyImgs[sides] = new Image();
                        drawPolyImgs[sides].src = sides;
                        drawPolyImgs[sides].isBroken = false;
                        drawPolyImgs[sides].onerror = function () {
                            console.log('Failed to load image!\nURL:', sides);
                            this.isBroken = true;
                        };
                    }
                    let img = drawPolyImgs[sides];
                    if (img.isBroken || !img.complete) { // check if img is broken and draw placeholder if so
                        //this is probably the worst way to draw a missing texture checkerboard but im too lazy to do a better one
                        context.translate(centerX, centerY);
                        context.rotate(angle);
                        context.beginPath();
                        context.fillStyle = '#ff00ff';
                        context.lineTo(-radius, -radius);
                        context.lineTo(radius, -radius);
                        context.lineTo(radius, radius);
                        context.lineTo(-radius, radius);
                        context.lineTo(-radius, -radius);
                        context.fill();
                        context.closePath();
                        context.beginPath();
                        context.fillStyle = '#000000';
                        context.lineTo(-radius, -radius);
                        context.lineTo(0, -radius);
                        context.lineTo(0, 0);
                        context.lineTo(0, radius);
                        context.lineTo(radius, radius);
                        context.lineTo(radius, 0);
                        context.lineTo(0, 0);
                        context.lineTo(-radius, 0);
                        context.lineTo(-radius, -radius);
                        context.fill();
                        context.closePath();
                        context.rotate(-angle);
                        context.translate(-centerX, -centerY);
                        return;
                    }
                    context.translate(centerX, centerY);
                    context.rotate(angle);
                    context.imageSmoothingEnabled = imageInterpolation;
                    context.drawImage(img, -radius, -radius, radius * 2, radius * 2);
                    context.imageSmoothingEnabled = true;
                    context.rotate(-angle);
                    context.translate(-centerX, -centerY);
                    return;
                } else {
                    let path = new Path2D(sides);
                    context.save();
                    context.translate(centerX, centerY);
                    context.scale(radius, radius);
                    context.lineWidth /= radius;
                    context.rotate(angle);
                    context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
                    if (!borderless) context.stroke(path);
                    if (fill) context.fill(path);
                    context.restore();
                    return;
                }
            }
            angle += sides % 2 ? 0 : Math.PI / sides;
        }
        if (!sides) {
            // Circle
            let fillcolor = context.fillStyle;
            let strokecolor = context.strokeStyle;
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            context.fillStyle = strokecolor;
            context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
            if (!borderless) context.stroke();
            context.closePath();
            context.beginPath();
            context.fillStyle = fillcolor;
            context.arc(centerX, centerY, radius * fill, 0, 2 * Math.PI);
            if (fill) context.fill();
            context.closePath();
            return;
        } else if (sides < 0) {
            // Star
            if (settings.graphical.pointy) context.lineJoin = "miter";
            sides = -sides;
            angle += (sides % 1) * Math.PI * 2;
            sides = Math.floor(sides);
            let dip = 1 - 6 / (sides ** 2);
            context.moveTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
            context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
            for (let i = 0; i < sides; i++) {
                let htheta = ((i + 0.5) / sides) * 2 * Math.PI + angle,
                    theta = ((i + 1) / sides) * 2 * Math.PI + angle,
                    cx = centerX + radius * dip * Math.cos(htheta),
                    cy = centerY + radius * dip * Math.sin(htheta),
                    px = centerX + radius * Math.cos(theta),
                    py = centerY + radius * Math.sin(theta);
                /*if (curvyTraps) {
                    context.quadraticCurveTo(cx, cy, px, py);
                } else {
                    context.lineTo(cx, cy);
                    context.lineTo(px, py);
                }*/
                context.quadraticCurveTo(cx, cy, px, py);
            }
        } else if (sides > 0) {
            // Polygon
            angle += (sides % 1) * Math.PI * 2;
            sides = Math.floor(sides);
            context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
            for (let i = 0; i < sides; i++) {
                let theta = (i / sides) * 2 * Math.PI + angle;
                context.lineTo(centerX + radius * Math.cos(theta), centerY + radius * Math.sin(theta));
            }
        }
        context.closePath();
        if (!borderless) context.stroke();
        if (fill) context.fill();
        context.lineJoin = "round";
    }
    function drawTrapezoid(context, x, y, length, height, aspect, angle, borderless, fill, alpha, strokeWidth, position) {
        let h = [];
        h = aspect > 0 ? [height * aspect, height] : [height, -height * aspect];

        // Construct a trapezoid at angle 0
        let points = [],
            sinT = Math.sin(angle),
            cosT = Math.cos(angle);
        points.push([-position, h[1]]);
        points.push([length * 2 - position, h[0]]);
        points.push([length * 2 - position, -h[0]]);
        points.push([-position, -h[1]]);
        context.globalAlpha = alpha;

        // Rotate it to the new angle via vector rotation
        context.beginPath();
        for (let point of points) {
            let newX = point[0] * cosT - point[1] * sinT + x,
                newY = point[0] * sinT + point[1] * cosT + y;
            context.lineTo(newX, newY);
        }
        context.closePath();
        context.lineWidth *= strokeWidth
        context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
        if (!borderless) context.stroke();
        context.lineWidth /= fill ? 1 : 0.5; // Maintain constant border width
        if (fill) context.fill();
        context.globalAlpha = 1;
    }
    const drawEntity = (baseColor, x, y, instance, ratio, alpha = 1, scale = 1, lineWidthMult = 1, rot = 0, turretsObeyRot = false, assignedContext = false, turretInfo = false, render = instance.render) => {
        let context = assignedContext ? assignedContext : ctx;
        let fade = turretInfo ? 1 : render.status.getFade(),
            drawSize = scale * ratio * instance.size,
            indexes = instance.index.split("-"),
            m = global.mockups[parseInt(indexes[0])],
            xx = x,
            yy = y,
            source = turretInfo === false ? instance : turretInfo,
            blend = render.status.getBlend(),
            initStrokeWidth = lineWidthMult * Math.max(settings.graphical.mininumBorderChunk, ratio * settings.graphical.borderChunk);
        if (!m) throw new Error(`M:${[!!turretInfo, instance.id, instance.label, instance.index, m]}`);
        source.guns.update();
        if (fade === 0 || alpha === 0) return;
        if (render.expandsWithDeath) drawSize *= 1 + 0.5 * (1 - fade);
        if (settings.graphical.fancyAnimations && assignedContext != ctx2 && (fade !== 1 || alpha !== 1)) {
            context = ctx2;
            context.canvas.width = context.canvas.height = drawSize * m.position.axis + ratio * 20;
            xx = context.canvas.width / 2 - (drawSize * m.position.axis * m.position.middle.x * Math.cos(rot)) / 4;
            yy = context.canvas.height / 2 - (drawSize * m.position.axis * m.position.middle.x * Math.sin(rot)) / 4;
        } else {
            if (fade * alpha < 0.5) return;
        }
        context.lineCap = "round";
        context.lineJoin = "round";
        context.lineWidth = initStrokeWidth

        let upperTurretsIndex = source.turrets.length;
        // Draw turrets beneath us
        for (let i = 0; i < source.turrets.length; i++) {
            let t = source.turrets[i];
            context.lineWidth = initStrokeWidth * t.strokeWidth
            t.lerpedFacing == undefined
                ? (t.lerpedFacing = t.facing)
                : (t.lerpedFacing = util.lerpAngle(t.lerpedFacing, t.facing, 0.1, true));

            // Break condition
            if (t.layer > 0) {
                upperTurretsIndex = i;
                break;
            }

            let ang = t.direction + t.angle + rot,
                len = t.offset * drawSize,
                facing;
            if (t.mirrorMasterAngle || turretsObeyRot) {
                facing = rot + t.angle;
            } else {
                facing = t.lerpedFacing;
            }
            drawEntity(baseColor, xx + len * Math.cos(ang), yy + len * Math.sin(ang), t, ratio, 1, (drawSize / ratio / t.size) * t.sizeFactor, lineWidthMult, facing, turretsObeyRot, context, t, render);
        }
        // Draw guns below us
        let positions = source.guns.getPositions(),
            gunConfig = source.guns.getConfig();
        for (let i = 0; i < source.guns.length; i++) {
            context.lineWidth = initStrokeWidth
            let g = gunConfig[i];
            if (!g.drawAbove) {
                let gx = g.offset * Math.cos(g.direction + g.angle + rot),
                    gy = g.offset * Math.sin(g.direction + g.angle + rot),
                    gunColor = g.color == null ? color.grey : gameDraw.modifyColor(g.color, baseColor),
                    alpha = g.alpha,
                    strokeWidth = g.strokeWidth,
                    strokeColor = g.strokeColor,
                    borderless = g.borderless,
                    fill = g.drawFill;
                gameDraw.setColor(context, gameDraw.mixColors(gunColor, render.status.getColor(), blend), strokeColor);
                drawTrapezoid(context, xx + drawSize * gx, yy + drawSize * gy, drawSize * g.length / 2, drawSize * g.width / 2, g.aspect, g.angle + rot, borderless, fill, alpha, strokeWidth, drawSize * positions[i]);
            }
        }
        // Draw body
        context.globalAlpha = 1;
        context.lineWidth = initStrokeWidth * m.strokeWidth
        gameDraw.setColor(context, gameDraw.mixColors(gameDraw.modifyColor(instance.color, baseColor), render.status.getColor(), blend), instance.strokeColor);

        //just so you know, the glow implimentation is REALLY bad and subject to change in the future
        context.shadowColor = m.glow.color != null ? gameDraw.modifyColor(m.glow.color) : gameDraw.mixColors(
            gameDraw.modifyColor(instance.color),
            render.status.getColor(),
            render.status.getBlend()
        );
        if (m.glow.radius && m.glow.radius > 0) {
            context.shadowBlur = m.glow.radius * ((drawSize / m.size) * m.realSize);
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.globalAlpha = m.glow.alpha;
            for (var i = 0; i < m.glow.recursion; i++) {
                drawPoly(context, xx, yy, (drawSize / m.size) * m.realSize, m.shape, rot, true, m.drawFill);
            }
            context.globalAlpha = 1;
        }
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;

        drawPoly(context, xx, yy, (drawSize / m.size) * m.realSize, m.shape, rot, instance.borderless, instance.drawFill, m.imageInterpolation);

        // Draw guns above us
        for (let i = 0; i < source.guns.length; i++) {
            context.lineWidth = initStrokeWidth
            let g = gunConfig[i];
            if (g.drawAbove) {
                let gx = g.offset * Math.cos(g.direction + g.angle + rot),
                    gy = g.offset * Math.sin(g.direction + g.angle + rot),
                    gunColor = g.color == null ? color.grey : gameDraw.modifyColor(g.color, baseColor),
                    alpha = g.alpha,
                    strokeWidth = g.strokeWidth,
                    strokeColor = g.strokeColor,
                    borderless = g.borderless,
                    fill = g.drawFill;
                gameDraw.setColor(context, gameDraw.mixColors(gunColor, render.status.getColor(), blend), strokeColor);
                drawTrapezoid(context, xx + drawSize * gx, yy + drawSize * gy, drawSize * g.length / 2, drawSize * g.width / 2, g.aspect, g.angle + rot, borderless, fill, alpha, strokeWidth, drawSize * positions[i]);
            }
        }
        // Draw turrets above us
        for (let i = upperTurretsIndex; i < source.turrets.length; i++) {
            let t = source.turrets[i];
            context.lineWidth = initStrokeWidth * t.strokeWidth
            t.lerpedFacing == undefined
                ? (t.lerpedFacing = t.facing)
                : (t.lerpedFacing = util.lerpAngle(t.lerpedFacing, t.facing, 0.1, true));
            let ang = t.direction + t.angle + rot,
                len = t.offset * drawSize,
                facing;
            if (t.mirrorMasterAngle || turretsObeyRot) {
                facing = rot + t.angle;
            } else {
                facing = t.lerpedFacing;
            }
            drawEntity(baseColor, xx + len * Math.cos(ang), yy + len * Math.sin(ang), t, ratio, 1, (drawSize / ratio / t.size) * t.sizeFactor, lineWidthMult, facing, turretsObeyRot, context, t, render);
        }
        if (assignedContext == false && context != ctx && context.canvas.width > 0 && context.canvas.height > 0) {
            ctx.save();
            ctx.globalAlpha = alpha * fade;
            ctx.imageSmoothingEnabled = true;
            //ctx.globalCompositeOperation = "overlay";
            ctx.drawImage(context.canvas, x - xx, y - yy);
            ctx.restore();
            //ctx.globalCompositeOperation = "source-over";
        }
    };
    function drawHealth(x, y, instance, ratio, alpha) {
        let fade = instance.render.status.getFade();
        ctx.globalAlpha = fade * fade;
        let size = instance.size * ratio,
            indexes = instance.index.split("-"),
            m = global.mockups[parseInt(indexes[0])],
            realSize = (size / m.size) * m.realSize;
        if (instance.drawsHealth) {
            let health = instance.render.health.get(),
                shield = instance.render.shield.get();
            if (health < 0.99 || shield < 0.99) {
                let instanceColor = instance.color.split(' ')[0];
                let getColor = true;
                if (instanceColor[0] == '#') getColor = false;
                let col = settings.graphical.coloredHealthbars ? gameDraw.mixColors(getColor ? gameDraw.getColor(instanceColor) : instanceColor, color.guiwhite, 0.5) : color.lgreen;
                let yy = y + realSize + 15 * ratio;
                let barWidth = 3 * ratio;
                ctx.globalAlpha = fade * (alpha ** 2);
                //TODO: seperate option for hp bars
                // function drawBar(x1, x2, y, width, color) {

                //background bar
                drawBar(x - size, x + size, yy + barWidth * settings.graphical.seperatedHealthbars / 2, barWidth * (1 + settings.graphical.seperatedHealthbars) + settings.graphical.barChunk, color.black);

                //hp bar
                drawBar(x - size, x - size + 2 * size * health, yy + barWidth * settings.graphical.seperatedHealthbars, barWidth, col);

                //shield bar
                if (shield || settings.graphical.seperatedHealthbars) {
                    if (!settings.graphical.seperatedHealthbars) ctx.globalAlpha = (1 + shield) * 0.3 * (alpha ** 2) * fade;
                    drawBar(x - size, x - size + 2 * size * shield, yy, barWidth, settings.graphical.coloredHealthbars ? gameDraw.mixColors(col, color.guiblack, 0.25) : color.teal);
                    ctx.globalAlpha = 1;
                }
            }
        }
        if (instance.id !== gui.playerid && instance.nameplate) {
            let index = instance.name.indexOf("\u0001");
            let name = instance.name.slice(index + 1);
            let namecolor = gameDraw.getColor(instance.name.slice(0, index));
            ctx.globalAlpha = alpha;
            drawText(name, x, y - realSize - 22 * ratio, 12 * ratio, namecolor, "center");
            drawText(typeof instance.score === "string" ? instance.score : util.handleLargeNumber(instance.score, 1), x, y - realSize - 12 * ratio, 6 * ratio, namecolor, "center");
            ctx.globalAlpha = 1;
        }
    }

    function drawEntityIcon(model, x, y, len, height, lineWidthMult, angle, alpha, colorIndex) {
        let picture = (typeof model == "object") ? model : util.getEntityImageFromMockup(model, gui.color),
            position = picture.position,
            scale = (0.6 * len) / position.axis,
            entityX = x + 0.5 * len - scale * position.middle.x * Math.cos(angle),
            entityY = y + 0.5 * height - scale * position.middle.x * Math.sin(angle),
            baseColor = picture.color;

        // Draw box
        ctx.globalAlpha = alpha;
        ctx.fillStyle = picture.upgradeColor != null ? gameDraw.getColor(picture.upgradeColor) : gameDraw.getColor((colorIndex > 18 ? colorIndex - 19 : colorIndex).toString());
        drawGuiRect(x, y, len, height);
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = picture.upgradeColor != null ? gameDraw.getColor(picture.upgradeColor) : gameDraw.getColor((colorIndex - 9).toString());
        drawGuiRect(x, y, len, height * 0.6);
        ctx.fillStyle = color.black;
        drawGuiRect(x, y + height * 0.6, len, height * 0.4);
        ctx.globalAlpha = 1;

        // Draw Tank
        drawEntity(baseColor, entityX, entityY, picture, 1, 1, scale / picture.size, lineWidthMult, angle, true);

        // Tank name
        drawText(picture.upgradeName ?? picture.name, x + len / 2, y + height * 0.94, height / 10, color.guiwhite, "center");

        ctx.strokeStyle = color.black;
        ctx.lineWidth = 3 * lineWidthMult;
        drawGuiRect(x, y, len, height, true); // Border
    }

    // Start animation
    window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || (callback => setTimeout(callback, 1000 / 60));
    window.cancelAnimFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
    // Drawing states
    const statMenu = Smoothbar(0, 0.7, 1.5, 0.1);
    const upgradeMenu = Smoothbar(0, 2, 3, 0.1);
    let builderUpgradeMenuY = 0;
    let upgradeMenuY = 0;
    // Define the graph constructor
    function graph() {
        var data = [];
        return (point, x, y, w, h, col) => {
            // Add point and push off old ones
            data.push(point);
            while (data.length > w) {
                data.splice(0, 1);
            }
            // Get scale
            let min = Math.min(...data),
                max = Math.max(...data),
                range = max - min;
            // Draw zero
            if (max > 0 && min < 0) {
                drawBar(x, x + w, y + (h * max) / range, 2, color.guiwhite);
            }
            // Draw points
            ctx.beginPath();
            let i = -1;
            for (let p of data) {
                if (!++i) {
                    ctx.moveTo(x, y + (h * (max - p)) / range);
                } else {
                    ctx.lineTo(x + i, y + (h * (max - p)) / range);
                }
            }
            ctx.lineWidth = 1;
            ctx.strokeStyle = col;
            ctx.stroke();
        };
    }
    // Protected functions
    function interpolate(p1, p2, v1, v2, ts, tt) {
        let k = Math.cos((1 + tt) * Math.PI);
        return 0.5 * (((1 + tt) * v1 + p1) * (k + 1) + (-tt * v2 + p2) * (1 - k));
    }

    function extrapolate(p1, p2, v1, v2, ts, tt) {
        return p2 + (p2 - p1) * tt;
    }
    // Useful thing
    let modulo = function (a, n) {
        return ((a % n) + n) % n;
    };
    function angleDifference(sourceA, targetA) {
        let a = targetA - sourceA;
        return modulo(a + Math.PI, 2 * Math.PI) - Math.PI;
    }
    // Lag compensation functions
    const compensation = () => {
        // Protected vars
        let t = 0,
            tt = 0,
            ts = 0;
        // Methods
        return {
            set: (
                time = global.player.time,
                interval = global.metrics.rendergap
            ) => {
                t = Math.max(getNow() - time - 80, -interval);
                if (t > 150 && t < 1000) {
                    t = 150;
                }
                if (t > 1000) {
                    t = (1000 * 1000 * Math.sin(t / 1000 - 1)) / t + 1000;
                }
                tt = t / interval;
                ts = (settings.roomSpeed * 30 * t) / 1000;
            },
            predict: (p1, p2, v1, v2) => {
                return t >= 0
                    ? extrapolate(p1, p2, v1, v2, ts, tt)
                    : interpolate(p1, p2, v1, v2, ts, tt);
            },
            predictFacing: (f1, f2) => {
                return f1 + (1 + tt) * angleDifference(f1, f2);
            },
            getPrediction: () => {
                return t;
            },
        };
    };
    // Make graphs
    const timingGraph = graph(),
        lagGraph = graph(),
        gapGraph = graph();
    // The skill bar dividers
    let skas = [];
    for (let i = 1; i <= 256; i++) { //if you want to have more skill levels than 255, then update this
        skas.push((i - 2) * 0.01 + Math.log(4 * (i / 9) + 1) / 1.6);
    }
    const ska = (x) => skas[x];
    let scaleScreenRatio = (by, unset) => {
        global.screenWidth /= by;
        global.screenHeight /= by;
        ctx.scale(by, by);
        if (!unset) ratio *= by;
    };

    let tiles,
        branches,
        tankTree,
        measureSize = (x, y, colorIndex, { index, tier = 0 }) => {
            tiles.push({ x, y, colorIndex, index });
            let { upgrades } = global.mockups[parseInt(index)],
                xStart = x,
                cumulativeWidth = 1,
                maxHeight = 1,
                hasUpgrades = [],
                noUpgrades = [];
            for (let i = 0; i < upgrades.length; i++) {
                let upgrade = upgrades[i];
                if (global.mockups[upgrade.index].upgrades.length) {
                    hasUpgrades.push(upgrade);
                } else {
                    noUpgrades.push(upgrade);
                }
            }
            for (let i = 0; i < hasUpgrades.length; i++) {
                let upgrade = hasUpgrades[i],
                    spacing = 2 * Math.max(1, upgrade.tier - tier),
                    measure = measureSize(x, y + spacing, upgrade.upgradeColor ?? 10 + i, upgrade);
                branches.push([{ x, y: y + Math.sign(i) }, { x, y: y + spacing + 1 }]);
                if (i === hasUpgrades.length - 1 && !noUpgrades.length) {
                    branches.push([{ x: xStart, y: y + 1 }, { x, y: y + 1 }]);
                }
                x += measure.width;
                cumulativeWidth += measure.width;
                if (maxHeight < measure.height) maxHeight = measure.height;
            }
            y++;
            for (let i = 0; i < noUpgrades.length; i++) {
                let upgrade = noUpgrades[i],
                    height = 2 + upgrades.length;
                measureSize(x, y + 1 + i + Math.sign(hasUpgrades.length) * 2, upgrade.upgradeColor ?? 10 + i, upgrade);
                if (i === noUpgrades.length - 1) {
                    if (hasUpgrades.length > 1) cumulativeWidth++;
                    branches.push([{ x: xStart, y }, { x, y }]);
                    branches.push([{ x, y }, { x, y: y + noUpgrades.length + Math.sign(hasUpgrades.length) * 2 }]);
                }
                if (maxHeight < height) maxHeight = height;
            }
            return {
                width: cumulativeWidth,
                height: 2 + maxHeight,
            };
        };
    function generateTankTree(indexes) {
        tiles = [];
        branches = [];
        tankTree = { width: 0, height: 0 };
        let rightestSoFar = 0;
        if (!Array.isArray(indexes)) indexes = [indexes];
        for (let index of indexes) {
            rightestSoFar += 3 + measureSize(rightestSoFar, 0, 10, { index }).width;
        }
        for (let { x, y } of tiles) {
            tankTree.width = Math.max(tankTree.width, x);
            tankTree.height = Math.max(tankTree.height, y);
        }
    }

    function drawFloor(px, py, ratio) {
        // Clear the background + draw grid
        clearScreen(color.white, 1);
        clearScreen(color.guiblack, 0.1);

        //loop through the entire room setup
        let W = global.roomSetup[0].length,
            H = global.roomSetup.length;
        for (let i = 0; i < H; i++) {

            //skip if this row is not visible
            let top = Math.max(0, (ratio * i * global.gameHeight) / H - py + global.screenHeight / 2),
                bottom = Math.min(global.screenHeight, (ratio * (i + 1) * global.gameHeight) / H - py + global.screenHeight / 2);
            if (top > global.screenHeight || bottom < 0) continue;

            //loop through tiles in this row
            let row = global.roomSetup[i];
            for (let j = 0; j < W; j++) {

                //skip if tile not visible
                let left = Math.max(0, (ratio * j * global.gameWidth) / W - px + global.screenWidth / 2),
                    right = Math.min(global.screenWidth, (ratio * (j + 1) * global.gameWidth) / W - px + global.screenWidth / 2);
                if (left > global.screenWidth || right < 0) continue;

                //draw it
                let tile = row[j];
                ctx.globalAlpha = 1;
                ctx.fillStyle = settings.graphical.screenshotMode ? color.guiwhite : color.white;
                ctx.fillRect(left, top, right - left, bottom - top);
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = settings.graphical.screenshotMode ? color.guiwhite : gameDraw.modifyColor(tile);
                ctx.fillRect(left, top, right - left, bottom - top);
            }
        }
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = settings.graphical.screenshotMode ? color.guiwhite : color.guiblack;
        ctx.globalAlpha = 0.04;
        ctx.beginPath();
        let gridsize = 30 * ratio;
        for (let x = (global.screenWidth / 2 - px) % gridsize; x < global.screenWidth; x += gridsize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, global.screenHeight);
        }
        for (let y = (global.screenHeight / 2 - py) % gridsize; y < global.screenHeight; y += gridsize) {
            ctx.moveTo(0, y);
            ctx.lineTo(global.screenWidth, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    function drawEntities(px, py, ratio) {
        // Draw things
        for (let instance of global.entities) {
            if (!instance.render.draws) {
                continue;
            }
            let motion = compensation();
            if (instance.render.status.getFade() === 1) {
                motion.set();
            } else {
                instance.x += instance.vx / 1.5;
                instance.y += instance.vy / 1.5;
                motion.set(instance.render.lastRender, instance.render.interval);
            }
            instance.render.x = util.lerp(instance.render.x, Math.round(instance.x + instance.vx), 0.1, true);
            instance.render.y = util.lerp(instance.render.y, Math.round(instance.y + instance.vy), 0.1, true);
            instance.render.f = instance.id === gui.playerid && !global.autoSpin && !instance.twiggle && !global.died ? Math.atan2(global.target.y * global.reverseTank, global.target.x * global.reverseTank) : util.lerpAngle(instance.render.f, instance.facing, 0.15, true);
            let x = ratio * instance.render.x - px,
                y = ratio * instance.render.y - py,
                baseColor = instance.color;

            if (instance.id === gui.playerid) {
                x = settings.graphical.centerTank && !global.player.isScoping ? 0 : x;
                y = settings.graphical.centerTank && !global.player.isScoping ? 0 : y;
                global.player.screenx = x;
                global.player.screeny = y;
            }
            x += global.screenWidth / 2;
            y += global.screenHeight / 2;
            drawEntity(baseColor, x, y, instance, ratio, instance.id === gui.playerid || global.showInvisible ? instance.alpha ? instance.alpha * 0.75 + 0.25 : 0.25 : instance.alpha, 1, 1, instance.render.f);
        }

        //dont draw healthbars and chat messages in screenshot mode
        if (settings.graphical.screenshotMode) return;

        //draw health bars above entities
        for (let instance of global.entities) {
            let x = instance.id === gui.playerid ? global.player.screenx : ratio * instance.render.x - px,
                y = instance.id === gui.playerid ? global.player.screeny : ratio * instance.render.y - py;
            x += global.screenWidth / 2;
            y += global.screenHeight / 2;
            drawHealth(x, y, instance, ratio, instance.alpha);
        }

        let now = Date.now(),
            ratioForChat = (1 + ratio) / 2;
        for (let instance of global.entities) {
            //put chat msg above name
            let size = instance.size * ratio,
                indexes = instance.index.split("-"),
                m = global.mockups[parseInt(indexes[0])],
                realSize = (size / m.size) * m.realSize,
                x = instance.id === gui.playerid ? 0 : ratio * instance.render.x - px,
                y = instance.id === gui.playerid ? 0 : ratio * instance.render.y - py;
            x += global.screenWidth / 2;
            y += global.screenHeight / 2 - realSize - 46 * ratio;
            if (instance.id !== gui.playerid && instance.nameplate) y -= 8 * ratio;

            //draw all the msgs
            for (let i in global.chats[instance.id]) {
                let chat = global.chats[instance.id][i],
                    text = chat.text,
                    msgLengthHalf = measureText(text, 15 * ratioForChat) / 2,
                    alpha = Math.max(0, Math.min(1000, chat.expires - now) / 1000);

                ctx.globalAlpha = 0.5 * alpha;
                drawBar(x - msgLengthHalf, x + msgLengthHalf, y, 30 * ratioForChat, gameDraw.modifyColor(instance.color));
                ctx.globalAlpha = alpha;
                settings.graphical.fontStrokeRatio *= 1.2;
                drawText(text, x, y + 7 * ratioForChat, 15 * ratioForChat, color.guiwhite, "center");
                settings.graphical.fontStrokeRatio /= 1.2;
                y -= 35 * ratioForChat;
            }
        }
    }

    global.showTree = false;
    global.scrollX = global.scrollY = global.fixedScrollX = global.fixedScrollY = -1;
    global.scrollVelocityY = global.scrollVelocityX = 0;
    let lastGuiType = null;
    function drawUpgradeTree(spacing, alcoveSize) {
        if (global.died) {
            global.showTree = false;
            global.scrollX = global.scrollY = global.fixedScrollX = global.fixedScrollY = global.scrollVelocityY = global.scrollVelocityX = 0;
            global.treeScale = 1;
            return;
        }

        if (lastGuiType != gui.type || global.generateTankTree) {
            try {
                global.missingMockup = false;
                let m = util.getEntityImageFromMockup(gui.type), // The mockup that corresponds to the player's tank
                    rootName = m.rerootUpgradeTree, // The upgrade tree root of the player's tank
                    rootIndex = [];
                for (let name of rootName) {
                    let mockup = global.mockups.find(i => i && i.className === name);
                    let ind = name == undefined || !mockup ? -1 : mockup.index;
                    rootIndex.push(ind); // The index of the mockup that corresponds to the root tank (-1 for no root)
                }
                if (!rootIndex.includes(-1)) {
                    generateTankTree(rootIndex);
                }
                lastGuiType = gui.type;
                global.generateTankTree = false;
                global.missingMockup = true;
            } catch { }
        }

        if (!tankTree) {
            console.log('No tank tree rendered yet.');
            return;
        }

        let tileSize = alcoveSize / 2,
            size = tileSize - 4, // TODO: figure out where this 4 comes from
            spaceBetween = 10,
            screenDivisor = (spaceBetween + tileSize) * 2 * global.treeScale,
            padding = tileSize / screenDivisor,
            dividedWidth = global.screenWidth / screenDivisor,
            dividedHeight = global.screenHeight / screenDivisor,
            treeFactor = 1 + spaceBetween / tileSize;

        global.fixedScrollX = Math.max(
            dividedWidth - padding,
            Math.min(
                tankTree.width * treeFactor + padding - dividedWidth,
                global.fixedScrollX + global.scrollVelocityX
            )
        );
        global.fixedScrollY = Math.max(
            dividedHeight - padding,
            Math.min(
                tankTree.height * treeFactor + padding - dividedHeight,
                global.fixedScrollY + global.scrollVelocityY
            )
        );
        global.scrollX = util.lerp(global.scrollX, global.fixedScrollX, 0.1);
        global.scrollY = util.lerp(global.scrollY, global.fixedScrollY, 0.1);

        for (let [start, end] of branches) {
            let sx = ((start.x - global.scrollX) * (tileSize + spaceBetween) + 1 + 0.5 * size) * global.treeScale + global.screenWidth / 2,
                sy = ((start.y - global.scrollY) * (tileSize + spaceBetween) + 1 + 0.5 * size) * global.treeScale + global.screenHeight / 2,
                ex = ((end.x - global.scrollX) * (tileSize + spaceBetween) + 1 + 0.5 * size) * global.treeScale + global.screenWidth / 2,
                ey = ((end.y - global.scrollY) * (tileSize + spaceBetween) + 1 + 0.5 * size) * global.treeScale + global.screenHeight / 2;
            if (ex < 0 || sx > global.screenWidth || ey < 0 || sy > global.screenHeight) continue;
            ctx.strokeStyle = color.black;
            ctx.lineWidth = 2 * global.treeScale;
            drawGuiLine(sx, sy, ex, ey);
        }
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = color.guiwhite;
        ctx.fillRect(0, 0, innerWidth, innerHeight);
        ctx.globalAlpha = 1;

        //draw the various tank icons
        let angle = -Math.PI / 4;
        for (let { x, y, colorIndex, index } of tiles) {
            let ax = (x - global.scrollX) * (tileSize + spaceBetween) * global.treeScale + global.screenWidth / 2,
                ay = (y - global.scrollY) * (tileSize + spaceBetween) * global.treeScale + global.screenHeight / 2;
            if (ax < -tileSize || ax > global.screenWidth + tileSize || ay < -tileSize || ay > global.screenHeight + tileSize) continue;
            drawEntityIcon(index.toString(), ax, ay, tileSize * global.treeScale, tileSize * global.treeScale, global.treeScale, angle, 1, colorIndex);
        }

        let text = "Arrow keys to navigate the class tree. Shift to navigate faster. Scroll wheel (or +/- keys) to zoom in/out.";
        let w = measureText(text, 18);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.fillStyle = color.dgrey;
        ctx.strokeStyle = color.black;
        ctx.fillText(text, global.screenWidth / 2 - w / 2, innerHeight * 0.04);
        ctx.strokeText(text, global.screenWidth / 2 - w / 2, innerHeight * 0.04);
    }

    const tablePrefix = "$$table$$";
    function drawMessages(spacing) {
        // Draw messages
        let vspacing = 4;
        let len = 0;
        let height = 18;
        let x = global.screenWidth / 2;
        let y = spacing;
        // Draw each message
        for (let i = global.messages.length - 1; i >= 0; i--) {
            let msg = global.messages[i],
                txt = msg.text,
                text = txt;
            function drawMessage(saveLength = true) {
                // Give it a textobj if it doesn't have one
                let length = msg.len ?? measureText(text, height - 4)
                if (msg.len == null & saveLength)
                    msg.len = length;
                // Draw the background
                ctx.globalAlpha = 0.5 * msg.alpha;
                drawBar(x - length / 2, x + length / 2, y + height / 2, height, color.black);
                // Draw the text
                ctx.globalAlpha = Math.min(1, msg.alpha);
                drawText(text, x, y + height / 2, height - 4, color.guiwhite, "center", true);
                // Iterate and move
                y += vspacing + height;
                if (msg.status > 1) {
                    y -= (vspacing + height) * (1 - Math.sqrt(msg.alpha));
                }
                if (msg.status > 1) {
                    msg.status -= 0.05;
                    msg.alpha += 0.05;
                } else if (i === 0 && ((!msg.fixed && global.messages.length > 5) || Date.now() - msg.time > msg.duration)) {
                    msg.status -= 0.05;
                    msg.alpha -= 0.05;
                    // Remove
                    if (msg.alpha <= 0) {
                        global.messages.splice(0, 1);
                    }
                }
            }
            if (text.startsWith(tablePrefix)) {
                text = text.slice(tablePrefix.length);
                let spaceWidth = measureText("\u200A");
                let table = text.split("\n").map(line => line.split("\t"));
                let textTable = [];
                for (let column = 0; column < table[0].length; column++) {
                    let widths = [],
                        maxWidth = 0
                    for (let line = 0; line < table.length; line++) {
                        let width = measureText(table[line][column]);
                        if (width > maxWidth) maxWidth = width;
                        widths[line] = width;
                        if (!textTable[line]) textTable[line] = [];
                    }
                    for (let line = 0; line < table.length; line++) {
                        textTable[line][column] = table[line][column] + "\u200A".repeat(Math.floor((maxWidth - widths[line]) / spaceWidth));
                    }
                }
                let lines = textTable.map(line => line.join("   "));
                for (let line of lines) {
                    text = line;
                    drawMessage(false);
                }
            } else drawMessage();
        }
        ctx.globalAlpha = 1;
    }

    function drawSkillBars(spacing, alcoveSize) {
        // Draw skill bars
        global.canSkill = !!gui.points;
        statMenu.set(0 + (global.died || global.statHover || (global.canSkill && !gui.skills.every(skill => skill.cap === skill.amount))));
        global.clickables.stat.hide();
        let vspacing = 4;
        let height = 15;
        let gap = 40;
        let len = alcoveSize; // * global.screenWidth; // The 30 is for the value modifiers
        let save = len;
        let x = spacing + (statMenu.get() - 1) * (height + 50 + len * ska(gui.skills.reduce((largest, skill) => Math.max(largest, skill.cap), 0)));
        let y = global.screenHeight - spacing - height;
        let ticker = 11;
        let namedata = gui.getStatNames(global.mockups[parseInt(gui.type.split("-")[0])].statnames);
        let clickableRatio = canvas.height / global.screenHeight / global.ratio;
        for (let i = 0; i < gui.skills.length; i++) {
            ticker--;
            //information about the bar
            let skill = gui.skills[i],
                name = namedata[ticker - 1],
                level = skill.amount,
                col = color[skill.color],
                cap = skill.softcap,
                maxLevel = skill.cap;
            if (!cap) continue;
            len = save;
            let max = 0,
                extension = cap > max,
                blocking = cap < maxLevel;
            if (extension) {
                max = cap;
            }

            //bar fills
            /*  drawBar(x + height / 2, x - height / 2 + len * ska(cap), y + height / 2, height - 3 + settings.graphical.barChunk, color.black);
              drawBar(x + height / 2, x + height / 2 + len * ska(cap) - gap, y + height / 2, height - 3, color.grey);
              drawBar(x + height / 2, x + height / 2 + len * ska(level) - gap, y + height / 2, height - 3.5, col); */

            if (global.mobile) {
                drawBar(
                    x + height / 2,
                    x - height / 0.5 + len * ska(cap),
                    y + height / 2,
                    height - 1 + settings.graphical.barChunk,
                    color.black
                );
                drawBar(
                    x + height / 2,
                    x + height / 2 + len * ska(cap) - gap,
                    y + height / 2,
                    height - 1,
                    color.grey
                );
                drawBar(
                    x + height / 2,
                    x + height / 2 + len * ska(level) - gap,
                    y + height / 2,
                    height - 1,
                    col
                );
            } else {
                drawBar(
                    x + height / 2,
                    x - height / 2 + len * ska(cap),
                    y + height / 2,
                    height - 3 + settings.graphical.barChunk,
                    color.black
                );
                drawBar(
                    x + height / 2,
                    x + height / 2 + len * ska(cap) - gap,
                    y + height / 2,
                    height - 3,
                    color.grey
                );
                drawBar(
                    x + height / 2,
                    x + height / 2 + len * ska(level) - gap,
                    y + height / 2,
                    height - 3.5,
                    col
                );
            }

            // Blocked-off area
            if (blocking) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = color.grey;
                for (let j = cap + 1; j < max; j++) {
                    drawGuiLine(x + len * ska(j) - gap, y + 1.5, x + len * ska(j) - gap, y - 3 + height);
                }
            }

            // Vertical dividers
            ctx.strokeStyle = color.black;
            ctx.lineWidth = 1;
            for (let j = 1; j < level + 1; j++) {
                drawGuiLine(x + len * ska(j) - gap, y + 1.5, x + len * ska(j) - gap, y - 3 + height);
            }

            // Skill name
            len = save * ska(max);
            let textcolor = level == maxLevel ? col : !gui.points || (cap !== maxLevel && level == cap) ? color.grey : color.guiwhite;
            drawText(name, Math.round(x + len / 2) + 0.5, y + height / 2, height - 5, textcolor, "center", true);

            // Skill key
            if (!global.mobile) {
                drawText("[" + (ticker % 10) + "]", Math.round(x + len - height * 0.25) - 1.5, y + height / 2, height - 5, textcolor, "right", true);
            }
            if (textcolor === color.guiwhite) {
                // If it's active
                global.clickables.stat.place(ticker - 1, x * clickableRatio, y * clickableRatio, len * clickableRatio, height * clickableRatio);
            }

            // Skill value
            if (level) {
                /* drawText(textcolor === col ? "MAX" : "+" + level, Math.round(x + len + 4) + 0.5, y + height / 2, height - 5, col, "left", true); */

                if (global.mobile) {
                    drawText(
                        textcolor === col ? "MAX" : "+" + level,
                        Math.round(x + len + -20) + 0,
                        y + height / 2,
                        height - 5,
                        col,
                        "left",
                        true
                    );
                } else {
                    drawText(
                        textcolor === col ? "MAX" : "+" + level,
                        Math.round(x + len + 4) + 0.5,
                        y + height / 2,
                        height - 5,
                        col,
                        "left",
                        true
                    );
                }
            }

            // Move on
            y -= height + vspacing;
        }
        global.clickables.hover.place(0, 0, y * clickableRatio, 0.8 * len * clickableRatio, (global.screenHeight - y) * clickableRatio);
        if (gui.points !== 0) {
            // Draw skillpoints to spend
            //   drawText("x" + gui.points, Math.round(x + len - 2) + 0.5, Math.round(y + height - 4) + 0.5, 20, color.guiwhite, "right");
            if (global.mobile) {
                drawText(
                    "x" + gui.points,
                    Math.round(x + len - 22.5) + 0.5,
                    Math.round(y + height - 4) + 0.5,
                    20,
                    color.guiwhite,
                    "right"
                );
            } else {
                drawText(
                    "x" + gui.points,
                    Math.round(x + len - 2) + 0.5,
                    Math.round(y + height - 4) + 0.5,
                    20,
                    color.guiwhite,
                    "right"
                );
            }
        }
    }

    function drawSelfInfo(spacing, alcoveSize, max) {
        //rendering information
        let vspacing = 4.5;
        let len = 1.75 * alcoveSize; // * global.screenWidth;
        let height = 23;
        let x = (global.screenWidth - len) / 2;
        let y = global.screenHeight - spacing - height - 1;
        ctx.lineWidth = 1;

        // Draw the exp bar
        drawBar(x, x + len, y + height / 2, height + settings.graphical.barChunk, color.black);
        drawBar(x, x + len, y + height / 2, height - settings.graphical.barChunk / 4, color.grey);
        drawBar(x, x + len * gui.__s.getProgress(), y + height / 2, height - 2, color.gold);

        // Draw the class type
        drawText("Level " + gui.__s.getLevel() + " " + gui.class, x + len / 2, y + height / 2 + 1, height - 2.5, color.guiwhite, "center", true);
        height = 16;
        y -= height + vspacing;

        // Draw the %-of-leader bar
        drawBar(x + len * 0.1, x + len * 0.9, y + height / 2, height - 3 + settings.graphical.barChunk, color.black);
        drawBar(x + len * 0.1, x + len * 0.9, y + height / 2, height - 3 - settings.graphical.barChunk / 4, color.grey);
        drawBar(x + len * 0.1, x + len * (0.1 + 0.8 * (max ? Math.min(1, gui.__s.getScore() / max) : 1)), y + height / 2, height - 3 - settings.graphical.barChunk / 4, color.green);

        //write the score and name
        drawText("Score: " + util.formatLargeNumber(Math.floor(gui.__s.getScore())), x + len / 2, y + height / 2 + 1, height - 3.5, color.guiwhite, "center", true);
        ctx.lineWidth = 4;
        drawText(global.player.name, Math.round(x + len / 2) + 0.5, Math.round(y - 10 - vspacing) + 0.5, 32, gameDraw.getColor(global.nameColor), "center");
    }

    function drawMinimapAndDebug(spacing, alcoveSize) {
        // Draw minimap and FPS monitors
        //minimap stuff starts here
        let len = alcoveSize; // * global.screenWidth;
        let height = (len / global.gameWidth) * global.gameHeight;
        if (global.mobile) {
            height = (len / global.gameWidth / 1.9) * global.gameHeight
            len = alcoveSize * 0.6;
        }
        if (global.gameHeight > global.gameWidth || global.gameHeight < global.gameWidth) {
            let ratio = [
                global.gameWidth / global.gameHeight,
                global.gameHeight / global.gameWidth,
            ];
            len /= ratio[1] * 1.5;
            height /= ratio[1] * 1.5;
            if (len > alcoveSize * 2) {
                ratio = len / (alcoveSize * 2);
            } else if (height > alcoveSize * 2) {
                ratio = height / (alcoveSize * 2);
            } else {
                ratio = 1;
            }
            len /= ratio;
            height /= ratio;
        }
        let x = global.screenWidth - spacing - len;
        let y = global.screenHeight - height - spacing;
        ctx.globalAlpha = 0.4;
        let W = global.roomSetup[0].length,
            H = global.roomSetup.length,
            i = 0;
        for (let ycell = 0; ycell < H; ycell++) {
            let row = global.roomSetup[ycell];
            let j = 0;
            for (let xcell = 0; xcell < W; xcell++) {
                let cell = global.roomSetup[ycell][xcell];
                ctx.fillStyle = gameDraw.modifyColor(cell);
                if (gameDraw.modifyColor(cell) !== color.white) {
                    drawGuiRect(x + (j * len) / W, y + (i * height) / H, len / W, height / H);
                }
                j++;
            }
            i++;
        }
        ctx.fillStyle = color.white;
        drawGuiRect(x, y, len, height);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 3;
        ctx.fillStyle = color.black;
        drawGuiRect(x, y, len, height, true); // Border
        for (let entity of minimap.get()) {
            ctx.fillStyle = gameDraw.mixColors(gameDraw.modifyColor(entity.color), color.black, 0.3);
            ctx.globalAlpha = entity.alpha;
            switch (entity.type) {
                case 2:
                    drawGuiRect(x + ((entity.x - entity.size) / global.gameWidth) * len - 0.4, y + ((entity.y - entity.size) / global.gameHeight) * height - 1, ((2 * entity.size) / global.gameWidth) * len + 0.2, ((2 * entity.size) / global.gameWidth) * len + 0.2);
                    break;
                case 1:
                    drawGuiCircle(x + (entity.x / global.gameWidth) * len, y + (entity.y / global.gameHeight) * height, (entity.size / global.gameWidth) * len + 0.2);
                    break;
                case 0:
                    if (entity.id !== gui.playerid) drawGuiCircle(x + (entity.x / global.gameWidth) * len, y + (entity.y / global.gameHeight) * height, 2);
                    break;
            }
        }
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.strokeStyle = color.black;
        ctx.fillStyle = color.black;
        drawGuiCircle(x + (global.player.cx / global.gameWidth) * len - 1, y + (global.player.cy / global.gameHeight) * height - 1, 2, false);
        if (global.showDebug) {
            drawGuiRect(x, y - 40, len, 30);
            lagGraph(lag.get(), x, y - 40, len, 30, color.teal);
            gapGraph(global.metrics.rendergap, x, y - 40, len, 30, color.pink);
            timingGraph(GRAPHDATA, x, y - 40, len, 30, color.yellow);
        }
        //minimap stuff ends here
        //debug stuff
        if (!global.showDebug) y += 14 * 3;
        // Text
        if (global.showDebug) {
            drawText("ArrasDiss", x + len, y - 50 - 5 * 14 - 2, 15, "#5ed9ff", "right");
            drawText("Prediction: " + Math.round(GRAPHDATA) + "ms", x + len, y - 50 - 4 * 14, 10, color.guiwhite, "right");
            drawText(`Bandwidth: ${gui.bandwidth.in} in, ${gui.bandwidth.out} out`, x + len, y - 50 - 3 * 14, 10, color.guiwhite, "right");
            drawText("Update Rate: " + global.metrics.updatetime + "Hz", x + len, y - 50 - 2 * 14, 10, color.guiwhite, "right");
            drawText((100 * gui.fps).toFixed(2) + "% : " + global.metrics.rendertime + " FPS", x + len, y - 50 - 1 * 14, 10, global.metrics.rendertime > 10 ? color.guiwhite : color.orange, "right");
            drawText(global.metrics.latency + " ms - " + global.serverName, x + len, y - 50, 10, color.guiwhite, "right");
        } else {
            drawText("ArrasDiss", x + len, y - 50 - 2 * 14 - 2, 15, "#5ed9ff", "right");
            drawText((100 * gui.fps).toFixed(2) + "% : " + global.metrics.rendertime + " FPS", x + len, y - 50 - 1 * 14, 10, global.metrics.rendertime > 10 ? color.guiwhite : color.orange, "right");
            drawText(global.metrics.latency + " ms : " + global.metrics.updatetime + "Hz", x + len, y - 50, 10, color.guiwhite, "right");
        }
        global.fps = global.metrics.rendertime;
    }

    function drawLeaderboard(spacing, alcoveSize, max) {
        // Draw leaderboard
        let lb = leaderboard.get();
        let vspacing = 4;
        let len = alcoveSize; // * global.screenWidth;
        let height = 14;
        let x = global.screenWidth - len - spacing;
        let y = spacing + height + 7;
        /* if (global.mobile)
         y += global.canUpgrade
           ? ((len / 6 + spacing) / 0.515) * upgradeMenu.get()
           : 0;
           */
        drawText("Leaderboard", Math.round(x + len / 2) + 0.5, Math.round(y - 6) + 0.5, height + 3.5, color.guiwhite, "center");
        y += 7;
        for (let i = 0; i < lb.data.length; i++) {
            let entry = lb.data[i];
            drawBar(x, x + len, y + height / 2, height - 3 + settings.graphical.barChunk, color.black);
            drawBar(x, x + len, y + height / 2, height - 3, color.grey);
            let shift = Math.min(1, entry.score / max);
            drawBar(x, x + len * shift, y + height / 2, height - 3.5, gameDraw.modifyColor(entry.barColor));
            // Leadboard name + score
            let nameColor = gameDraw.getColor(entry.nameColor || "#FFFFFF");
            drawText(entry.label + (": " + util.handleLargeNumber(Math.round(entry.score))), x + len / 2, y + height / 2, height - 5, nameColor, "center", true);
            // Mini-image
            let scale = height / entry.position.axis,
                xx = x - 1.5 * height - scale * entry.position.middle.x * 0.707,
                yy = y + 0.5 * height + scale * entry.position.middle.x * 0.707,
                baseColor = entry.color;
            drawEntity(baseColor, xx, yy, entry.image, 1 / scale, 1, (scale * scale) / entry.image.size, 1, -Math.PI / 4, true);
            // Move down
            y += vspacing + height;
        }
    }

    function drawAvailableUpgrades(spacing, alcoveSize) {
        global.clickables.upgrade.hide();
        global.clickables.builderUpgrade.hide();
        global.clickables.builderNavigate.hide();
        if (global.tankBuilder) return drawAvailableBuilderUpgrades(spacing, alcoveSize);
        // Draw upgrade menu
        if (gui.upgrades.length > 0) {
            global.canUpgrade = true;
            let internalSpacing = 15;
            let len = alcoveSize / 2;
            let height = len;

            // Animation processing
            let columnCount = Math.max(3, Math.ceil(gui.upgrades.length / 4));
            upgradeMenu.set(columnCount + 0.5);
            let glide = upgradeMenu.get();

            let x = (glide - columnCount - 0.5) * len + spacing;
            let y = spacing - height - 2.5 * internalSpacing;
            let xStart = x;
            let initialX = x;
            let rowWidth = 0;
            let initialY = y;
            let ticker = 0;
            let upgradeNum = 0;
            let colorIndex = 10;
            let clickableRatio = global.canvas.height / global.screenHeight / global.ratio;
            let lastBranch = -1;
            upgradeSpin += 0.01;
            if (global.mobile) {
                columnCount = Math.max(9, Math.ceil(gui.upgrades.length / 10));
                internalSpacing = 10;
            }
            for (let i = 0; i < gui.upgrades.length; i++) {
                let upgrade = gui.upgrades[i];
                let upgradeBranch = upgrade[0];
                let upgradeBranchLabel = upgrade[1] == "undefined" ? "" : upgrade[1];
                let model = upgrade[2];

                // Draw either in the next row or next column
                if (ticker === columnCount || upgradeBranch != lastBranch) {
                    x = xStart;
                    y += height + internalSpacing;
                    if (upgradeBranch != lastBranch) {
                        if (upgradeBranchLabel.length > 0) {
                            drawText(" " + upgradeBranchLabel, xStart, y + internalSpacing * 2, internalSpacing * 2.3, color.guiwhite, "left", false);
                            y += 1.5 * internalSpacing;
                        }
                        y += 1.5 * internalSpacing;
                        colorIndex = 10;
                    }
                    lastBranch = upgradeBranch;
                    ticker = 0;
                } else {
                    x += len + internalSpacing;
                }

                if (y > initialY) initialY = y;
                rowWidth = x;

                global.clickables.upgrade.place(i, x * clickableRatio, y * clickableRatio, len * clickableRatio, height * clickableRatio);

                drawEntityIcon(model, x, y, len, height, 1, upgradeSpin, 0.5, colorIndex++);

                ticker++;
                upgradeNum++;
            }

            // Draw dont upgrade button
            let h = 14,
                msg = "Don't Upgrade",
                m = measureText(msg, h - 3) + 10;
            let buttonX = initialX + (rowWidth + len + internalSpacing - initialX) / 2,
                buttonY = initialY + height + internalSpacing;
            drawBar(buttonX - m / 2, buttonX + m / 2, buttonY + h / 2, h + settings.graphical.barChunk, color.black);
            drawBar(buttonX - m / 2, buttonX + m / 2, buttonY + h / 2, h, color.white);
            drawText(msg, buttonX, buttonY + h / 2, h - 2, color.guiwhite, "center", true);
            global.clickables.skipUpgrades.place(0, (buttonX - m / 2) * clickableRatio, buttonY * clickableRatio, m * clickableRatio, h * clickableRatio);

            upgradeMenuY = buttonY + h;

            // Upgrade tooltip
            let upgradeHoverIndex = global.clickables.upgrade.check({ x: global.mouse.x, y: global.mouse.y });
            if (upgradeHoverIndex > -1) {
                let picture = gui.upgrades[upgradeHoverIndex][2];
                if (picture.upgradeTooltip.length > 0) {
                    let boxWidth = measureText(picture.name, alcoveSize / 10),
                        boxX = global.mouse.x * global.screenWidth / window.canvas.width + 2,
                        boxY = global.mouse.y * global.screenHeight / window.canvas.height + 2,
                        boxPadding = 6,
                        splitTooltip = picture.upgradeTooltip.split("\n"),
                        textY = boxY + boxPadding + alcoveSize / 10;

                    // Tooltip box width
                    for (let line of splitTooltip) boxWidth = Math.max(boxWidth, measureText(line, alcoveSize / 15));

                    // Draw tooltip box
                    gameDraw.setColor(ctx, color.dgrey);
                    ctx.lineWidth /= 1.5;
                    drawGuiRect(boxX, boxY, boxWidth + boxPadding * 3, alcoveSize * (splitTooltip.length + 1) / 10 + boxPadding * 3, false);
                    drawGuiRect(boxX, boxY, boxWidth + boxPadding * 3, alcoveSize * (splitTooltip.length + 1) / 10 + boxPadding * 3, true);
                    ctx.lineWidth *= 1.5;
                    drawText(picture.name, boxX + boxPadding * 1.5, textY, alcoveSize / 10, color.guiwhite);
                    for (let t of splitTooltip) {
                        textY += boxPadding + alcoveSize / 15
                        drawText(t, boxX + boxPadding * 1.5, textY, alcoveSize / 15, color.guiwhite);
                    }
                }
            }
        } else {
            global.canUpgrade = false;
            upgradeMenu.force(0);
            global.clickables.upgrade.hide();
            global.clickables.skipUpgrades.hide();
        }
    }

    function drawAvailableBuilderUpgrades(spacing, alcoveSize) {
        let clickableRatio = global.canvas.height / global.screenHeight / global.ratio;

        function drawNavigationButton(index, text, col, x, y, width, height, enabled) {
            ctx.fillStyle = color.grey;
            drawGuiRect(x, y, width, height);

            ctx.strokeStyle = color.black;
            ctx.lineWidth = 3;
            drawGuiRect(x, y, width, height, true);

            drawText(text, x + width / 2, y + height / 2, height / 3, col, "center", true);

            if (enabled) global.clickables.builderNavigate.place(index, x * clickableRatio, y * clickableRatio, width * clickableRatio, height * clickableRatio);
            else drawDisabled(x, y, width, height);

            return width;
        }

        function drawBuilderUpgrade(index, upgrade, x, y, width, height) {
            const maxWidth = width * 0.9;
            const maxHeight = height * 0.9;
            const nameFontSize = height / 6;
            const descriptionFontSize = nameFontSize * 0.75;
            const lineSpacing = 0.5;

            let { name, description, price, upgrades, disabled } = upgrade;

            ctx.fillStyle = color.grey;
            drawGuiRect(x, y, width, height);

            ctx.strokeStyle = color.black;
            ctx.lineWidth = 3;
            drawGuiRect(x, y, width, height, true);

            if (!upgrades) {
                let canAfford = gui.builderPoints >= price;

                let title = `${name} (${canAfford ? "§green§" : "§red§"}${price}§reset§)`;
                let fontSize;
                for (fontSize = nameFontSize; measureText(title, fontSize) > (width * 0.9); fontSize -= 1) { }
                drawText(title, x + width / 2, y + height * 0.2, fontSize, color.guiwhite, "center", true);

                let textAreaHeight = height * 0.6;
                let splitText = splitTextIntoLines(description, descriptionFontSize, maxWidth, textAreaHeight, lineSpacing);
                let lines = splitText.lines;
                fontSize = splitText.fontSize;
                let textY = y + (height - textAreaHeight) + textAreaHeight / 2 - splitText.height / 2;
                for (let line of lines) {
                    drawText(line, x + width / 2, textY, fontSize, gameDraw.mixColors(color.vlgrey, color.grey), "center");
                    textY += fontSize * (1 + lineSpacing);
                }

                if (canAfford && !disabled) global.clickables.builderUpgrade.place(index, x * clickableRatio, y * clickableRatio, width * clickableRatio, height * clickableRatio);
                else drawDisabled(x, y, width, height);
            } else {
                let { lines, fontSize } = splitTextIntoLines(name, nameFontSize, maxWidth, maxHeight, lineSpacing);

                let y2 = y + height / 2 - lines.length / 2 * fontSize - (lines.length / 4 - 0.5) * fontSize * (1 + lineSpacing);

                for (let line of lines) {
                    drawText(line, x + width / 2, y2, fontSize, color.guiwhite, "center", true);
                    y2 += fontSize * (1 + lineSpacing);
                }

                if (gui.builderPoints > 0) global.clickables.builderUpgrade.place(index, x * clickableRatio, y * clickableRatio, width * clickableRatio, height * clickableRatio);
                else drawDisabled(x, y, width, height);
            }
        }

        function drawBuilderPoints(x, y, width, height) {
            const pointsTextSize = height / 10;
            const xPointsTextSize = pointsTextSize * 2;
            let pointsY = y + height - pointsTextSize;

            drawText("Build Points", x, pointsY, pointsTextSize, color.guiwhite);
            pointsY -= xPointsTextSize;
            drawText(`x${gui.builderPoints}`, x, pointsY, xPointsTextSize, color.guiwhite);
        }

        let upgradesToShow = 4;
        if (global.builderUpgrades.length > 0) {
            global.canBuilderUpgrade = true;
            let x = spacing;
            let y = spacing;
            let width = alcoveSize / 2;
            let height = alcoveSize / 2;

            x += drawNavigationButton(0, "\u25c0", color.dgrey, x, y, width / 2, height, global.currentBuilderUpgradeIndex > 0) + spacing;

            let upgrades = global.currentBuilderUpgrades.slice(global.currentBuilderUpgradeIndex, global.currentBuilderUpgradeIndex + upgradesToShow);

            for (let i = 0; i < upgrades.length; i++) {
                drawBuilderUpgrade(i, upgrades[i], x, y, width, height);
                x += spacing + width;
            }

            y += height + spacing;

            x -= width / 2 + spacing;

            if (global.mobile) {
                let player = global.entities.find(e => e.id === gui.playerid);
                var isUpgrading = global.tankBuilder && player && player.render.status.getState() === "building";
                drawNavigationButton(6, "Snap", color.guiwhite, x - width / 2 - spacing, y, width / 2, height / 3, isUpgrading);
            }

            x += drawNavigationButton(3, "Undo", color.guiwhite, x, y, width / 2, height / 3, gui.builderUndo) + spacing;

            drawNavigationButton(4, "Submit", color.guiwhite, x, y, width / 2, height / 3, gui.builderUndo);

            y -= height + spacing;

            x += drawNavigationButton(1, "\u25b6", color.dgrey, x, y, width / 2, height, global.currentBuilderUpgradeIndex + upgradesToShow < global.currentBuilderUpgrades.length) + spacing;

            drawBuilderPoints(x, y, width, height);

            x = spacing;
            y += height + spacing;

            x += drawNavigationButton(2, "Back", color.guiwhite, x, y, width / 2, height / 3, global.currentBuilderUpgrades !== global.builderUpgrades && gui.builderPoints > 0) + spacing;

            if (global.mobile) {
                let player = global.entities.find(e => e.id === gui.playerid);
                drawNavigationButton(5, "End Upgrade", color.guiwhite, x, y, width, height / 3, global.tankBuilder && player && player.render.status.getState() === "building");
            }

            y += height / 3;

            builderUpgradeMenuY = y;
        } else global.canBuilderUpgrade = false;
    }

    function drawMobileButtons(spacing, alcoveSize) {
        if (!global.mobile) return;

        if (global.clickables.mobileButtons.active == null) global.clickables.mobileButtons.active = false;
        if (global.clickables.mobileButtons.altFire == null) global.clickables.mobileButtons.altFire = false;

        // Hide the buttons
        global.clickables.mobileButtons.hide();

        // Some sizing variables
        let clickableRatio = global.canvas.height / global.screenHeight / global.ratio;
        let yOffset = global.tankBuilder ? builderUpgradeMenuY : global.canUpgrade ? upgradeMenuY : 0;
        let baseSize = (alcoveSize - spacing * 2) / 3;

        function makeButton(index, x, y, width, height, text) {
            // Set the clickable's position
            global.clickables.mobileButtons.place(index, x * clickableRatio, y * clickableRatio, width * clickableRatio, height * clickableRatio);

            // Draw boxes
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = color.grey;
            drawGuiRect(x, y, width, height);
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = color.black;
            drawGuiRect(x, y + height * 0.6, width, height * 0.4);
            ctx.globalAlpha = 1;

            // Draw text
            drawText(text, x + width / 2, y + height * 0.5, height * 0.6, color.guiwhite, "center", true);

            // Draw the borders
            ctx.strokeStyle = color.black;
            ctx.lineWidth = 3;
            drawGuiRect(x, y, width, height, true);
        };

        function makeButtons(buttons, startX, startY, baseSize) {
            let x, y, index = 0;

            let resetX = () => x = startX;
            let resetY = () => y = startY;

            resetX();
            resetY();

            for (let row = 0; row < buttons.length; row++) {
                for (let col = 0; col < buttons[row].length; col++) {
                    //console.log(buttons[row][col][0], buttons[row][col][3] ?? index);
                    makeButton(buttons[row][col][3] ?? index, x, y, baseSize * (buttons[row][col][1] ?? 1), baseSize * (buttons[row][col][2] ?? 1), buttons[row][col][0]);
                    x += baseSize * (buttons[row][col][1] ?? 1) + spacing;
                    index++;
                }

                resetX();
                y += Math.max(...buttons[row].map(b => baseSize * (b[2] ?? 1))) + spacing;
            }
        }

        let buttons = global.clickables.mobileButtons.active ? [
            [[global.clickables.mobileButtons.active ? "-" : "+"], [`Alt ${global.clickables.mobileButtons.altFire ? "Manual" : "Disabled"}`, 6], ["Fullscreen", 5]],
            [["Autofire", 3.5], ["Reverse", 3.5], ["Self-Destruct", 5]],
            [["Autospin", 3.5], ["Override", 3.5], ["Level Up", 5]],
            [["Action", 3.5], ["Special", 3.5], ["Chat", 5]],
        ] : [
            [[global.clickables.mobileButtons.active ? "-" : "+"]],
        ];

        if (global.clickables.mobileButtons.altFire) buttons.push([["\u2756", 2, 2, 12]]);

        makeButtons(buttons, spacing * 2, yOffset + spacing, baseSize);
    }

    const gameDrawAlive = (ratio, drawRatio) => {
        let GRAPHDATA = 0;
        // Prep stuff
        renderTimes++;
        // Move the camera
        let motion = compensation();
        motion.set();
        let smear = { x: 0, y: 0 };
        GRAPHDATA = motion.getPrediction();
        // Don't move the camera if you're dead. This helps with jitter issues
        global.player.renderx = util.lerp(global.player.renderx, global.player.cx, 0.1, true);
        global.player.rendery = util.lerp(global.player.rendery, global.player.cy, 0.1, true);
        let px = ratio * global.player.renderx,
            py = ratio * global.player.rendery;

        // Get the player's target
        if (!global.mobile) calculateTarget();

        //draw the in game stuff
        drawFloor(px, py, ratio);
        drawEntities(px, py, ratio);
        ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);

        //draw hud
        let alcoveSize = 200 / ratio; // drawRatio * global.screenWidth;
        let spacing = 20;
        gui.__s.update();
        let lb = leaderboard.get();
        let max = lb.max;
        if (global.showTree) {
            drawUpgradeTree(spacing, alcoveSize);
        } else {
            if (global.mobile) {
                // draw joysticks if needed.
                let radius = Math.min(
                    global.screenWidth * 0.6,
                    global.screenHeight * 0.12,
                );
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(
                    (global.screenWidth * 1) / 6,
                    (global.screenHeight * 2) / 3,
                    radius,
                    0,
                    2 * Math.PI,
                );
                ctx.arc(
                    (global.screenWidth * 5) / 6,
                    (global.screenHeight * 2) / 3,
                    radius,
                    0,
                    2 * Math.PI,
                );
                ctx.fill();
            }
            drawMessages(spacing);
            drawSkillBars(spacing, alcoveSize);
            drawSelfInfo(spacing, alcoveSize, max);
            drawMinimapAndDebug(spacing, alcoveSize);
            drawLeaderboard(spacing, alcoveSize, max, lb);
            drawAvailableUpgrades(spacing, alcoveSize);
            drawMobileButtons(spacing, alcoveSize);
        }
        global.metrics.lastrender = getNow();
    };
    let getKills = () => {
        let finalKills = {
            " kills": [Math.round(global.finalKills[0].get()), 1],
            " assists": [Math.round(global.finalKills[1].get()), 0.5],
            " visitors defeated": [Math.round(global.finalKills[2].get()), 3],
            " polygons destroyed": [Math.round(global.finalKills[3].get()), 0.05],
        }, killCountTexts = [];
        let destruction = 0;
        for (let key in finalKills) {
            if (finalKills[key][0]) {
                destruction += finalKills[key][0] * finalKills[key][1];
                killCountTexts.push(finalKills[key][0] + key);
            }
        }
        return (
            (destruction === 0 ? "🌼"
                : destruction < 4 ? "🎯"
                    : destruction < 8 ? "💥"
                        : destruction < 15 ? "💢"
                            : destruction < 25 ? "🔥"
                                : destruction < 50 ? "💣"
                                    : destruction < 75 ? "👺"
                                        : destruction < 100 ? "🌶️" : "💯"
            ) + " " + (!killCountTexts.length ? "A true pacifist" :
                killCountTexts.length == 1 ? killCountTexts.join(" and ") :
                    killCountTexts.slice(0, -1).join(", ") + " and " + killCountTexts[killCountTexts.length - 1])
        );
    };
    let getDeath = () => {
        let txt = "";
        if (global.finalKillers.length) {
            txt = "🔪 Succumbed to";
            for (let e of global.finalKillers) {
                txt += " " + util.addArticle(util.getEntityImageFromMockup(e).name) + " and";
            }
            txt = txt.slice(0, -4);
        } else {
            txt += "🤷 Well that was kinda dumb huh";
        }
        return txt;
    };
    let getTips = () => {
        let txt = "";
        if (global.finalKillers.length) {
            txt = "❓ Try to get revenge on your enemy to get your score back!";
        } else if (!document.getElementById("autoLevelUp").checked) {
            txt =
                "❓ Enable auto level up at the options menu to get instant level 45!";
        } else {
            txt += "❓ Try killing players to earn XP!";
        }
        return txt;
    };
    const gameDrawDead = () => {
        clearScreen(color.black, 0.25);
        let ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);
        let shift = animations.deathScreen.get();
        ctx.translate(0, -shift * global.screenHeight);
        let x = global.screenWidth / 2,
            y = global.screenHeight / 2 - 50;
        let len = 140,
            position = global.mockups[parseInt(gui.type.split("-")[0])].position,
            scale = len / position.axis,
            xx = global.screenWidth / 2 - scale * position.middle.x * 0.707,
            yy = global.screenHeight / 2 - 35 + scale * position.middle.x * 0.707,
            picture = util.getEntityImageFromMockup(gui.type, gui.color),
            baseColor = picture.color;
        drawEntity(
            baseColor,
            (xx - 190 - len / 2 + 0.5) | 0,
            (yy - 20 + 0.5) | 0,
            picture,
            1.5,
            1,
            (0.5 * scale) / picture.realSize,
            1,
            -Math.PI / 4,
            true,
        );
        drawText(
            "Level " + gui.__s.getLevel(),
            x - 275,
            y - -80,
            14,
            color.guiwhite,
            "center",
        );
        drawText(picture.name, x - 275, y - -110, 24, color.guiwhite, "center");
        drawText(
            "Lol you died xD",
            x,
            y - 80,
            8,
            color.guiwhite,
            "center",
        );
        if (document.getElementById("playerNameInput").value == "") {
            drawText("Your Score: ", x - 170, y - 30, 24, color.guiwhite);
        } else {
            drawText(
                global.player.name + "'s Score: ",
                x - 170,
                y - 30,
                24,
                color.guiwhite,
            );
        }
        drawText(
            util.formatLargeNumber(Math.round(global.finalScore.get())),
            x - 170,
            y + 25,
            50,
            color.guiwhite,
        );
        drawText(
            "⌚ Survived for " +
            util.timeForHumans(Math.round(global.finalLifetime.get())),
            x - 170,
            y + 55,
            16,
            color.guiwhite,
        );
        drawText(getKills(), x - 170, y + 77, 16, color.guiwhite);
        drawText(getDeath(), x - 170, y + 99, 16, color.guiwhite);
        drawText(getTips(), x - 170, y + 122, 16, color.guiwhite);
        drawText(
            "🦆 The server was " +
            +(100 * gui.fps).toFixed(0) +
            "%" +
            " active for the run!",
            x - 170,
            y + 144,
            16,
            color.guiwhite,
        );
        drawText(
            global.mobile ? "(Tap to respawn)" : "(Press enter to respawn)",
            x,
            y + 169,
            16,
            color.guiwhite,
            "center",
        );
        ctx.translate(0, shift * global.screenHeight);
    };
    const gameDrawBeforeStart = () => {
        let ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);
        clearScreen(color.white, 0.5);
        let shift = animations.connecting.get();
        ctx.translate(0, -shift * global.screenHeight);
        drawText("Connecting...", global.screenWidth / 2, global.screenHeight / 2, 30, color.guiwhite, "center");
        drawText(global.message, global.screenWidth / 2, global.screenHeight / 2 + 30, 15, color.lgreen, "center");
        drawText(
            global.tips,
            global.screenWidth / 2,
            global.screenHeight / 2 + 90,
            15,
            color.guiwhite,
            "center",
        );
        ctx.translate(0, shift * global.screenHeight);
    };
    const gameDrawDisconnected = () => {
        let ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);
        clearScreen(gameDraw.mixColors(color.red, color.guiblack, 0.3), 0.25);
        let shift = animations.disconnected.get();
        ctx.translate(0, -shift * global.screenHeight);
        drawText("Disconnected", global.screenWidth / 2, global.screenHeight / 2, 30, color.guiwhite, "center");
        drawText(global.message, global.screenWidth / 2, global.screenHeight / 2 + 30, 15, color.orange, "center");
        ctx.translate(0, shift * global.screenHeight);
    };
    const gameDrawError = (e) => {
        let ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);
        clearScreen(gameDraw.mixColors(color.red, color.guiblack, 0.2), 0.35);
        let shift = animations.error.get();
        ctx.translate(0, -shift * global.screenHeight);
        drawText("There has been an error!", global.screenWidth / 2, global.screenHeight / 2 - 50, 50, color.guiwhite, "center");
        drawText("Please report this to the developers as soon as you can.", global.screenWidth / 2, global.screenHeight / 2, 30, color.guiwhite, "center");
        if (e instanceof Error) {
            let lines = e.stack.split("\n");
            let y = global.screenHeight / 2 + 35;
            for (let line of lines) {
                drawText(line, global.screenWidth / 2, y, 17, color.orange, "center");
                y += 25;
            }
        } else drawText("Error: " + e.toString(), global.screenWidth / 2, global.screenHeight / 2 + 30, 15, color.orange, "center");
        ctx.translate(0, shift * global.screenHeight);
    };
    // The main function
    function animloop() {
        global.animLoopHandle = window.requestAnimFrame(animloop);
        gameDraw.reanimateColors();
        global.player.renderv += (global.player.view - global.player.renderv) / 10;
        var ratio = settings.graphical.screenshotMode ? 2 : util.getRatio();
        // Set the drawing style
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Draw the game
        if (global.gameStart && !global.disconnected) {
            global.time = getNow();
            if (global.time - lastPing > 1000) {
                // Latency
                // Do ping.
                global.socket.ping(global.time);
                lastPing = global.time;
                // Do rendering speed.
                global.metrics.rendertime = renderTimes;
                renderTimes = 0;
                // Do update rate.
                global.metrics.updatetime = global.updateTimes;
                global.updateTimes = 0;
            }
            global.metrics.lag = global.time - global.player.time;
        }
        ctx.translate(0.5, 0.5);
        try {
            if (global.gameStart) {
                gameDrawAlive(ratio, util.getScreenRatio());
            } else if (!global.disconnected) {
                gameDrawBeforeStart();
            }
            if (global.died) {
                gameDrawDead();
            }
            if (global.disconnected) {
                gameDrawDisconnected();
            }
            ctx.translate(-0.5, -0.5);
        } catch (e) {
            gameDrawError(e);
            ctx.translate(-0.5, -0.5);
            console.log(e);
            throw Error('Something has gone wrong!');
        }
    }
})(util, global, settings, Canvas, color, gameDraw, socketStuff);