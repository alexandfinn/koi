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

// Particle type for underwater background effect
type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  depth: number; // 0-1 value representing how "deep" the particle is
};

// Function to create a particle
function createParticle(canvasWidth: number, canvasHeight: number, depth: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: 1 + Math.random() * 3 * (1 - depth), // Larger particles appear closer
    speedX: (Math.random() - 0.5) * 0.5 * (1 - depth), // Slower movement for deeper particles
    speedY: (Math.random() - 0.5) * 0.5 * (1 - depth),
    opacity: 0.1 + Math.random() * 0.3 * (1 - depth), // Less opacity for deeper particles
    depth: depth
  };
}

// Function to update a particle
function updateParticle(particle: Particle, canvasWidth: number, canvasHeight: number) {
  // Move the particle
  particle.x += particle.speedX;
  particle.y += particle.speedY;
  
  // Wrap around the screen
  if (particle.x < 0) particle.x = canvasWidth;
  if (particle.x > canvasWidth) particle.x = 0;
  if (particle.y < 0) particle.y = canvasHeight;
  if (particle.y > canvasHeight) particle.y = 0;
}

// Function to draw a particle
function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
  ctx.fill();
}

// Function to create multiple particle layers
function createParticleLayers(canvasWidth: number, canvasHeight: number, numLayers: number, particlesPerLayer: number): Particle[][] {
  const layers: Particle[][] = [];
  
  for (let i = 0; i < numLayers; i++) {
    const depth = i / (numLayers - 1); // 0 to 1
    const layer: Particle[] = [];
    
    for (let j = 0; j < particlesPerLayer; j++) {
      layer.push(createParticle(canvasWidth, canvasHeight, depth));
    }
    
    layers.push(layer);
  }
  
  return layers;
}

function initializeCanvas() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");

  // Create a second canvas for the pixelation effect
  const pixelCanvas = document.createElement('canvas');
  const pixelCtx = pixelCanvas.getContext('2d');
  if (!pixelCtx) throw new Error("Failed to get 2d context for pixel canvas");

  function resizeCanvas() {
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
  // Define fin positions and properties
  const firstFinNodeIndex = Math.floor(creature.length / 3);
  const secondFinNodeIndex = Math.floor(creature.length * 2 / 3);
  const firstFinNode = creature[firstFinNodeIndex];
  const secondFinNode = creature[secondFinNodeIndex];
  const firstPredNode = creature[firstFinNodeIndex - 1];
  const secondPredNode = creature[secondFinNodeIndex - 1];
  
  // Calculate total curvature for dorsal fin
  let totalCurvature = 0;
  for (let i = 1; i < creature.length; i++) {
    const angleDiff = creature[i].angle - creature[i-1].angle;
    totalCurvature += angleDiff;
  }
  
  // Normalize curvature to a reasonable range for the fin - more subtle
  const normalizedCurvature = Math.min(1, Math.abs(totalCurvature) / 10); // Reduced sensitivity
  const dorsalFinHeight = 20 + normalizedCurvature * 40; // Reduced height range for more subtlety
  
  // Determine the direction of curvature (positive = curving right, negative = curving left)
  const curvatureDirection = Math.sign(totalCurvature);
  
  // Define dorsal fin points - just two points
  const dorsalFinStartIndex = Math.floor(creature.length * 0.35); // Start at 35% of the body (moved from 30%)
  const dorsalFinEndIndex = Math.floor(creature.length * 0.45);   // End at 45% of the body (moved from 50%)
  
  const startX = creature[dorsalFinStartIndex].x;
  const startY = creature[dorsalFinStartIndex].y;
  const endX = creature[dorsalFinEndIndex].x;
  const endY = creature[dorsalFinEndIndex].y;
  
  // Calculate control points for the Bezier curves
  // The angle offset is now based on the curvature direction but more subtle
  const angleOffset = Math.PI/3 * curvatureDirection * normalizedCurvature; // Reduced angle range
  
  const cp1x = startX + Math.cos(creature[dorsalFinStartIndex].angle - angleOffset) * dorsalFinHeight;
  const cp1y = startY + Math.sin(creature[dorsalFinStartIndex].angle - angleOffset) * dorsalFinHeight;
  const cp2x = endX + Math.cos(creature[dorsalFinEndIndex].angle - angleOffset) * dorsalFinHeight;
  const cp2y = endY + Math.sin(creature[dorsalFinEndIndex].angle - angleOffset) * dorsalFinHeight;
  
  // Koi fins are more rounded and flowing
  const leftFin: Fin = {
    width: 140,  // Wider fins
    height: 70,  // Taller fins
    offsetX: -18,
    offsetY: -50,
    angle: Math.PI / 3.2  // Slightly adjusted angle
  };

  const rightFin: Fin = {
    width: 140,  // Wider fins
    height: 70,  // Taller fins
    offsetX: -18,
    offsetY: 50,
    angle: -Math.PI / 3.2  // Slightly adjusted angle
  };

  const backLeftFin: Fin = {
    width: 85,   // Wider back fins
    height: 42,  // Taller back fins
    offsetX: -10,
    offsetY: -30,
    angle: Math.PI / 3.2  // Slightly adjusted angle
  };

  const backRightFin: Fin = {
    width: 85,   // Wider back fins
    height: 42,  // Taller back fins
    offsetX: -10,
    offsetY: 30,
    angle: -Math.PI / 3.2  // Slightly adjusted angle
  };

  // Draw fins first (so they appear below the fish)
  // First set of fins
  // Left fin
  ctx.save();
  ctx.translate(firstFinNode.x, firstFinNode.y);
  const firstFinAngle = firstFinNode.angle + leftFin.angle - (firstFinNode.angle - firstPredNode.angle) * 3.2;
  ctx.rotate(firstFinAngle);
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
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  ctx.restore();

  // Right fin
  ctx.save();
  ctx.translate(firstFinNode.x, firstFinNode.y);
  const firstRightFinAngle = firstFinNode.angle + rightFin.angle - (firstFinNode.angle - firstPredNode.angle) * 3.2;
  ctx.rotate(firstRightFinAngle);
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
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  ctx.restore();

  // Second set of fins
  // Left fin
  ctx.save();
  ctx.translate(secondFinNode.x, secondFinNode.y);
  const secondFinAngle = secondFinNode.angle + backLeftFin.angle - (secondFinNode.angle - secondPredNode.angle) * 3.2;
  ctx.rotate(secondFinAngle);
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
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  ctx.restore();

  // Right fin
  ctx.save();
  ctx.translate(secondFinNode.x, secondFinNode.y);
  const secondRightFinAngle = secondFinNode.angle + backRightFin.angle - (secondFinNode.angle - secondPredNode.angle) * 3.2;
  ctx.rotate(secondRightFinAngle);
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
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  ctx.restore();

  // Draw the creature body with koi-like shape and colors
  ctx.beginPath();
  
  // Create a gradient for the koi body
  const bodyGradient = ctx.createLinearGradient(
    creature[0].x - creature[0].radius * 2,
    creature[0].y,
    creature[creature.length - 1].x + creature[creature.length - 1].radius * 2,
    creature[creature.length - 1].y
  );
  
  // Koi colors - orange-red base with white patches
  bodyGradient.addColorStop(0, "#ff9d5c");  // Orange-red at head
  bodyGradient.addColorStop(0.3, "#ff7e5f"); // Deeper orange in middle
  bodyGradient.addColorStop(0.7, "#ff6b6b"); // Reddish-orange toward tail
  bodyGradient.addColorStop(1, "#ff5252");   // Bright red at tail
  
  ctx.fillStyle = bodyGradient;

  // Start from the left side of the head - make it more rounded for koi
  ctx.moveTo(
    creature[0].x + Math.cos(creature[0].angle - Math.PI / 2) * creature[0].radius * 0.9,
    creature[0].y + Math.sin(creature[0].angle - Math.PI / 2) * creature[0].radius * 0.9
  );

  // Head's left intermediate - more rounded
  ctx.lineTo(
    creature[0].x + Math.cos(creature[0].angle - Math.PI / 4) * creature[0].radius * 0.95,
    creature[0].y + Math.sin(creature[0].angle - Math.PI / 4) * creature[0].radius * 0.95
  );

  // Head's forward point - less pronounced
  ctx.lineTo(
    creature[0].x + Math.cos(creature[0].angle) * creature[0].radius * 0.6, // Reduced from 0.8
    creature[0].y + Math.sin(creature[0].angle) * creature[0].radius * 0.6  // Reduced from 0.8
  );

  // Head's right intermediate - more rounded
  ctx.lineTo(
    creature[0].x + Math.cos(creature[0].angle + Math.PI / 4) * creature[0].radius * 0.95,
    creature[0].y + Math.sin(creature[0].angle + Math.PI / 4) * creature[0].radius * 0.95
  );

  // Head's right side - more rounded
  ctx.lineTo(
    creature[0].x + Math.cos(creature[0].angle + Math.PI / 2) * creature[0].radius * 0.9,
    creature[0].y + Math.sin(creature[0].angle + Math.PI / 2) * creature[0].radius * 0.9
  );

  // Connect through all body segments - make body more rounded for koi
  for (let i = 1; i < creature.length - 1; i++) {
    const node = creature[i];
    // Right side - make body more rounded
    ctx.lineTo(
      node.x + Math.cos(node.angle + Math.PI / 2) * node.radius * 0.95,
      node.y + Math.sin(node.angle + Math.PI / 2) * node.radius * 0.95
    );
  }

  // Tail's right side - make it more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle + Math.PI / 2) * creature[creature.length - 1].radius * 0.9,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle + Math.PI / 2) * creature[creature.length - 1].radius * 0.9
  );

  // Tail's right intermediate - more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle + (3 * Math.PI) / 4) * creature[creature.length - 1].radius * 0.8,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle + (3 * Math.PI) / 4) * creature[creature.length - 1].radius * 0.8
  );

  // Tail's back point - more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle + Math.PI) * creature[creature.length - 1].radius * 0.7,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle + Math.PI) * creature[creature.length - 1].radius * 0.7
  );

  // Tail's left intermediate - more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle - (3 * Math.PI) / 4) * creature[creature.length - 1].radius * 0.8,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle - (3 * Math.PI) / 4) * creature[creature.length - 1].radius * 0.8
  );

  // Tail's left side - more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle - Math.PI / 2) * creature[creature.length - 1].radius * 0.9,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle - Math.PI / 2) * creature[creature.length - 1].radius * 0.9
  );

  // Connect back through all body segments - make body more rounded for koi
  for (let i = creature.length - 2; i > 0; i--) {
    const node = creature[i];
    // Left side - make body more rounded
    ctx.lineTo(
      node.x + Math.cos(node.angle - Math.PI / 2) * node.radius * 0.95,
      node.y + Math.sin(node.angle - Math.PI / 2) * node.radius * 0.95
    );
  }

  // Close the path back to the head's left side
  ctx.closePath();
  ctx.fill();
  
  // Add a brighter highlight line across the back
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; // Semi-transparent white
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  // Start from the third node
  const startNodeIndex = 2;
  const endNodeIndex = creature.length - 3;
  
  // Draw a smooth curve along the back
  ctx.moveTo(
    creature[startNodeIndex].x + Math.cos(creature[startNodeIndex].angle) * creature[startNodeIndex].radius * 0.5,
    creature[startNodeIndex].y + Math.sin(creature[startNodeIndex].angle) * creature[startNodeIndex].radius * 0.5
  );
  
  // Use quadratic curves to create a smooth line
  for (let i = startNodeIndex + 1; i <= endNodeIndex; i++) {
    const node = creature[i];
    const prevNode = creature[i - 1];
    
    // Calculate control point between nodes
    const controlX = (node.x + prevNode.x) / 2;
    const controlY = (node.y + prevNode.y) / 2;
    
    // Calculate point on the back
    const pointX = node.x + Math.cos(node.angle) * node.radius * 0.5;
    const pointY = node.y + Math.sin(node.angle) * node.radius * 0.5;
    
    ctx.quadraticCurveTo(controlX, controlY, pointX, pointY);
  }
  
  ctx.stroke();
  ctx.restore();
  
  // Add koi patterns (spots) to the body
  ctx.save();
  ctx.globalAlpha = 0.7; // Semi-transparent spots
  
  // Draw several spots on the body with fixed positions
  const bodySpotPositions = [
    { offset: 0.3, size: 6 },
    { offset: 0.5, size: 7 },
    { offset: 0.7, size: 5 },
    { offset: 0.9, size: 8 }
  ];
  
  for (let i = 2; i < creature.length - 3; i += 3) {
    const node = creature[i];
    const spotIndex = Math.floor((i - 2) / 3) % bodySpotPositions.length;
    const { offset, size } = bodySpotPositions[spotIndex];
    
    // Fixed position on the body
    const spotAngle = node.angle + Math.PI / 4;
    const spotDistance = node.radius * offset;
    
    const spotX = node.x + Math.cos(spotAngle) * spotDistance;
    const spotY = node.y + Math.sin(spotAngle) * spotDistance;
    
    // Draw the spot
    ctx.beginPath();
    ctx.arc(spotX, spotY, size, 0, Math.PI * 2);
    ctx.fillStyle = "#ff9d5c"; // Orange spots
    ctx.fill();
  }
  
  ctx.restore();

  // Draw dorsal fin AFTER the body (so it appears on top)
  ctx.save();
  ctx.strokeStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.lineWidth = 5; // Increased line width for better visibility
  
  // Draw the dorsal fin with two points and Bezier curves
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
  ctx.stroke();
  
  // Fill the dorsal fin for better visibility
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
  ctx.lineTo(endX, endY);
  ctx.lineTo(startX, startY);
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  
  // Add orange spots to the dorsal fin with fixed positions
  ctx.save();
  ctx.globalAlpha = 0.8; // Slightly more opaque spots on the fin
  
  // Fixed positions for dorsal fin spots
  const finSpotPositions = [
    { t: 0.3, size: 4 },
    { t: 0.6, size: 3 }
  ];
  
  // Draw spots on the dorsal fin
  for (const { t, size } of finSpotPositions) {
    // Calculate position along the Bezier curve
    const mt = 1 - t;
    const x = mt * mt * startX + 2 * mt * t * cp1x + t * t * endX;
    const y = mt * mt * startY + 2 * mt * t * cp1y + t * t * endY;
    
    // Draw the spot
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = "#ff9d5c"; // Orange spots
    ctx.fill();
  }
  
  ctx.restore();
  ctx.restore();

  // Draw tail fin that responds to curvature
  const tailFinStartIndex = creature.length - 1; // Last node (tail tip)
  
  // Calculate a point behind the tail tip for the tail fin
  const tailTipAngle = creature[tailFinStartIndex].angle;
  const tailExtension = 0; // Reduced from 20 to 0 to position the fin 20px closer to the tail
  
  // Position the tail fin behind the tail tip
  const tailStartX = creature[tailFinStartIndex].x - Math.cos(tailTipAngle) * tailExtension;
  const tailStartY = creature[tailFinStartIndex].y - Math.sin(tailTipAngle) * tailExtension;
  const tailEndX = tailStartX - Math.cos(tailTipAngle) * tailExtension;
  const tailEndY = tailStartY - Math.sin(tailTipAngle) * tailExtension;
  
  // Tail fin height is also based on curvature but can be larger than dorsal fin
  const tailFinHeight = 45 + normalizedCurvature * 90; // Increased for koi's flowing tail
  
  // For tail fin, we want to curve in the opposite direction of the fish's curvature
  // This makes the tail fin act like a rudder
  // Use a smoother transition function that's more gradual near zero curvature
  // This creates a more natural movement with less sudden changes
  const smoothCurvature = (curvature: number) => {
    // Sigmoid-like function that's more gradual near zero
    // This creates a smoother transition with less sensitivity to small changes
    return Math.tanh(curvature * 2) * 0.5;
  };
  
  const tailAngleOffset = -Math.PI/2 * curvatureDirection * smoothCurvature(normalizedCurvature);
  
  // Calculate control points for the tail fin Bezier curve
  // Changed shape to be broader as it extends back
  const tailCp1x = tailStartX + Math.cos(tailTipAngle - Math.PI + tailAngleOffset) * tailFinHeight;
  const tailCp1y = tailStartY + Math.sin(tailTipAngle - Math.PI + tailAngleOffset) * tailFinHeight;
  
  // Create a broader tail by having the second control point extend further and wider
  const tailCp2x = tailEndX + Math.cos(tailTipAngle - Math.PI + tailAngleOffset) * (tailFinHeight * 2);
  const tailCp2y = tailEndY + Math.sin(tailTipAngle - Math.PI + tailAngleOffset) * (tailFinHeight * 2);
  
  // Draw the tail fin
  ctx.save();
  ctx.strokeStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.lineWidth = 5;
  
  // Draw the tail fin outline with a more complex shape
  ctx.beginPath();
  ctx.moveTo(tailStartX, tailStartY);
  
  // First curve to create the main body of the tail
  ctx.bezierCurveTo(tailCp1x, tailCp1y, tailCp2x, tailCp2y, tailEndX, tailEndY);
  
  // Remove the notch/fork at the end for a more unified tail fin
  
  ctx.stroke();
  
  // Fill the tail fin
  ctx.beginPath();
  ctx.moveTo(tailStartX, tailStartY);
  ctx.bezierCurveTo(tailCp1x, tailCp1y, tailCp2x, tailCp2y, tailEndX, tailEndY);
  ctx.lineTo(tailStartX, tailStartY);
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  
  // Add a side view of the tail fin that's much more pronounced based on curvature
  // This creates a more visible side profile when the fish is curving
  const sideViewHeight = 70 + normalizedCurvature * 140; // Much taller side view for koi
  const sideViewWidth = 35 + normalizedCurvature * 70; // Wider side view for koi
  
  // Calculate the side view points - positioned perpendicular to the tail's direction
  const sideViewAngle = tailTipAngle - Math.PI/2; // Perpendicular to tail direction
  
  // Create a more pronounced side view that's visible when the fish is curving
  // Use a smoother transition to avoid sudden flips
  const sideViewStartX = tailStartX + Math.cos(sideViewAngle) * sideViewWidth * smoothCurvature(curvatureDirection * normalizedCurvature);
  const sideViewStartY = tailStartY + Math.sin(sideViewAngle) * sideViewWidth * smoothCurvature(curvatureDirection * normalizedCurvature);
  
  const sideViewEndX = tailEndX + Math.cos(sideViewAngle) * sideViewWidth * smoothCurvature(curvatureDirection * normalizedCurvature);
  const sideViewEndY = tailEndY + Math.sin(sideViewAngle) * sideViewWidth * smoothCurvature(curvatureDirection * normalizedCurvature);
  
  // Draw the side view of the tail fin
  ctx.beginPath();
  ctx.moveTo(sideViewStartX, sideViewStartY);
  
  // Create a more pronounced curve for the side view with smoother transitions
  // Use the same base angle for both control points to avoid sudden flips
  // Use a more gradual angle change for smoother transitions
  const baseSideAngle = tailTipAngle - Math.PI + Math.PI/6 * smoothCurvature(curvatureDirection * normalizedCurvature);
  
  // Use a more gradual curve for the side view
  const sideViewCp1x = sideViewStartX + Math.cos(baseSideAngle) * sideViewHeight * 0.4;
  const sideViewCp1y = sideViewStartY + Math.sin(baseSideAngle) * sideViewHeight * 0.4;
  
  const sideViewCp2x = sideViewEndX + Math.cos(baseSideAngle) * sideViewHeight * 0.4;
  const sideViewCp2y = sideViewEndY + Math.sin(baseSideAngle) * sideViewHeight * 0.4;
  
  // Use a smoother Bezier curve for the side view
  ctx.bezierCurveTo(sideViewCp1x, sideViewCp1y, sideViewCp2x, sideViewCp2y, sideViewEndX, sideViewEndY);
  
  // Connect the side view to the main tail fin for a unified look
  // Use a smooth curve to connect the side view to the main tail fin
  ctx.lineTo(tailEndX, tailEndY);
  ctx.lineTo(tailStartX, tailStartY);
  ctx.lineTo(sideViewStartX, sideViewStartY);
  
  ctx.strokeStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.lineWidth = 5;
  ctx.stroke();
  
  // Fill the side view
  ctx.beginPath();
  ctx.moveTo(sideViewStartX, sideViewStartY);
  ctx.bezierCurveTo(sideViewCp1x, sideViewCp1y, sideViewCp2x, sideViewCp2y, sideViewEndX, sideViewEndY);
  ctx.lineTo(tailEndX, tailEndY);
  ctx.lineTo(tailStartX, tailStartY);
  ctx.lineTo(sideViewStartX, sideViewStartY);
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  
  // Add a subtle gradient to the tail fin for a more natural look
  const gradient = ctx.createLinearGradient(tailStartX, tailStartY, tailEndX, tailEndY);
  gradient.addColorStop(0, "#ff6b6b"); // Lighter red for koi fins
  gradient.addColorStop(1, "#ff5252"); // Brighter red at the tip
  
  // Apply the gradient to the tail fin
  ctx.beginPath();
  ctx.moveTo(tailStartX, tailStartY);
  ctx.bezierCurveTo(tailCp1x, tailCp1y, tailCp2x, tailCp2y, tailEndX, tailEndY);
  ctx.lineTo(tailStartX, tailStartY);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.restore();

  // Draw eyes - koi have more expressive eyes
  const leftEye: Eye = {
    radius: 14, // Larger eyes
    offsetX: -18,
    offsetY: -28
  };

  const rightEye: Eye = {
    radius: 14, // Larger eyes
    offsetX: -18,
    offsetY: 28
  };

  // Draw left eye
  ctx.beginPath();
  ctx.fillStyle = "#FFFFFF";
  const leftEyeX = creature[0].x + Math.cos(creature[0].angle) * leftEye.offsetX - Math.sin(creature[0].angle) * leftEye.offsetY;
  const leftEyeY = creature[0].y + Math.sin(creature[0].angle) * leftEye.offsetX + Math.cos(creature[0].angle) * leftEye.offsetY;
  // Draw elliptical eye for foreshortening effect
  ctx.ellipse(leftEyeX, leftEyeY, leftEye.radius, leftEye.radius * 0.6, creature[0].angle, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw left eye pupil
  ctx.beginPath();
  ctx.fillStyle = "#000000";
  ctx.ellipse(leftEyeX, leftEyeY, leftEye.radius * 0.5, leftEye.radius * 0.3, creature[0].angle, 0, Math.PI * 2);
  ctx.fill();

  // Draw right eye
  ctx.beginPath();
  ctx.fillStyle = "#FFFFFF";
  const rightEyeX = creature[0].x + Math.cos(creature[0].angle) * rightEye.offsetX - Math.sin(creature[0].angle) * rightEye.offsetY;
  const rightEyeY = creature[0].y + Math.sin(creature[0].angle) * rightEye.offsetX + Math.cos(creature[0].angle) * rightEye.offsetY;
  // Draw elliptical eye for foreshortening effect
  ctx.ellipse(rightEyeX, rightEyeY, rightEye.radius, rightEye.radius * 0.6, creature[0].angle, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw right eye pupil
  ctx.beginPath();
  ctx.fillStyle = "#000000";
  ctx.ellipse(rightEyeX, rightEyeY, rightEye.radius * 0.5, rightEye.radius * 0.3, creature[0].angle, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw koi whiskers (barbels)
  ctx.save();
  ctx.strokeStyle = "#ff9d5c";
  ctx.lineWidth = 2; // Keeping them thin
  
  // Left whiskers - positioned even more forward at the mouth
  const leftWhiskerX = creature[0].x + Math.cos(creature[0].angle) * (-5) - Math.sin(creature[0].angle) * (-12);
  const leftWhiskerY = creature[0].y + Math.sin(creature[0].angle) * (-5) + Math.cos(creature[0].angle) * (-12);
  
  ctx.beginPath();
  ctx.moveTo(leftWhiskerX, leftWhiskerY);
  ctx.quadraticCurveTo(
    leftWhiskerX + Math.cos(creature[0].angle - Math.PI/4) * 35,
    leftWhiskerY + Math.sin(creature[0].angle - Math.PI/4) * 35,
    leftWhiskerX + Math.cos(creature[0].angle - Math.PI/3) * 55,
    leftWhiskerY + Math.sin(creature[0].angle - Math.PI/3) * 55
  );
  ctx.stroke();
  
  // Right whiskers - positioned even more forward at the mouth
  const rightWhiskerX = creature[0].x + Math.cos(creature[0].angle) * (-5) - Math.sin(creature[0].angle) * 12;
  const rightWhiskerY = creature[0].y + Math.sin(creature[0].angle) * (-5) + Math.cos(creature[0].angle) * 12;
  
  ctx.beginPath();
  ctx.moveTo(rightWhiskerX, rightWhiskerY);
  ctx.quadraticCurveTo(
    rightWhiskerX + Math.cos(creature[0].angle + Math.PI/4) * 35,
    rightWhiskerY + Math.sin(creature[0].angle + Math.PI/4) * 35,
    rightWhiskerX + Math.cos(creature[0].angle + Math.PI/3) * 55,
    rightWhiskerY + Math.sin(creature[0].angle + Math.PI/3) * 55
  );
  ctx.stroke();
  
  ctx.restore();
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
    // Use a combination of sine waves for more natural oscillation
    const maxOscillation = 0.05; 
    const distanceScale = distance < 120 ? 0 : Math.pow(Math.min(1, (distance - 120) / 100), 2);
    
    // Create a more complex oscillation pattern that works in all directions
    const time = Date.now() * 0.003;
    const primaryOscillation = Math.sin(time) * maxOscillation;
    const secondaryOscillation = Math.sin(time * 1.5) * maxOscillation * 0.5;
    const oscillation = (primaryOscillation + secondaryOscillation) * distanceScale;
    
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
  leader: CreatureNode
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

// Function to create a bubble particle
function createBubbleParticle(canvasWidth: number, canvasHeight: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: 2 + Math.random() * 4,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: (Math.random() - 0.5) * 0.5,
    opacity: 0.3 + Math.random() * 0.4,
    depth: Math.random() * 0.5
  };
}

// Function to update a bubble particle
function updateBubbleParticle(particle: Particle, canvasWidth: number, canvasHeight: number) {
  // Move the particle
  particle.x += particle.speedX;
  particle.y += particle.speedY;
  
  // Wrap around the screen
  if (particle.x < 0) particle.x = canvasWidth;
  if (particle.x > canvasWidth) particle.x = 0;
  if (particle.y < 0) particle.y = canvasHeight;
  if (particle.y > canvasHeight) particle.y = 0;
}

// Function to create bubble particles
function createBubbleParticles(canvasWidth: number, canvasHeight: number, count: number): Particle[] {
  const bubbles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    bubbles.push(createBubbleParticle(canvasWidth, canvasHeight));
  }
  
  return bubbles;
}

function animate() {
  // Clear the canvas with a radial gradient from center
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,  // Start at center
    canvas.width / 2, canvas.height / 2, canvas.width / 1.5  // End at edges
  );
  gradient.addColorStop(0, "#2a7a8a");  // Green-blue in the middle
  gradient.addColorStop(0.5, "#2a5a9a");  // Blue in the middle area
  gradient.addColorStop(1, "#1a4a7a");  // Darker blue at the edges
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add a subtle green tint overlay
  ctx.fillStyle = "rgba(100, 150, 100, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update and draw particles
  for (let layerIndex = 0; layerIndex < particleLayers.length; layerIndex++) {
    const layer = particleLayers[layerIndex];
    
    for (let i = 0; i < layer.length; i++) {
      updateParticle(layer[i], canvas.width, canvas.height);
      drawParticle(ctx, layer[i]);
    }
  }
  
  // Update and draw bubbles
  for (let i = 0; i < bubbleParticles.length; i++) {
    updateBubbleParticle(bubbleParticles[i], canvas.width, canvas.height);
    drawParticle(ctx, bubbleParticles[i]);
  }

  // Update keyboard movement
  updateKeyboardMovement();

  // Move head towards target
  moveTowardsTarget(creature[0], target, 5);

  // Update follower nodes to maintain distance from their leaders
  for (let i = 1; i < creature.length; i++) {
    updateFollowerNode(creature[i], creature[i - 1]);
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

// Initialize and start animation
const { canvas, ctx, pixelCanvas, pixelCtx } = initializeCanvas();

// Create creature and target outside the animation loop
const creature = generateCreatureNodes(
  canvas.width / 2,
  canvas.height / 2,
  [
    45, 48, 50, 52, 54, 54, 51, 48, 45, 42, 41, 40, 38, 33, 30, 27, 24, 21, 18,
    15, 10, 8
  ]
);

const target: Target = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

// Create particle layers for underwater effect
const particleLayers = createParticleLayers(canvas.width, canvas.height, 5, 50);

// Create bubble particles
const bubbleParticles = createBubbleParticles(canvas.width, canvas.height, 30);

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

// Add keyboard state tracking
const keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

// Add keyboard event listeners
window.addEventListener('keydown', (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      keys.up = true;
      break;
    case 's':
    case 'arrowdown':
      keys.down = true;
      break;
    case 'a':
    case 'arrowleft':
      keys.left = true;
      break;
    case 'd':
    case 'arrowright':
      keys.right = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      keys.up = false;
      break;
    case 's':
    case 'arrowdown':
      keys.down = false;
      break;
    case 'a':
    case 'arrowleft':
      keys.left = false;
      break;
    case 'd':
    case 'arrowright':
      keys.right = false;
      break;
  }
});

// Add keyboard movement update function
function updateKeyboardMovement() {
  const moveDistance = 250; // Distance to set target point
  
  // Calculate the direction vector based on pressed keys
  let dirX = 0;
  let dirY = 0;
  
  if (keys.up) dirY -= 1;
  if (keys.down) dirY += 1;
  if (keys.left) dirX -= 1;
  if (keys.right) dirX += 1;
  
  // If any movement keys are pressed
  if (dirX !== 0 || dirY !== 0) {
    // Normalize the direction vector
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    dirX /= length;
    dirY /= length;
    
    // Set target 250px away in that direction
    target.x = creature[0].x + dirX * moveDistance;
    target.y = creature[0].y + dirY * moveDistance;
  }
}

animate();
