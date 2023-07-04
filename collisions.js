class Vec2
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    add(vec)
    {
        //component-wise addition
        return new Vec2(this.x + vec.x, this.y + vec.y);
    }

    sub(vec)
    {
        //component-wise subtraction
        return new Vec2(this.x - vec.x, this.y - vec.y);
    }

    mul(scalar)
    {
        //multiply vector by scalar
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    dot(vec)
    {
        return this.x * vec.x + this.y * vec.y;
    }

    cross(vec)
    {
        return this.x * vec.y - this.y * vec.x;
    }

    length()
    {
        return Math.sqrt(this.dot(this));
    }

    normalize()
    {
        return new Vec2(this.x / this.length(), this.y / this.length());
    }

    perp()
    {
        return new Vec2(-this.y, this.x);
    }
}

class Ball
{
    constructor(x, y, r)
    {
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(0, 0);
        this.radius = r;
        this.mass = 1;
    }

    getPosition() { return this.pos; }
    getVelocity() { return this.vel; }
    getRadius() { return this.radius; }
    getMass() { return this.mass; }

    setPosition(pos) { this.pos = pos; }
    setVelocity(vel) { this.vel = vel; }
}

function staticResolution(ball, other, ballDist)
{
    //manually move balls away from each other in equal measure so they dont overlap, no real physics

    //scalar distance needed to move to not be overlapping anymore
    let displacement = -0.5 * (ballDist - ball.getRadius() - other.getRadius());

    //unit vector of direction to move in
    let direction = ball.getPosition().sub(other.getPosition()).normalize();

    //because we did ball.sub(other), direction points from other to ball.
    //so ball wants to move the way direction is pointing, and other wants to move the opposite way
    ball.setPosition(ball.getPosition().add(direction.mul(displacement)));
    other.setPosition(other.getPosition().sub(direction.mul(displacement)));
}

function dynamicResolution(ball, other)
{
    //get unit vector pointing from ball to other
    let normal = other.getPosition().sub(ball.getPosition()).normalize();

    //unit vector perpendicular to normal (tangent to circles at point of collision)
    let tangent = normal.perp();

    //how much does ball's velocity project onto the normal (i.e. how fast is it moving in the direction normal is pointing)
    let ballNormSpeed = ball.getVelocity().dot(normal);
    let otherNormSpeed = other.getVelocity().dot(normal);

    //same for tangent direction
    let ballTanSpeed = ball.getVelocity().dot(tangent);
    let otherTanSpeed = other.getVelocity().dot(tangent);

    //calculate speed along normal direction after collision for each ball. speed in tangent direction will remain unchanged
    let ballNormSpeedAfter = (ballNormSpeed * (ball.getMass() - other.getMass()) + 2 * other.getMass() * otherNormSpeed) / (ball.getMass() + other.getMass());
    let otherNormSpeedAfter = (otherNormSpeed * (other.getMass() - ball.getMass()) + 2 * ball.getMass() * ballNormSpeed) / (ball.getMass() + other.getMass());

    //if all balls have the same mass, can use this calculation instead
    /*
    let ballNormSpeedAfter = otherNormSpeed;
    let otherNormSpeedAfter = ballNormSpeed;
    */

    let ballVelocityAfter = normal.mul(ballNormSpeedAfter).add(tangent.mul(ballTanSpeed));
    ball.setVelocity(ballVelocityAfter);

    let otherVelocityAfter = normal.mul(otherNormSpeedAfter).add(tangent.mul(otherTanSpeed));
    other.setVelocity(otherVelocityAfter);
}

function handleCollision(ball, other)
{
    //do the balls overlap? if not, nothing more to do
    let ballDist = ball.getPosition().sub(other.getPosition()).length();
    if (ballDist > ball.getRadius() + other.getRadius()) return; //not overlapping

    //balls are overlapping
    //first, handle static collision resolution to prevent balls getting stuck inside each other
    //save one whole sqrt by passing ballDist
    if (inpStatic.checked) staticResolution(ball, other, ballDist);

    //then, calculate dynamic physics (bounces)
    if (inpDynamic.checked) dynamicResolution(ball, other);
}