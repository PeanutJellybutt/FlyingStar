var ScFoods = pc.createScript('scFoods');

// initialize code called once per entity
ScFoods.prototype.initialize = function()
{
    this.angle = 0;
    this.angleRate = 30;
    this.initY = this.entity.getLocalPosition().y;
};

// update code called every frame
ScFoods.prototype.update = function(dt)
{
    let rate = this.angleRate * dt;
    let ang = this.angle;
    ang += rate;
    if (rate > 0)
    {
        if (ang >= 5)
            this.angleRate = -this.angleRate;
    }
    else if (ang <= -5)
        this.angleRate = -this.angleRate;
    this.angle = ang;

    let pos = this.entity.getLocalPosition();
    pos.y = this.initY + (Math.sin((ang+90) * 18 * pc.math.DEG_TO_RAD)/8);
    this.entity.setLocalPosition(pos);
    this.entity.setLocalEulerAngles(0,0,ang);
};
