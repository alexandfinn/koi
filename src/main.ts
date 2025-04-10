import "./style.css";

const NODE_SPACING = 30;

type CreatureNode = {
  radius: number;
  x: number;
  y: number;
  angle: number; // in radians
};

type Eye = {
  radius: number;
  offsetX: number;
  offsetY: number;
};

type Fin = {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  angle: number;
};

type Target = {
  x: number;
  y: number;
};

function initializeCanvas() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");

  // Create a second canvas for the pixelation effect
  const pixelCanvas = document.createElement('canvas');
  const pixelCtx = pixelCanvas.getContext('2d');
  if (!pixelCtx) throw new Error("Failed to get 2d context for pixel canvas");

  function resizeCanvas() {
    const pixelSize = 8; // Increased from 4 to 8 for more pixelation
    
    // Set the display size (css pixels)
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Set up the pixel canvas
    pixelCanvas.width = window.innerWidth;
    pixelCanvas.height = window.innerHeight;
  }

  // Set initial size
  resizeCanvas();

  // Add resize handler
  window.addEventListener('resize', resizeCanvas);

  return { canvas, ctx, pixelCanvas, pixelCtx };
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

  // Draw fins
  const firstFinNodeIndex = Math.floor(creature.length / 3);
  const secondFinNodeIndex = Math.floor(creature.length * 2 / 3);
  const firstFinNode = creature[firstFinNodeIndex];
  const secondFinNode = creature[secondFinNodeIndex];
  const firstPredNode = creature[firstFinNodeIndex - 1];
  const secondPredNode = creature[secondFinNodeIndex - 1];
  
  const leftFin: Fin = {
    width: 126,
    height: 63,
    offsetX: -15,
    offsetY: -45,
    angle: Math.PI / 3.5
  };

  const rightFin: Fin = {
    width: 126,
    height: 63,
    offsetX: -15,
    offsetY: 45,
    angle: -Math.PI / 3.5
  };

  const backLeftFin: Fin = {
    width: 63,
    height: 31.5,
    offsetX: -15,
    offsetY: -45,
    angle: Math.PI / 3.5
  };

  const backRightFin: Fin = {
    width: 63,
    height: 31.5,
    offsetX: -15,
    offsetY: 45,
    angle: -Math.PI / 3.5
  };

  // Draw first set of fins
  // Left fin
  ctx.save();
  ctx.translate(firstFinNode.x, firstFinNode.y);
  ctx.rotate(firstFinNode.angle + leftFin.angle + (firstFinNode.angle - firstPredNode.angle) * 0.5);
  ctx.beginPath();
  ctx.ellipse(
    leftFin.offsetX,
    leftFin.offsetY,
    leftFin.width / 2,
    leftFin.height / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#ff0000";
  ctx.fill();
  ctx.restore();

  // Right fin
  ctx.save();
  ctx.translate(firstFinNode.x, firstFinNode.y);
  ctx.rotate(firstFinNode.angle + rightFin.angle + (firstFinNode.angle - firstPredNode.angle) * 0.5);
  ctx.beginPath();
  ctx.ellipse(
    rightFin.offsetX,
    rightFin.offsetY,
    rightFin.width / 2,
    rightFin.height / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#ff0000";
  ctx.fill();
  ctx.restore();

  // Draw second set of fins
  // Left fin
  ctx.save();
  ctx.translate(secondFinNode.x, secondFinNode.y);
  ctx.rotate(secondFinNode.angle + backLeftFin.angle + (secondFinNode.angle - secondPredNode.angle) * 0.5);
  ctx.beginPath();
  ctx.ellipse(
    backLeftFin.offsetX,
    backLeftFin.offsetY,
    backLeftFin.width / 2,
    backLeftFin.height / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#ff0000";
  ctx.fill();
  ctx.restore();

  // Right fin
  ctx.save();
  ctx.translate(secondFinNode.x, secondFinNode.y);
  ctx.rotate(secondFinNode.angle + backRightFin.angle + (secondFinNode.angle - secondPredNode.angle) * 0.5);
  ctx.beginPath();
  ctx.ellipse(
    backRightFin.offsetX,
    backRightFin.offsetY,
    backRightFin.width / 2,
    backRightFin.height / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#ff0000";
  ctx.fill();
  ctx.restore();

  // Draw eyes
  const leftEye: Eye = {
    radius: 12,
    offsetX: -15,
    offsetY: -25
  };

  const rightEye: Eye = {
    radius: 12,
    offsetX: -15,
    offsetY: 25
  };

  // Draw left eye
  ctx.beginPath();
  ctx.fillStyle = "#FFFFFF";
  const leftEyeX = head.x + Math.cos(head.angle) * leftEye.offsetX - Math.sin(head.angle) * leftEye.offsetY;
  const leftEyeY = head.y + Math.sin(head.angle) * leftEye.offsetX + Math.cos(head.angle) * leftEye.offsetY;
  ctx.arc(leftEyeX, leftEyeY, leftEye.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw right eye
  ctx.beginPath();
  const rightEyeX = head.x + Math.cos(head.angle) * rightEye.offsetX - Math.sin(head.angle) * rightEye.offsetY;
  const rightEyeY = head.y + Math.sin(head.angle) * rightEye.offsetX + Math.cos(head.angle) * rightEye.offsetY;
  ctx.arc(rightEyeX, rightEyeY, rightEye.radius, 0, Math.PI * 2);
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
    
    // Add oscillation to head angle while moving, but only when far from target
    const maxOscillation = 0.07;
    const distanceScale = distance < 120 ? 0 : Math.pow(Math.min(1, (distance - 120) / 100), 2);
    const oscillation = Math.sin(Date.now() * 0.003) * maxOscillation * distanceScale;
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

    // Constrain angle difference to between -20 and +20 degrees (π/9 radians)
    if (angleDiff > Math.PI / 9) {
      angleDiff = Math.PI / 9;
    } else if (angleDiff < -Math.PI / 9) {
      angleDiff = -Math.PI / 9;
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
const { canvas, ctx, pixelCanvas, pixelCtx } = initializeCanvas();

// Create creature and target outside the animation loop
const creature = generateCreatureNodes(
  canvas.width / 2,
  canvas.height / 2,
  [
    45, 48, 54, 54, 54, 54, 51, 48, 45, 42, 42, 42, 39, 36, 33, 30, 27, 24, 21, 18,
    15
  ] // Custom radius values for each node
);

const target: Target = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

// Add the pixel canvas to the DOM
document.body.appendChild(pixelCanvas);
pixelCanvas.style.position = 'absolute';
pixelCanvas.style.top = '0';
pixelCanvas.style.left = '0';
pixelCanvas.style.zIndex = '1';
pixelCanvas.style.pointerEvents = 'none'; // Make pixel canvas non-interactive
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '0';

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

  // Apply pixelation effect
  pixelCtx.imageSmoothingEnabled = false;
  pixelCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, pixelCanvas.width / 8, pixelCanvas.height / 8);
  pixelCtx.drawImage(pixelCanvas, 0, 0, pixelCanvas.width / 8, pixelCanvas.height / 8, 0, 0, pixelCanvas.width, pixelCanvas.height);

  // Request next frame
  requestAnimationFrame(animate);
}

animate();
