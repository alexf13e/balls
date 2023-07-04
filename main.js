
let cnvMain = document.getElementById("cnvMain");
let ctxMain = cnvMain.getContext("2d");

let inpStatic = document.getElementById("inpStatic");
let inpDynamic = document.getElementById("inpDynamic");

let balls = [];
let prevFrameTime = Date.now();

let userTargetBall = null;
let userDragging = false;
let userDragPos = new Vec2(0, 0);

let ballFriction = 0.3;

cnvMain.addEventListener("mousedown", (e) => {
    let mousePos = mouseToCanvasPos(e.x, e.y);

    //find target ball (if any)
    for (let ball of balls)
    {
        if (ball.getPosition().sub(mousePos).length() < ball.getRadius())
        {
            userTargetBall = ball;
            userDragging = true;
            userDragPos = mousePos;
            break;
        }
    }
});

cnvMain.addEventListener("mouseup", (e) => {
    if (userDragging)
    {
        userDragging = false;
        let mousePos = mouseToCanvasPos(e.x, e.y);
        let vel = userTargetBall.getPosition().sub(mousePos);
        vel.x *= 5;
        vel.y *= 5;
        userTargetBall.setVelocity(userTargetBall.getVelocity().add(vel));
        userTargetBall = null;
    }
});

cnvMain.addEventListener("mousemove", (e) => {
    if (userDragging) userDragPos = mouseToCanvasPos(e.x, e.y);
});

init();

function init()
{
    let offset = new Vec2(800, 360);
    balls.push(new Ball(400, offset.y, 10));

    balls.push(new Ball(offset.x, offset.y, 10));

    for (let column = 1; column <= 4; column++)
    {
        let start = g(column * 2, 30);
        let end = g(column * 2, -30);
        let divisions = column;

        balls.push(new Ball(offset.x + start.x, offset.y + start.y, 10));
        for (let d = 1; d < divisions; d++)
        {
            let p = start.mul(1 - d/divisions).add(end.mul(d/divisions));
            balls.push(new Ball(offset.x + p.x, offset.y + p.y, 10));
        }
        balls.push(new Ball(offset.x + end.x, offset.y + end.y, 10));
    }

    update();
}

function g(r, t)
{
    t = t / 180 * Math.PI;
    return new Vec2(Math.cos(t) * r * 10, Math.sin(t) * r * 10);
}

function update()
{
    requestAnimationFrame(update);
    let dt = (Date.now() - prevFrameTime) / 1000;
    prevFrameTime = Date.now();

    //move balls by the velocities they were given last frame
    for (let ball of balls)
    {
        let newPosition = ball.getPosition().add(ball.getVelocity().mul(dt));
        let newVelocity = ball.getVelocity();
        const radius = ball.getRadius();

        //bounce off screen sides
        if (newPosition.x - radius < 0)
        {
            newPosition.x = 2 * radius - newPosition.x;
            newVelocity.x = -newVelocity.x;
        }

        if (newPosition.x + radius > cnvMain.width)
        {
            newPosition.x = newPosition.x - radius;
            newVelocity.x = -newVelocity.x;
        }

        if (newPosition.y - radius < 0)
        {
            newPosition.y = 2 * radius - newPosition.y;
            newVelocity.y = -newVelocity.y;
        }

        if (newPosition.y + radius > cnvMain.height)
        {
            newPosition.y = newPosition.y - radius;
            newVelocity.y = -newVelocity.y;
        }

        ball.setPosition(newPosition);

        //dampen velocity a bit
        if (ball.getVelocity().length() < 0.1) newVelocity = new Vec2(0, 0);
        else
        {
            let ballDeceleration = ball.getVelocity().mul(ballFriction);
            newVelocity.x = newVelocity.x - ballDeceleration.x * dt;
            newVelocity.y = newVelocity.y - ballDeceleration.y * dt;
        }
        
        ball.setVelocity(newVelocity);
    }

    //handle collisions
    for (let i = 0; i < balls.length - 1; i++)
    {
        for (let j = i + 1; j < balls.length; j++)
        {
            handleCollision(balls[i], balls[j]);
        }
    }

    //draw balls
    ctxMain.clearRect(0, 0, cnvMain.width, cnvMain.height);
    for (let ball of balls)
    {
        ctxMain.beginPath();
        ctxMain.arc(ball.getPosition().x, ball.getPosition().y, ball.getRadius(), 0, 2 * Math.PI);
        ctxMain.stroke();
    }

    //draw drag line
    if (userDragging)
    {
        ctxMain.moveTo(userDragPos.x, userDragPos.y);
        ctxMain.lineTo(userTargetBall.getPosition().x, userTargetBall.getPosition().y);
        ctxMain.stroke();
    }
}

function mouseToCanvasPos(mousex, mousey)
{
    let canvasBounds = cnvMain.getBoundingClientRect();
    let mouseRelativeToCanvas = new Vec2(mousex - canvasBounds.x, mousey - canvasBounds.y);
    let canvasPixelsPerScreenPixel = cnvMain.width / canvasBounds.width;

    let mouseInCanvasPixels = mouseRelativeToCanvas.mul(canvasPixelsPerScreenPixel);
    return mouseInCanvasPixels;
}