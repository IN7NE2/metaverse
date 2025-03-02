const socket = io(); // Connect to server

socket.on("connect", () => {
    console.log("Connected to server!", socket.id);
    socket.emit("requestPlayers"); // ✅ Request existing players
});

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: { 
        default: "arcade",
        arcade: { debug: true } 
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
    // Random player sprite
    const spriteList = ["player_01", "player_02", "player_03"];
    const randomSprite = spriteList[Math.floor(Math.random() * spriteList.length)];

    // Handle player updates from the server
    socket.on("updatePlayers", (players) => {
        Object.keys(players).forEach((id) => {
            if (id !== socket.id) {
                if (!otherPlayers[id]) {
                    // Create a sprite for the new player
                    otherPlayers[id] = this.physics.add.sprite(players[id].x, players[id].y, players[id].sprite);
                    otherPlayers[id].setCollideWorldBounds(true);
                    console.log(`🎮 Created sprite for player ${id} with sprite: ${players[id].sprite}`);
                } else {
                    // Update the position and sprite of existing players
                    otherPlayers[id].setTexture(players[id].sprite); // ✅ Ensure correct sprite!
                    otherPlayers[id].x = players[id].x;
                    otherPlayers[id].y = players[id].y;
                }
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

    // Create player sprite
    player = this.physics.add.sprite(400, 300, randomSprite);
    player.setCollideWorldBounds(true);
    player.body.setSize(20, 50);
    player.body.setOffset(20, 17);

    // Create tree (static object)
    let tree = this.physics.add.staticImage(200, 200, 'tree');
    tree.setScale(0.06);

    // Collision box for tree
    let collisionBox = this.add.rectangle(200, 280, 45, 25, 0xff0000, 0);
    this.physics.add.existing(collisionBox);
    collisionBox.body.setImmovable(true);
    this.physics.add.collider(player, collisionBox);

    // Define keyboard inputs
    cursors = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Create animations
    this.anims.create({
        key: 'walk_up',
        frames: this.anims.generateFrameNumbers(randomSprite, { start: 0, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_down',
        frames: this.anims.generateFrameNumbers(randomSprite, { start: 18, end: 26 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_left',
        frames: this.anims.generateFrameNumbers(randomSprite, { start: 9, end: 17 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_right',
        frames: this.anims.generateFrameNumbers(randomSprite, { start: 28, end: 35 }),
        frameRate: 10,
        repeat: -1
    });
}

function update() {
    let moved = false;
    let movementData = { x: player.x, y: player.y, anim: "" };

    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-200);
        player.anims.play('walk_left', true);
        movementData.anim = 'walk_left';
        moved = true;
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.anims.play('walk_right', true);
        movementData.anim = 'walk_right';
        moved = true;
    } else if (cursors.up.isDown) {
        player.setVelocityY(-200);
        player.anims.play('walk_up', true);
        movementData.anim = 'walk_up';
        moved = true;
    } else if (cursors.down.isDown) {
        player.setVelocityY(200);
        player.anims.play('walk_down', true);
        movementData.anim = 'walk_down';
        moved = true;
    } else {
        player.anims.stop();
    }

    // Emit movement **only if player actually moved**
    if (moved) {
        movementData.x = player.x;
        movementData.y = player.y;
        socket.emit("playerMove", movementData);
    }
}
