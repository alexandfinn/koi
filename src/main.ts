import "./style.css";

interface Point {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  constraints: Array<{
    targetIndex: number;
    targetDistance: number;
    maxAngle: number;
  }>;
  radius: number;
}

function initializeCanvas() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");
  canvas.width = 1200;
  canvas.height = 800;
  return { canvas, ctx };
}

function createCreature(x: number, y: number): Point[] {
  const createSegment = (
    x: number,
    y: number,
    targetIndex: number | null,
    radius: number
  ): Point => ({
    x,
    y,
    targetX: x,
    targetY: y,
    constraints:
      targetIndex !== null
        ? [
            {
              targetIndex,
              targetDistance: 50,
              maxAngle: Math.PI / 12,
            },
          ]
        : [],
    radius,
  });

  return [
    createSegment(x, y, null, 8),
    createSegment(x + 50, y, 0, 10),
    createSegment(x + 100, y, 1, 15),
    createSegment(x + 150, y, 2, 10),
    createSegment(x + 200, y, 3, 8),
  ];
}

function interpolatePosition(
  current: number,
  target: number,
  speed: number
): number {
  const diff = target - current;
  if (Math.abs(diff) < speed) return target;
  return current + Math.sign(diff) * speed;
}

function updateHeadSegment(current: Point, time: number): Point {
  const speed = 5;
  const dx = current.targetX - current.x;
  const dy = current.targetY - current.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 10) {
    return {
      ...current,
      x: interpolatePosition(current.x, current.targetX, speed),
      y: interpolatePosition(current.y, current.targetY, speed),
    };
  }

  const baseAngle = Math.atan2(dy, dx);
  const angleModulation = Math.sin(time * 2) * (Math.PI / 12);
  const finalAngle = baseAngle + angleModulation;

  return {
    ...current,
    x: current.x + Math.cos(finalAngle) * speed,
    y: current.y + Math.sin(finalAngle) * speed,
  };
}

function constrainSegmentAngle(
  target: { x: number; y: number },
  prevPoint: Point,
  prevPrevPoint: Point,
  constraint: Point["constraints"][0]
): { x: number; y: number } {
  const v1x = prevPoint.x - prevPrevPoint.x;
  const v1y = prevPoint.y - prevPrevPoint.y;
  const v2x = target.x - prevPoint.x;
  const v2y = target.y - prevPoint.y;

  const dot = v1x * v2x + v1y * v2y;
  const det = v1x * v2y - v1y * v2x;
  const angle = Math.atan2(det, dot);

  if (Math.abs(angle) <= constraint.maxAngle) {
    return { x: target.x, y: target.y };
  }

  const sign = Math.sign(angle);
  const limitedAngle = sign * constraint.maxAngle;
  const v1Length = Math.sqrt(v1x * v1x + v1y * v1y);
  const normalizedV1x = v1x / v1Length;
  const normalizedV1y = v1y / v1Length;

  const cos = Math.cos(limitedAngle);
  const sin = Math.sin(limitedAngle);
  const rotatedX = normalizedV1x * cos - normalizedV1y * sin;
  const rotatedY = normalizedV1x * sin + normalizedV1y * cos;

  return {
    x: prevPoint.x + rotatedX * constraint.targetDistance,
    y: prevPoint.y + rotatedY * constraint.targetDistance,
  };
}

function updateSegmentPosition(
  current: Point,
  points: Point[],
  index: number,
  time: number
): Point {
  if (index === 0) {
    return updateHeadSegment(current, time);
  }

  const constraint = current.constraints[0];
  const target = points[constraint.targetIndex];

  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  let targetPos = {
    x: target.x - (dx / distance) * constraint.targetDistance,
    y: target.y - (dy / distance) * constraint.targetDistance,
  };

  if (index > 1) {
    targetPos = constrainSegmentAngle(
      targetPos,
      points[index - 1],
      points[index - 2],
      constraint
    );
  }

  const speed = 4 * (1 - index * 0.15);
  const newX = interpolatePosition(current.x, targetPos.x, speed);
  const newY = interpolatePosition(current.y, targetPos.y, speed);

  const dx2 = newX - target.x;
  const dy2 = newY - target.y;
  const currentDistance = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  if (Math.abs(currentDistance - constraint.targetDistance) > 0.1) {
    const scale = constraint.targetDistance / currentDistance;
    return {
      ...current,
      x: target.x + dx2 * scale,
      y: target.y + dy2 * scale,
    };
  }

  return {
    ...current,
    x: newX,
    y: newY,
  };
}

function renderCreature(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  points: Point[]
) {
  // Background
  ctx.fillStyle = "#8ba3b8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw connecting lines
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw points
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 8;
    ctx.stroke();
  });
}

// Animation and initialization
function initializeAnimation() {
  const { canvas, ctx } = initializeCanvas();
  let creature = createCreature(canvas.width / 2, canvas.height / 2);
  let time = 0;

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    creature[0].targetX = e.clientX - rect.left;
    creature[0].targetY = e.clientY - rect.top;
  });

  function animate() {
    time += 0.05;
    for (let i = 0; i < creature.length; i++) {
      creature[i] = updateSegmentPosition(creature[i], creature, i, time);
    }
    renderCreature(ctx, canvas, creature);
    requestAnimationFrame(animate);
  }

  animate();
}

document.addEventListener("DOMContentLoaded", initializeAnimation);
