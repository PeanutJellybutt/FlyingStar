var ScSlingshot = pc.createScript('scSlingshot');

// initialize code called once per entity
ScSlingshot.prototype.initialize = function()
{
    this.camera = this.app.root.findByName('Camera');
    this.director = this.app.root.findByName("SceneRoot").findByName("Director").script.scDirector;

    this.stickL = this.entity.findByName("oSlingstickL");
    this.stickR = this.entity.findByName("oSlingstickR");

    this.sling = this.entity.findByName("oSling");
    this.slingPart = this.sling.findByName("oSlingPart");

    this.patrick = this.entity.findByName("oPatrickInitial");

    this.arrow = this.entity.findByName("oArrow");
    this.trailL = this.arrow.findByName("oArrowTrailL");
    this.trailR = this.arrow.findByName("oArrowTrailR");
    this.trailL.sprite.frame = 1;
    this.trailR.sprite.frame = 1;

    this.launchState = 0; // 0:not, 1:charging, 2:launching, 3:launched, 4:spring back, 5:spring forth, 6:done

    this.chargePower = 0;
    this.launchPower = 0;
    this.aimPos = new pc.Vec3();
    this.aimDir = 0;
    this.aimRad = 0;
    this.slingZ = this.sling.getPosition().z;

    //
    let touch = this.app.touch;
    if (touch)
    {
        touch.on(pc.EVENT_TOUCHSTART, this.onCharge, this);
        touch.on(pc.EVENT_TOUCHMOVE, this.onAim, this);
        touch.on(pc.EVENT_TOUCHEND, this.toRelease, this);
    }
    else
    {
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onCharge, this);
        this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onAim, this);
        this.app.mouse.on(pc.EVENT_MOUSEUP, this.toRelease, this);
    }
};

// update code called every frame
ScSlingshot.prototype.update = function(dt)
{   
    // Launch Control
    let launch = this.launchState;
    if (launch >= 2 && launch < 6)
    {
        //
        let dist = this.chargePower;
        let radDir = this.aimRad;
        this.sling.setLocalPosition(-dist * Math.cos(radDir),-dist * Math.sin(radDir), 0);

        let d = -1;
        if (launch == 3)
        {
            d = -1;
            if (dist <= -2)
                this.launchState = 4;
        }
        else if (launch == 4)
        {
            d = 1;
            if (dist >= 1)
                this.launchState = 5;
        }
        else if (launch == 5 && dist <= 0)
        {
            this.launchState = 6;
            d = 0;

            this.sling.setLocalPosition(0,-0.25,0);
            this.sling.setLocalEulerAngles(0,0,15);
        }

        this.chargePower = dist + (d * 60 * dt);

        this.slingPart.fire("move",dist);
    }
};

//
ScSlingshot.prototype.onCharge = function(event)
{
    event.event.preventDefault();

    if (this.director.gamePaused)
        return;

    //
    this.launchState = 1; //charged
    this.stickL.sprite.play("Launch");
    this.stickR.sprite.play("Launch");
    this.stickL.sprite.pause();
    this.stickR.sprite.pause();
    //
    this.slingPart.fire("charge");
    this.patrick.reparent(this.sling);
    this.patrick.setLocalPosition(0.15,0.3,0);
    this.patrick.setLocalEulerAngles(0,0,-20);
    this.patrick.sprite.sprite = this.app.assets.find("sPatrickBounce","sprite").resource;

    //
    this.arrow.enabled = true;
    this.entity.findByName("oArc").enabled = true;

    //
    let touch = this.app.touch;
    if (touch)
        touch.off(pc.EVENT_TOUCHSTART, this.onCharge, this);
    else this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onCharge, this);

    this.onAim(event);
};

//
ScSlingshot.prototype.onAim = function(event)
{
    event.event.preventDefault();

    //
    if (this.director.gamePaused || this.launchState != 1)
        return;

    //
    let input = event;
    if (this.app.touch) // For non-element. If touch, need to get touch instance first. If mouse, just use provided event.
        input = event.touches[0];

    //
    let pos = this.entity.getPosition();
    let anchorX = pos.x;
    let anchorY = pos.y;
    let aimPos = this.aimPos;
    this.camera.camera.screenToWorld(input.x, input.y, -this.slingZ, aimPos);
    let aimX = aimPos.x;
    let aimY = aimPos.y;

    //
    let dir = pc.math.clamp(ScUtils.point_direction(aimX,aimY,anchorX,anchorY),-15,30);
    let radDir = dir * pc.math.DEG_TO_RAD;
    
    // Sling
    let dist = ScUtils.point_distance(aimX,aimY,anchorX,anchorY);
    if (aimPos.x > anchorX)
        dist = 1;
    else
    {
        dist **= 0.66;
        if (dist < 1)
            dist = 1;
        else if (dist > 3)
            dist = 3;
    }

    // 
    this.sling.setLocalPosition(-dist * Math.cos(radDir),-dist * Math.sin(radDir),0);
    this.sling.setLocalEulerAngles(0,0,dir);
    this.slingPart.fire("move",dist);
    this.chargePower = dist;
    if (dist > 2)
    {
        this.stickL.sprite.frame = 0;
        this.stickR.sprite.frame = 0;
    }
    else
    {
        this.stickL.sprite.frame = 1;
        this.stickR.sprite.frame = 1;
    }

    // Arrow
    this.arrow.setLocalEulerAngles(0,0,dir);
    if (Math.abs(this.aimDir - dir) >= 5)
    {
        let trail = this.trailR;
        if (this.aimDir >= dir)
            trail = this.trailL;

        trail.sprite.play("Trail");
    }
    this.aimDir = dir;
};

//
ScSlingshot.prototype.toRelease = function(event)
{
    event.event.preventDefault();

    if (this.director.gamePaused || this.launchState != 1)
        return;

    //
    this.launchState = 2; //launching
    this.launchPower = this.chargePower * 4;
    this.aimRad = this.aimDir * pc.math.DEG_TO_RAD;
    //
    this.stickL.sprite.resume();
    this.stickR.sprite.resume();

    //
    this.arrow.destroy();
    this.entity.findByName("oArc").destroy();
    
    //
    let touch = this.app.touch;
    if (touch)
    {
        touch.off(pc.EVENT_TOUCHMOVE, this.onAim, this);
        touch.off(pc.EVENT_TOUCHEND, this.toRelease, this);
    }
    else
    {
        this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onAim, this);
        this.app.mouse.off(pc.EVENT_MOUSEUP, this.toRelease, this);
    }
};
