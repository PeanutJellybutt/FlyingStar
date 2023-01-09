var ScSpecialSplash = pc.createScript('scSpecialSplash');

// initialize code called once per entity
ScSpecialSplash.prototype.initialize = function()
{
    this.sceneRoot = this.app.root.findByName("SceneRoot");
    this.director = this.sceneRoot.findByName("Director");
    this.patrick = this.sceneRoot.findByName("oPatrick");

    this.radial = this.entity.findByName("imgSpecialRad");
    this.portrait = this.entity.findByName("imgSpecialPtrt");

    this.rotateA = 0;
    this.portraitSide = false;
    this.duration = 0;
    this.specialCurr = -1;

    this.entity.on('activate',this.activate,this);
};

// update code called every frame
ScSpecialSplash.prototype.update = function(dt)
{
    // Active Duration
    if (this.duration > 0)
    {
        // Radial Fade In and Rotation
        let opac = this.radial.element.opacity;
        if (opac < 1)
        {
            opac += 5 * dt;
            if (opac > 1)
                opac = 1;
            this.radial.element.opacity = opac;
        }
        this.radial.rotateLocal(0,0,this.rotateA*dt);

        if (this.duration <= 0.9) //
        {
            // Portrait Translation
            let shift = 3072*dt;
            let pos = this.portrait.getLocalPosition();
            if (pos.x != 128)
            {
                pos.x += shift;
                if (pos.x > 128)
                    pos.x = 128;
            }
            else if (pos.y != 0)
            {
                pos.y += shift;
                if (pos.y > 0)
                    pos.y = 0;
            }
            this.portrait.setLocalPosition(pos);
        }

        this.duration -= dt;
        return;
    }

    //----------------------------------------------------------

    // Radial Fade Out
    let opac = this.radial.element.opacity;
    if (opac > 0)
    {
        opac -= 5 * dt;
        if (opac < 0)
            opac = 0;
        this.radial.element.opacity = opac;
    }

    // Portrait Translation
    let shift = 4096*dt;
    let pos = this.portrait.getLocalPosition();
    if (this.portraitSide)
    {
        if (pos.x > -this.portrait.element.width)
            pos.x -= shift;
    }
    else if (pos.y > -this.portrait.element.height)
        pos.y -= shift;
    this.portrait.setLocalPosition(pos);

    // End Splash
    this.duration -= dt;
    if (this.duration <= -0.5)
    {
        this.director.fire("pauseGame",false);
        this.patrick.fire('tapSpecial',this.specialCurr);
        this.entity.enabled = false;

        gtag('event', 'special_activate', {
            'no': this.specialCurr,
        });
    }
};

// Special Splash activated
ScSpecialSplash.prototype.activate = function(special)
{
    this.director.fire("pauseGame",true);

    this.duration = 1;//1.4; //sec
    this.specialCurr = special;

    this.radial.element.opacity = 0;
    this.rotateA = (5 + (Math.random()*10))  * ScUtils.choose(-1,1);

    this.portrait.element.spriteFrame = special;
    if (Math.random() >= 0.5)
    {
        this.portrait.setLocalPosition(-this.portrait.element.width,0,0);
        this.portraitSide = true;
    }
    else
    {
        this.portrait.setLocalPosition(0,-this.portrait.element.height,0);
        this.portraitSide = false;
    }
};