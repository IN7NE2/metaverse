const socket = io(); // Connect to server

socket.on("connect", () => {
    console.log("Connected to server!", socket.id);
    socket.emit("requestPlayers"); // Request existing players
});

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: { 
        default: "arcade",
    },
    scene: { preload, create, update }
};

let otherPlayers = {}; // Store other players' data
let player;
let cursors;
const game = new Phaser.Game(config);

function preload() {
    this.load.spritesheet('player_01', 'assets/player_01.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('player_02', 'assets/player_02.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('player_03', 'assets/player_03.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('tree', 'assets/tree_02.png');
}

function create() {
    const spriteList = ["player_01", "player_02", "player_03"];
    const randomSprite = spriteList[Math.floor(Math.random() * spriteList.length)];

    // Handle player updates from the server
    socket.on("updatePlayers", (players) => {
        Object.keys(players).forEach((id) => {
            if (id === socket.id) return; // Skip the current player

            const playerData = players[id];
            let otherPlayer = otherPlayers[id];

            if (!otherPlayer) {
                // Create a new sprite for the player
                otherPlayer = otherPlayers[id] = this.physics.add.sprite(playerData.x, playerData.y, playerData.sprite);
                otherPlayer.setCollideWorldBounds(true);
                console.log(`🎮 Created sprite for player ${id} with sprite: ${playerData.sprite}`);
            } else {
                // Update existing player's sprite and position
                if (playerData.sprite !== otherPlayer.texture.key) {
                    console.log(`⚠️ Sprite change detected for player ${id}! Updating sprite.`);
                    otherPlayer.setTexture(playerData.sprite);
                }
                otherPlayer.setPosition(playerData.x, playerData.y);
            }

           
        });

        // Remove disconnected players
        Object.keys(otherPlayers).forEach((id) => {
            if (!players[id]) {
                console.log(`Removing sprite for player: ${id}`);
                otherPlayers[id].destroy();
                delete otherPlayers[id];
            }
        });
    });

    // Create the local player
    player = this.physics.add.sprite(400, 300, randomSprite);
    player.setCollideWorldBounds(true);
    player.body.setSize(20, 50);
    player.body.setOffset(20, 17);

    // Add a tree with collision
    let tree = this.physics.add.staticImage(200, 200, 'tree');
    tree.setScale(0.06);
    let collisionBox = this.add.rectangle(200, 280, 45, 25, 0xff0000, 0);
    this.physics.add.existing(collisionBox);
    collisionBox.body.setImmovable(true);
    this.physics.add.collider(player, collisionBox);

    // Set up keyboard input
    cursors = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Create animations
    const anims = ['walk_up', 'walk_down', 'walk_left', 'walk_right'];
    const frames = { walk_up: [0, 8], walk_down: [18, 26], walk_left: [9, 17], walk_right: [28, 35] };
    anims.forEach(anim => {
        this.anims.create({
            key: anim,
            frames: this.anims.generateFrameNumbers(randomSprite, { start: frames[anim][0], end: frames[anim][1] }),
            frameRate: 10,
            repeat: -1
        });
    });
}

function update() {
    let moved = false;
    let movementData = { x: player.x, y: player.y};
    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-200);
        player.anims.play('walk_left', true);
        // movementData.anim = 'walk_left';
        moved = true;
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.anims.play('walk_right', true);
        // movementData.anim = 'walk_right';
        moved = true;
    } else if (cursors.up.isDown) {
        player.setVelocityY(-200);
        player.anims.play('walk_up', true);
        // movementData.anim = 'walk_up';
        moved = true;
    } else if (cursors.down.isDown) {
        player.setVelocityY(200);
        player.anims.play('walk_down', true);
        // movementData.anim = 'walk_down';
        moved = true;
    } else {
        player.anims.stop();
    }

    if (moved) {
        movementData.x = player.x;
        movementData.y = player.y;
        socket.emit("playerMove", movementData);
    }
}

//chat system code
const chatInput = document.getElementById("chat-input");
const messagesDiv = document.getElementById("messages");

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && chatInput.value.trim() !== "") {
        socket.emit("chatMessage", chatInput.value.trim());
        chatInput.value = "";
    }
});

socket.on("chatMessage", (data) => {
    const messageElement = document.createElement("div");
    messageElement.textContent = `${data.id.slice(0, 6)}: ${data.message}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});