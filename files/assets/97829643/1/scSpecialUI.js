var ScSpecialUI = pc.createScript('scSpecialUI');

// initialize code called once per entity
ScSpecialUI.prototype.initialize = function()
{
    this.sceneRoot = this.app.root.findByName("SceneRoot");
    this.director = this.sceneRoot.findByName("Director").script.scDirector;
    this.patrick = this.sceneRoot.findByName("oPatrick");
    this.patrickScript = this.patrick.script.scPatrick;
    this.splash = this.sceneRoot.findByName("UI_SpecialSplash");

    this.rev = this.entity.findByName("uiSpecialRev").script.scSpecialRev;
    this.button = this.entity.findByName("imgSpecialBtn");
    this.state = 0;
    this.specialCount = 3;
    this.specialUnlocked = [true,true,true];
    /*
    this.specialUnlocked = [Math.random() < 0.5,Math.random() < 0.5,Math.random() < 0.5];
    this.specialUnlocked[ScUtils.irandom(2)] = true;
    */

    this.count = this.button.findByName("imgSpecialCount");
    this.countElement = this.count.element;
    this.countElement.spriteFrame = this.specialCount;
    this.outline = new pc.Color();
    this.shadow = new pc.Color();

    this.countScale = 1;
    this.entity.on("addCount",function() {
        if (this.specialCount < 5)
        {
            if (this.specialCount <= 0)
                this.rev.fire("countOut",false);

            this.specialCount++;
            this.countElement.spriteFrame = this.specialCount;
            this.countScale = 1.5;
            this.count.setLocalScale(1.5,1.5,1);
        }
    },this);

    this.entity.on("button",this.buttonInteract,this);

    //
    this.interacted();
};

// update code called every frame
ScSpecialUI.prototype.update = function(dt)
{
    if (!this.patrick.enabled || this.patrickScript.hitGround)
    {
        this.entity.enabled = false;
        return;
    }

    let scale = this.countScale;
    if (scale > 1)
    {
        scale -= dt*2;
        if (scale < 1)
            scale = 1;
        this.count.setLocalScale(scale,scale,1);
        this.countScale = scale;
    }
};

// button interaction
ScSpecialUI.prototype.buttonInteract = function(action,button,visual)
{
    if (action == 2 && !this.director.gamePaused && this.specialCount > 0)
    {
        let special = this.rev.specialCurr;
        if (special != -1)
        {
            this.specialCount--;
            this.countElement.spriteFrame = this.specialCount;

            if (this.specialCount <= 0)
                this.rev.fire("countOut");

            this.splash.enabled = true;
            this.splash.fire("activate",special);
        }
    }

    this.interacted(visual);
};

// visual change on UI
ScSpecialUI.prototype.interacted = function(visual)
{
    let opacity = 0.75; // Leaves
    if (visual == 1)    // Hovers
        opacity = 1;
    else if (visual == 2) // Down
        opacity = 1;

    this.countElement.opacity = opacity;
};