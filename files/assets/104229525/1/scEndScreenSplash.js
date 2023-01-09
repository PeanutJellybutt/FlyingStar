var ScEndScreenSplash = pc.createScript('scEndScreenSplash');

// initialize code called once per entity
ScEndScreenSplash.prototype.initialize = function()
{
    this.sceneRoot = this.app.root.findByName("SceneRoot");
    this.director = this.sceneRoot.findByName("Director");
    this.directorScript = this.sceneRoot.findByName("Director").script.scDirector;
    this.patrickScript = this.sceneRoot.findByName("oPatrick").script.scPatrick;
    this.unlocked = this.sceneRoot.findByName("2DScreen").findByName("UI_Special").script.scSpecialUI.specialUnlocked;

    this.uiCongrats = this.entity.findByName("uiCongrats");
    this.congrats = this.uiCongrats.findByName("txtCongrats");
    this.cover = this.uiCongrats.findByName("imgCongratsCover");
    this.uiEnsemble = this.entity.findByName("uiEnsemble");
    this.uiScore = this.entity.findByName("uiEndScore");
    this.scoreGroup = this.uiScore.findByName("scoreGroup");
    this.finalScore = this.scoreGroup.findByName("txtFinalScore");
    this.leaderBtn = this.entity.findByName("imgLeaderBtn");
    this.replayBtn = this.entity.findByName("imgEndReplayBtn");

    this.duration = 0;
    this.congratsS = 0;
    this.textS = 0;
    this.textExpand = true;
    this.scoreS = 0;
    this.scoreAng = 0;

    this.buttonUnlocked = false;
    this.changingScene = false; // To guarantee multiple scene change triggers prevention

    this.entity.on('activate',this.activate,this);
    this.entity.on("button", function(action,button)
    {
        if (action != 2 || this.changingScene)
            return;

        this.changingScene = true;

        //
        let root = this.app.root.findByName("Root");
        if (button == "replay")
        {
            root.fire("postStart");
            root.fire("changeScene","Play");
        }
        else
        {
            root.sound.stop();
            if (ScRoot.sharedData.bgmState == 1)
                root.sound.play("Menu");

            root.fire("changeScene","Leaderboard");
        }

    },this);
};

// update code called every frame
ScEndScreenSplash.prototype.update = function(dt)
{
    // Fade In
    let opac = this.entity.element.opacity;
    if (opac < 1)
    {
        opac += 4 * dt;
        if (opac >= 1)
        {
            opac = 1;
            this.uiCongrats.enabled = true;
        }
        this.entity.element.opacity = opac;
        return;
    }

    // Congratulations
    let shift = 512*dt;
    let pos = this.uiCongrats.getLocalPosition();
    if (pos.y > 0)
    {
        pos.y -= shift;
        if (pos.y < 0)
            pos.y = 0;
        this.uiCongrats.setLocalPosition(pos);

        pos = this.congrats.getLocalPosition();
        if (pos.y < 0)
        {
            shift = 1024*dt;
            pos.y += shift;
            if (pos.y >= 0)
            {
                pos.y = 0;
                this.uiEnsemble.enabled = true;
                this.uiScore.enabled = true;
            }
            this.congrats.setLocalPosition(pos);

            pos = this.cover.getLocalPosition();
            if (pos.y > 0)
            {
                pos.y -= shift;
                if (pos.y < 0)
                    pos.y = 0;
                this.cover.setLocalPosition(pos);
            }
        }
    }
    else
    {
        let s = this.uiCongrats.getLocalScale().x;
        s += this.congratsS * dt;
        this.uiCongrats.setLocalScale(s,s,1);
        this.congratsS *= 0.99;
        if (s <= 1)
            this.congratsS = 0.5;
        else if (s >= 1.2)
            this.congratsS = -0.5;
    }

    if (this.duration <= 1)
    {
        // Ensemble
        let w = this.uiEnsemble.element.width;
        if (w > 0)
        {
            w *= 0.9;
            if (w < 1)
                w = 0;
            this.uiEnsemble.element.width = w;
        }

        if (this.duration <= 0.75)
        {
            // Text Scale
            let s = this.uiScore.getLocalScale().x;
            if (this.textExpand)
            {
                s += this.textS * dt;
                if (s > 1)
                {
                    this.textS *= 0.98;
                    if (s >= 1.5)
                        this.textExpand = false;
                }
                this.uiScore.setLocalScale(s,s,1);
            }
            else if (s > 1)
            {
                s *= 0.98;
                if (s < 1)
                    s = 1;
                this.uiScore.setLocalScale(s,s,1);
            }
            else
            {
                // Score Scale and Turn
                s = this.scoreGroup.getLocalScale().x;
                s += this.scoreS * dt;
                this.scoreGroup.setLocalScale(s,s,1);
                this.scoreGroup.rotateLocal(0,0,this.scoreAng*dt);
                this.scoreS *= 0.98;
                if (s <= 1)
                    this.scoreS = 2;
                else if (s >= 1.5)
                {
                    this.scoreS = -2;
                    let r = this.scoreGroup.getLocalEulerAngles().z;
                    let ang = Math.abs(r) + (Math.random()*5);
                    if (r > 0)
                        ang = -ang;
                    this.scoreAng = ang;
                }

                if (this.duration <= 0.25 && this.directorScript.scorePost != 0)
                {
                    // Button Translation
                    shift = 3072*dt;
                    pos = this.leaderBtn.getLocalPosition();
                    if (pos.x > 0)
                    {
                        pos.x -= shift;
                        if (pos.x < 0)
                            pos.x = 0;
                        this.leaderBtn.setLocalPosition(pos);
                    }

                    pos = this.replayBtn.getLocalPosition();
                    if (pos.x < 0)
                    {
                        pos.x += shift;
                        if (pos.x > 0)
                            pos.x = 0;
                        this.replayBtn.setLocalPosition(pos);
                    }
                }
            }
        }
    }

    if (this.buttonUnlocked)
        return;

    if (this.duration > 0)
        this.duration -= dt;
    else if (this.directorScript.scorePost != 0)
    {
        this.buttonUnlocked = true;
        this.replayBtn.fire("lock",false);
        this.leaderBtn.fire("lock",false);
    }
};

// Special Splash activated
ScEndScreenSplash.prototype.activate = function()
{
    this.director.fire("pauseGame",true);

    this.duration = 1.25; //sec

    this.uiCongrats.enabled = false;
    this.uiEnsemble.enabled = false;
    this.uiScore.enabled = false;

    this.entity.element.opacity = 0;

    this.uiCongrats.setLocalPosition(1024,256,0);
    this.congrats.setLocalPosition(0,-256,0);
    this.cover.setLocalPosition(1024,256,0);
    this.congratsS = 0.5;

    this.uiEnsemble.element.width = 8192;

    this.uiScore.setLocalScale(0,0,1);
    this.textS = 5;
    this.textExpand = true;

    this.scoreGroup.setLocalScale(1.5,1.5,1);
    this.scoreGroup.setLocalEulerAngles(0,0,0);
    this.scoreS = -2;
    this.scoreAng = 2.5;

    let total = Math.min(Math.round(this.patrickScript.distScore + this.patrickScript.collectScore),999999);
    this.finalScore.element.text = ScUtils.formatNumber(total);

    ScRoot.sharedData.latestScore = total;

    this.replayBtn.setLocalPosition(-512,0,0);
    this.leaderBtn.setLocalPosition(512,0,0);
    this.replayBtn.fire("lock");
    this.leaderBtn.fire("lock");
    this.buttonUnlocked = false;

    let children = this.uiEnsemble.children;
    let childN = children.length;
    for (let i = 0; i < childN; i++) 
    {
        let child = children[i];
        let name = child.name;
        let index = parseInt(name.substr(name.length-1));
        if (index == 0) // Excluding Patrick
            continue;

        let frame = index;
        if (!this.unlocked[index-1])
            frame += childN;

        child.element.spriteFrame = frame;
    }
};
