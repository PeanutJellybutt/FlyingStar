var ScInstructions = pc.createScript('scInstructions');

// initialize code called once per entity
ScInstructions.prototype.initialize = function()
{
    gtag('event', 'tutorial_begin');

    this.board = this.entity.findByName("imgBoardBox");
    this.title = this.board.findByName("txtTitle");
    this.pic = this.board.findByName("imgPicture");
    this.desc = this.board.findByName("txtDesc");
    this.prevBtn = this.board.findByName("imgPrevBtn");
    this.nextBtn = this.board.findByName("imgNextBtn");
    this.patrick = this.entity.findByName("imgPatrick");
    this.skipBtn = this.entity.findByName("imgSkipBtn");

    //
    this.duration = 0.5;
    this.titleS = 1;
    this.titleAng = 1.25;

    this.board.setLocalScale(0,0,1);
    this.pic.setLocalScale(0,0,1);
    this.desc.element.opacity = 0;
    this.prevBtn.setLocalScale(0,0,1);
    this.nextBtn.setLocalScale(0,0,1);
    this.patrick.setLocalPosition(-1024,0,0);
    this.skipBtn.setLocalPosition(1024,0,0);

    //
    this.instNo = 0;
    this.instLast = 2;
    this.prevBtn.enabled = (this.instNo != 0);
    this.nextBtn.enabled = (this.instNo != this.instLast);

    //
    this.entity.on("button", function(action,button)
    {
        if (this.duration > 0 || action != 2 || this.changingScene)
            return;
        
        if (button == "skip")
        {
            if (this.instNo < this.instLast)
                gtag('event', 'tutorial_skip');
            else gtag('event', 'tutorial_complete');

            this.changingScene = true;

            let root = this.app.root.findByName("Root");
            
            root.sound.stop();
            if (ScRoot.sharedData.bgmState == 1)
                root.sound.play("Game");

            root.fire("postStart");
            root.fire("changeScene","Play");
        }
        else
        {
            let pvNo = this.instNo;
            if (button == "prev")
            {
                if (this.instNo > 0)
                {
                    this.instNo--;
                    gtag('event', 'tutorial_prev');
                }
            }
            else if (this.instNo < this.instLast)
            {
                this.instNo++;
                gtag('event', 'tutorial_next');
            }

            if (pvNo != this.instNo)
            {
                this.desc.element.text = this.app.i18n.getText("INST" + this.instNo.toString());
                this.prevBtn.enabled = (this.instNo != 0);
                this.nextBtn.enabled = (this.instNo != this.instLast);
            }
        }

    },this);
};

// update code called every frame
ScInstructions.prototype.update = function(dt)
{
    // Board Enlarge
    let s = this.board.getLocalScale().x;
    if (s < 1)
    {
        s += 3 * dt;
        if (s > 1)
            s = 1;
        this.board.setLocalScale(s,s,1);
        return;
    }

    // Title Scale and Turn
    let y = this.title.getLocalPosition().y;
    y += this.titleS * 64 * dt;
    this.title.setLocalPosition(0,y,0);
    this.title.rotateLocal(0,0,this.titleAng*dt);
    this.titleS *= 0.98;
    if (y <= -8)
        this.titleS = 1;
    else if (y >= 8)
    {
        this.titleS = -1;
        let r = this.title.getLocalEulerAngles().z;
        let ang = Math.abs(r) + (Math.random()*2.5);
        if (r > 0)
            ang = -ang;
        this.titleAng = ang;
    }

    //
    if (this.duration <= 0)
        return;

    //
    s = this.pic.getLocalScale().x;
    if (s < 1)
    {
        s += dt*4;
        if (s > 1)
            s = 1;
        this.pic.setLocalScale(s,s,1);
    }
    let a = this.desc.element.opacity;
    if (a < 1)
    {
        a += dt*4;
        if (a > 1)
            a = 1;
        this.desc.element.opacity = a;
    }
    else
    {
        s = this.prevBtn.getLocalScale().x;
        if (s < 1)
        {
            s += dt*4;
            if (s > 1)
                s = 1;
            this.prevBtn.setLocalScale(s,s,1);
        }
        s = this.nextBtn.getLocalScale().x;
        if (s < 1)
        {
            s += dt*4;
            if (s > 1)
                s = 1;
            this.nextBtn.setLocalScale(s,s,1);
        }
    }

    // Translation
    let shift = 4096*dt;
    let pos = this.patrick.getLocalPosition();
    if (pos.x < 0)
    {
        pos.x += shift;
        if (pos.x > 0)
            pos.x = 0;
        this.patrick.setLocalPosition(pos);
    }
    pos = this.skipBtn.getLocalPosition();
    if (pos.x > 0)
    {
        pos.x -= shift;
        if (pos.x < 0)
            pos.x = 0;
        this.skipBtn.setLocalPosition(pos);
    }

    this.duration -= dt;
    if (this.duration <= 0)
    {
        this.skipBtn.fire("lock",false);
        ScRoot.sharedData.tuts = false;
    }
};
