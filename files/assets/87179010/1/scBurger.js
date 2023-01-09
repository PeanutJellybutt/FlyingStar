var ScBurger = pc.createScript('scBurger');

// initialize code called once per entity
ScBurger.prototype.initialize = function()
{
    this.angle = 0;
    this.angleRate = 45;
    this.initY = this.entity.getLocalPosition().y;

    this.patrickScript = null;
    this.collected = false;

    this.entity.on("collected", function(patrickScript)
    {
        this.collected = true;
        this.patrickScript = patrickScript;
        this.entity.sprite.play("Blip");
        this.angleRate = 0;
        this.entity.setLocalEulerAngles(0,0,0);
    }, this);

    this.entity.on("destroy", function() {this.entity.enabled = false;}, this);
};

// update code called every frame
ScBurger.prototype.update = function(dt)
{
    let rate = this.angleRate * dt;
    if (rate != 0)
    {
        let ang = this.angle;
        ang += rate;
        if (rate > 0)
        {
            if (ang >= 10)
                this.angleRate = -this.angleRate;
        }
        else if (ang <= -10)
            this.angleRate = -this.angleRate;
        this.angle = ang;

        let pos = this.entity.getLocalPosition();
        pos.y = this.initY + (Math.sin((ang+90) * 9 * pc.math.DEG_TO_RAD)/4);
        this.entity.setLocalPosition(pos);
        this.entity.setLocalEulerAngles(0,0,ang);
    }
    else if (!this.entity.sprite.currentClip.isPlaying)
    {
        this.patrickScript.currentCollider = null;
        this.patrickScript.currentReach = null;
        this.entity.enabled = false;
        this.entity.destroy();
    }
};