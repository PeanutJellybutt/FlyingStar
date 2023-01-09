var ScGameOverSplash = pc.createScript('scGameOverSplash');

// initialize code called once per entity
ScGameOverSplash.prototype.initialize = function()
{
    this.sceneRoot = this.app.root.findByName("SceneRoot");
    this.director = this.sceneRoot.findByName("Director");
    this.endScreen = this.sceneRoot.findByName("2DScreen").findByName("UI_EndScreen");

    this.portrait = this.entity.findByName("imgPatrickOver");
    this.text = this.entity.findByName("txtGameOver");
    this.nextBtn = this.entity.findByName("imgOverNextBtn");

    this.duration = 0;
    this.textS = 0;
    this.textAng = 0;
    this.textExpand = true;

    this.entity.on('activate',this.activate,this);
    this.entity.on("button", function(action)
    {
        if (action == 2)
        {
            this.entity.enabled = false;
            this.endScreen.enabled = true;
            this.endScreen.fire("activate");
        }
    },this);
};

// update code called every frame
ScGameOverSplash.prototype.update = function(dt)
{
    if (this.duration < 0)
        return;

    // Fade In
    let opac = this.entity.element.opacity;
    if (opac < 0.9)
    {
        opac += 4 * dt;
        if (opac > 0.9)
            opac = 0.9;
        this.entity.element.opacity = opac;
    }

    // Text Scale
    let s = this.text.getLocalScale().x;
    if (this.textExpand)
    {
   
        s += this.textS * dt;
        if (s > 1)
        {
            this.textS *= 0.97;
            if (s >= 1.5)
                this.textExpand = false;
        }
        this.text.setLocalEulerAngles(0,0,s * this.textAng);
    }
    else if (s > 1)
    {
        s *= 0.97;
        if (s < 1)
            s = 1;
        this.text.setLocalEulerAngles(0,0,(s-1) * this.textAng*2);
    }
    this.text.setLocalScale(s,s,1);

    if (this.duration <= 0.5)
    {
        // Portrait Translation
        let shift = 2048*dt;
        let pos = this.portrait.getLocalPosition();
        if (pos.y != 0)
        {
            pos.y += shift;
            if (pos.y > 0)
                pos.y = 0;
            this.portrait.setLocalPosition(pos);
        }

        if (this.duration <= 0.25)
        {
            // Button Translation
            shift = 3072*dt;
            pos = this.nextBtn.getLocalPosition();
            if (pos.x > 0)
            {
                pos.x -= shift;
                if (pos.x < 0)
                    pos.x = 0;
                this.nextBtn.setLocalPosition(pos);
            }
        }
    }

    this.duration -= dt;
    if (this.duration <= 0)
        this.nextBtn.fire("lock",false);
};

// Special Splash activated
ScGameOverSplash.prototype.activate = function(win=false)
{
    this.director.fire("pauseGame",true);

    this.duration = 0.75; //sec

    this.entity.element.opacity = 0;

    this.portrait.setLocalPosition(0,-640,0);
    this.portrait.element.spriteFrame = (win ? 1 : 0);

    this.text.setLocalScale(0,0,1);
    this.textS = 8;
    this.textAng = pc.math.random(-2.5,2.5);
    this.textExpand = true;

    this.nextBtn.setLocalPosition(512,0,0);
    this.nextBtn.fire("lock");
};
