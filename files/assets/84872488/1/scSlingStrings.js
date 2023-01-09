var ScSlingStrings = pc.createScript('scSlingStrings');

// initialize code called once per entity
ScSlingStrings.prototype.initialize = function()
{
    this.length = 256/128;

    this.setup = false;
    this.isFlipped = this.entity.sprite.flipX;
};

// update code called every frame
ScSlingStrings.prototype.update = function(dt) {

};

ScSlingStrings.prototype.stretch = function(anchorX, anchorY)
{
    if (!this.setup)
    {
        this.entity.sprite.flipX = Math.random() < 0.5 ? true : false;
        this.entity.sprite.flipY = Math.random() < 0.5 ? true : false;
        this.isFlipped = this.entity.sprite.flipX;
        this.setup = true;
    }

    let pos = this.entity.getPosition();
    let d = ScUtils.point_distance(pos.x,pos.y,anchorX,anchorY) / this.length;
    let dir = ScUtils.point_direction(pos.x,pos.y,anchorX,anchorY);

    //
    if (this.isFlipped)
        dir += 180;
    this.entity.setEulerAngles(0,0,dir);

    //
    this.entity.sprite.frame = 0;
    let sy = 1/d;
    if (d < 1)
    {
        sy = 1;
        if (d < 0.75)
            this.entity.sprite.frame = 1;
    }
    this.entity.setLocalScale(d,sy,1);
};