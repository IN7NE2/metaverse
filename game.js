const socket = io(); // Server से connection बनाएगा

socket.on("connect", () => {
    console.log("Connected to server!", socket.id);
})


const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: { 
        default: "arcade",
        arcade: { 
            debug: true // Enable debug mode
        } 
    },
    scene: { preload, create, update }
};
let otherPlayers = {}; // other player data

let player;
let cursors;
const game = new Phaser.Game(config);

function preload() {
    this.load.spritesheet('player_01', 'assets/player_01.png', 
        { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('player_02', 'assets/player_02.png',
     { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('player_03', 'assets/player_03.png', 
    { frameWidth: 64, frameHeight: 64 });

    this.load.image('tree', 'assets/tree_02.png');
}

function create() {
    // Create player sprite

    socket.on("updatePlayers", (players) => {
        console.log("Received players data:", players);
        
        Object.keys(players).forEach((id) => {
            if (id !== socket.id) {
                if (!otherPlayers[id]) {
                    console.log(`🎮 Creating sprite for: ${id} at (${players[id].x}, ${players[id].y})`); // ✅ Debugging
    
                    otherPlayers[id] = this.physics.add.sprite(players[id].x, players[id].y, players[id].sprite);
                    otherPlayers[id].setCollideWorldBounds(true);
                } else {
                    console.log(`↔ Updating position for: ${id} at (${players[id].x}, ${players[id].y})`); // ✅ Debugging
                    
                    otherPlayers[id].x = players[id].x;
                    otherPlayers[id].y = players[id].y;
                }
            }
        });
    
        // Remove disconnected players
        Object.keys(otherPlayers).forEach((id) => {
            if (!players[id]) {
                console.log(`Removing sprite for: ${id}`); // ✅ DEBUGGING
                otherPlayers[id].destroy();
                delete otherPlayers[id];
            }
        });
    });
    
    const spriteList = ["player_01", "player_02", "player_03"];
    const randomSprite = spriteList[Math.floor(Math.random() * spriteList.length)];
    
    player = this.physics.add.sprite(400, 300, randomSprite);
    player.setCollideWorldBounds(true); // Optional: Prevent player from going out of the world bounds
    player.body.setSize(20, 50);
    player.body.setOffset(20, 17);
    // Create tree sprite as a static image
    tree = this.physics.add.staticImage(200, 200, 'tree');
    tree.setScale(0.06); 
    
    



    // Adjust the collision body size and offset for the tree
    

    // Enable collision between player and tree
    const collider = this.physics.add.collider(player, tree);
    
      // Create an invisible collision box
      const collisionBox = this.add.rectangle(200, 280, 45, 25, 0xff0000, 0); // (x, y, width, height, fill color, alpha)
      this.physics.add.existing(collisionBox); // Enable physics body for the rectangle
      collisionBox.body.setImmovable(true); // Make it immovable (like a wall)
      collisionBox.body.debugShowBody = true; // Enable debug graphics
      collisionBox.body.debugBodyColor = 0x00ff00; // Set debug box color to green
  
      // Enable collision between player and the collision box
      this.physics.add.collider(player, collisionBox);
  
      // Debug: Log physics bodies
      console.log(player.body); // Should log the player's physics body
      console.log(collisionBox.body); // Should log the collision box's physics body

    // Define W, A, S, D keys
    const keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D

            



    }

    

);

    // Store the keys in a variable for later use
    cursors = keys;

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
    let movementData = { x: player.x, y: player.y,anim:"" };

    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-200);
        player.anims.play('walk_left', true);
        movementData.anim='walk_left'
        moved = true;
    } 
    else if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.anims.play('walk_right', true);
        movementData.anim='walk_right'
        moved = true;
    } 
    else if (cursors.up.isDown) {
        player.setVelocityY(-200);
        player.anims.play('walk_up', true);
        movementData.anim='walk_up'
        moved = true;
    } 
    else if (cursors.down.isDown) {
        player.setVelocityY(200);
        player.anims.play('walk_down', true);
        movementData.anim='walk_down'
        moved = true;
    } 
    else {
        player.anims.stop();
        
    }
    // ✅ Emit movement **only if player actually moved**
    if (moved) {
        movementData.x = player.x;
        movementData.y = player.y;
        console.log("🚀 Emitting movement data:", movementData); // ✅ Debugging
        socket.emit("playerMove", movementData);
        }
    

}
