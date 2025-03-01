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
    this.load.spritesheet('player', 'assets/walk.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    this.load.image('tree', 'assets/tree_02.png');
}

function create() {
    // Create player sprite

    socket.on("updatePlayers", (players) => {
        Object.keys(players).forEach((id) => {
            if (id !== socket.id) { // Don't render yourself
                if (!otherPlayers[id]) {
                    // Create a new sprite for the new player
                    otherPlayers[id] = this.physics.add.sprite(players[id].x, players[id].y, "player");
                    otherPlayers[id].setCollideWorldBounds(true);
                } else {
                    // Update existing player position
                    otherPlayers[id].x = players[id].x;
                    otherPlayers[id].y = players[id].y;
                }
            }
        });
    
        // Remove disconnected players
        Object.keys(otherPlayers).forEach((id) => {
            if (!players[id]) {
                otherPlayers[id].destroy(); // Remove sprite
                delete otherPlayers[id];
            }
        });
    });
    

    player = this.physics.add.sprite(400, 300, 'player');
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
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_down',
        frames: this.anims.generateFrameNumbers('player', { start: 18, end: 26 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_left',
        frames: this.anims.generateFrameNumbers('player', { start: 9, end: 17 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_right',
        frames: this.anims.generateFrameNumbers('player', { start: 28, end: 35 }),
        frameRate: 10,
        repeat: -1
    });
}

// function update() {
//     player.setVelocity(0);
//     if (cursors.left.isDown || cursors.right.isDown || cursors.up.isDown || cursors.down.isDown) {
//         socket.emit("playerMove", { x: player.x, y: player.y });
//     }

//     if (cursors.left.isDown) {
//         player.setVelocityX(-200);
//         player.anims.play('walk_left', true);
//     } 
//     // if (cursors.left.isDown && cursors.up.isDown) {
//     //     player.setVelocityX(-200 * Math.SQRT1_2);
//     //     player.setVelocityY(-200 * Math.SQRT1_2);
//     //     player.anims.play('walk_left', true); // Or create a diagonal animation
//     // }
//     else if (cursors.right.isDown) {
//         player.setVelocityX(200);
//         player.anims.play('walk_right', true);
//     } 
//     else if (cursors.up.isDown) {
//         player.setVelocityY(-200);
//         player.anims.play('walk_up', true);
//     } 
//     else if (cursors.down.isDown) {
//         player.setVelocityY(200);
//         player.anims.play('walk_down', true);
//     } 

//     else {
//         player.anims.stop(); // Stop animation when idle
//     }
// }

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
        

    // ✅ Emit movement **only if player actually moved**
    if (moved) {
        movementData.x = player.x;
        movementData.y = player.y;
        socket.emit("playerMove", movementData);
        }
    }

}
const socket = io(); // Server से connection बनाएगा

socket.on("connect", () => {
    console.log("Connected to server!", socket.id);
})
