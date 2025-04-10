import "./style.css";

const NODE_SPACING = 10;

type CreatureNode = {
  radius: number;
  x: number;
  y: number;
  angle: number; // in radians
};

type Target = {
  x: number;
  y: number;
};

function initializeCanvas() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");
  canvas.width = 1200;
  canvas.height = 800;
  return { canvas, ctx };
}

function drawCreature(ctx: CanvasRenderingContext2D, creature: CreatureNode[]) {
  // Draw the creature body
  ctx.beginPath();
  ctx.fillStyle = "#ff0000"; // Bright red for fill

  // Start from the left side of the head
  const head = creature[0];
  ctx.moveTo(
    head.x + Math.cos(head.angle - Math.PI / 2) * head.radius,
    head.y + Math.sin(head.angle - Math.PI / 2) * head.radius
  );

  // Head's left intermediate
  ctx.lineTo(
    head.x + Math.cos(head.angle - Math.PI / 4) * head.radius,
    head.y + Math.sin(head.angle - Math.PI / 4) * head.radius
  );

  // Head's forward point
  ctx.lineTo(
    head.x + Math.cos(head.angle) * head.radius,
    head.y + Math.sin(head.angle) * head.radius
  );

  // Head's right intermediate
  ctx.lineTo(
    head.x + Math.cos(head.angle + Math.PI / 4) * head.radius,
    head.y + Math.sin(head.angle + Math.PI / 4) * head.radius
  );

  // Head's right side
  ctx.lineTo(
    head.x + Math.cos(head.angle + Math.PI / 2) * head.radius,
    head.y + Math.sin(head.angle + Math.PI / 2) * head.radius
  );

  // Connect through all body segments
  for (let i = 1; i < creature.length - 1; i++) {
    const node = creature[i];
    // Right side
    ctx.lineTo(
      node.x + Math.cos(node.angle + Math.PI / 2) * node.radius,
      node.y + Math.sin(node.angle + Math.PI / 2) * node.radius
    );
  }

  // Tail's right side
  const tail = creature[creature.length - 1];
  ctx.lineTo(
    tail.x + Math.cos(tail.angle + Math.PI / 2) * tail.radius,
    tail.y + Math.sin(tail.angle + Math.PI / 2) * tail.radius
  );

  // Tail's right intermediate
  ctx.lineTo(
    tail.x + Math.cos(tail.angle + (3 * Math.PI) / 4) * tail.radius,
    tail.y + Math.sin(tail.angle + (3 * Math.PI) / 4) * tail.radius
  );

  // Tail's back point
  ctx.lineTo(
    tail.x + Math.cos(tail.angle + Math.PI) * tail.radius,
    tail.y + Math.sin(tail.angle + Math.PI) * tail.radius
  );

  // Tail's left intermediate
  ctx.lineTo(
    tail.x + Math.cos(tail.angle - (3 * Math.PI) / 4) * tail.radius,
    tail.y + Math.sin(tail.angle - (3 * Math.PI) / 4) * tail.radius
  );

  // Tail's left side
  ctx.lineTo(
    tail.x + Math.cos(tail.angle - Math.PI / 2) * tail.radius,
    tail.y + Math.sin(tail.angle - Math.PI / 2) * tail.radius
  );

  // Connect back through all body segments
  for (let i = creature.length - 2; i > 0; i--) {
    const node = creature[i];
    // Left side
    ctx.lineTo(
      node.x + Math.cos(node.angle - Math.PI / 2) * node.radius,
      node.y + Math.sin(node.angle - Math.PI / 2) * node.radius
    );
  }

  // Close the path back to the head's left side
  ctx.closePath();
  ctx.fill();
}

function moveTowardsTarget(node: CreatureNode, target: Target, speed: number) {
  const dx = target.x - node.x;
  const dy = target.y - node.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 0.1) {
    // Calculate target angle
    const targetAngle = Math.atan2(dy, dx);
    
    // If we're close enough to the target, snap to the correct angle
    if (distance < 0.1) {
      node.angle = targetAngle;
    } else {
      // Calculate angle difference, ensuring it's between -PI and PI
      let angleDiff = targetAngle - node.angle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // Gradually adjust angle when far away
      node.angle += angleDiff * 0.1;
    }
    
    // Calculate easing factor based on distance
    // More gradual easing with smaller distance thresholds
    const easingFactor = Math.min(1, Math.min(distance / 100, distance / 20));
    const currentSpeed = speed * easingFactor;
    
    // Add oscillation to head angle while moving
    // Scale oscillation based on both distance and speed
    const maxOscillation = 0.07; // Maximum oscillation amplitude (about 1.7 degrees)
    const distanceScale = Math.min(1, distance / 50); // Scale down when closer than 50 pixels
    const oscillation = Math.sin(Date.now() * 0.003) * maxOscillation * distanceScale * (currentSpeed / speed);
    node.angle += oscillation;
    
    // Move in current direction with eased speed
    node.x += Math.cos(node.angle) * currentSpeed;
    node.y += Math.sin(node.angle) * currentSpeed;
  } else {
    // Snap to target when close enough
    node.x = target.x;
    node.y = target.y;
    // Keep the last angle when stopped
  }
}

function updateFollowerNode(
  follower: CreatureNode,
  leader: CreatureNode,
  distance: number
) {
  const dx = leader.x - follower.x;
  const dy = leader.y - follower.y;
  const currentDistance = Math.sqrt(dx * dx + dy * dy);

  if (currentDistance > 0) {
    const ratio = NODE_SPACING / currentDistance;
    follower.x = leader.x - dx * ratio;
    follower.y = leader.y - dy * ratio;

    // Calculate desired angle
    const desiredAngle = Math.atan2(dy, dx);

    // Calculate angle difference, ensuring it's between -PI and PI
    let angleDiff = desiredAngle - leader.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Constrain angle difference to between -45 and +45 degrees (π/4 radians)
    if (angleDiff > Math.PI / 4) {
      angleDiff = Math.PI / 4;
    } else if (angleDiff < -Math.PI / 4) {
      angleDiff = -Math.PI / 4;
    }

    // Set the follower's angle based on the constrained difference
    follower.angle = leader.angle + angleDiff;

    // Update position to maintain distance with new angle
    follower.x = leader.x - Math.cos(follower.angle) * NODE_SPACING;
    follower.y = leader.y - Math.sin(follower.angle) * NODE_SPACING;
  }
}

function generateCreatureNodes(
  startX: number,
  startY: number,
  radiusValues?: number[]
): CreatureNode[] {
  const nodes: CreatureNode[] = [];
  const baseRadius = 25;
  const numNodes = radiusValues?.length;

  if (!numNodes) {
    throw new Error("No radius values provided");
  }

  for (let i = 0; i < numNodes; i++) {
    nodes.push({
      radius: radiusValues?.[i] ?? baseRadius - i * 2,
      x: startX + i * NODE_SPACING,
      y: startY,
      angle: Math.PI, // 180 degrees, pointing left
    });
  }

  return nodes;
}

// Initialize and start animation
const { canvas, ctx } = initializeCanvas();

// Create creature and target outside the animation loop
const creature = generateCreatureNodes(
  canvas.width / 2,
  canvas.height / 2,
  [
    15, 16, 18, 18, 18, 18, 17, 16, 15, 14, 14, 14, 13, 12, 11, 10, 9, 8, 7, 6,
    5,
  ] // Custom radius values for each node
);

const target: Target = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

// Handle mouse events
let isMouseDown = false;

canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) { // Left mouse button
    isMouseDown = true;
    updateTargetPosition(event);
  }
});

canvas.addEventListener("mouseup", (event) => {
  if (event.button === 0) { // Left mouse button
    isMouseDown = false;
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (isMouseDown) {
    updateTargetPosition(event);
  }
});

function updateTargetPosition(event: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  target.x = event.clientX - rect.left;
  target.y = event.clientY - rect.top;
}

function animate() {
  // Clear the canvas
  ctx.fillStyle = "#a8d5ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Move head towards target
  moveTowardsTarget(creature[0], target, 5);

  // Update follower nodes to maintain distance from their leaders
  for (let i = 1; i < creature.length; i++) {
    updateFollowerNode(creature[i], creature[i - 1], NODE_SPACING);
  }

  // Draw the creature
  drawCreature(ctx, creature);

  // Request next frame
  requestAnimationFrame(animate);
}

animate();
