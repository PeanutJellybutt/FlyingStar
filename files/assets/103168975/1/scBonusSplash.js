var ScBonusSplash = pc.createScript('scBonusSplash');

// initialize code called once per entity
ScBonusSplash.prototype.initialize = function()
{
    this.sceneRoot = this.app.root.findByName("SceneRoot");
    this.director = this.sceneRoot.findByName("Director");
    this.patrick = this.sceneRoot.findByName("oPatrick");
    this.patrickScript = this.patrick.script.scPatrick;

    this.shade = this.entity.findByName("imgBonusShade");
    this.portrait = this.entity.findByName("imgBonusPtrt");
    this.textAre = this.entity.findByName("txtYouAre");
    this.textTitle = this.entity.findByName("txtBonusTitle");
    this.textScore = this.entity.findByName("txtBonusLabel");
    this.textBonus = this.entity.findByName("txtBonusScore");
    this.scaleDown = false;

    this.portraitSide = false;
    this.textSide = false;
    this.duration = 0;
    this.bonus = 0;
    this.bonusInit = 0;
    this.doFade = false;
    this.themeNo = 0;

    this.entity.on('activate',this.activate,this);
};

// update code called every frame
ScBonusSplash.prototype.update = function(dt)
{
    if (!this.doFade)
    {
        // Active Duration
        if (this.duration > 0)
        {
            // Shade Fade In
            let opac = this.shade.element.opacity;
            if (opac < 0.8)
            {
                opac += 4 * dt;
                this.shade.element.opacity = opac;
            }

            // Portrait Translation
            let shift = 3072*dt;
            let pos = this.portrait.getLocalPosition();
            if (pos.x != 0)
            {
                pos.x += shift;
                if (pos.x > 0)
                    pos.x = 0;
            }
            else if (pos.y != 0)
            {
                pos.y += shift;
                if (pos.y > 0)
                    pos.y = 0;
            }
            this.portrait.setLocalPosition(pos);

            // YOU ARE
            pos = this.textAre.getLocalPosition();
            if (pos.x < 0)
            {
                pos.x += shift*3;
                if (pos.x > 0)
                    pos.x = 0;
            }
            else if (pos.y > 0)
            {
                pos.y -= shift;
                if (pos.y < 0)
                    pos.y = 0;
            }
            this.textAre.setLocalPosition(pos);

            // ---- STAR
            let s = this.textTitle.getLocalScale().x;
            if (this.scaleDown)
                s = 1 + ((s-1)*0.95);
            else if (s < 1.25)
            {
                s += 3*dt;
                if (s >= 1.25)
                    this.scaleDown = true;
            }
            this.textTitle.setLocalScale(s,s,1);

            // YOUR SCORE
            pos = this.textScore.getLocalPosition();
            if (pos.x > 0)
            {
                pos.x -= shift;
                if (pos.x < 0)
                    pos.x = 0;
            }
            else if (pos.y < 0)
            {
                pos.y += shift;
                if (pos.y > 0)
                    pos.y = 0;
            }
            this.textScore.setLocalPosition(pos);

            this.duration -= dt;
        }
        else
        {
            if (this.bonus <= 0)
            {
                this.doFade = true; // to guaranteed everything happens and not bypassed in case of 0 bonus earned
                this.textBonus.enabled = false;
                if (ScRoot.sharedData.sfxState == 1)
                    this.entity.sound.play("BonusEnd");

                gtag('event', 'bonus_gain', {
                    'amount': this.bonusInit
                });
            }
            else
            {
                let a = Math.min(Math.max(20,Math.ceil(this.bonus * dt * 2.5)),this.bonus);
                this.patrick.fire("addScore",a);
                this.bonus -= a;
            }
        }

        if (this.duration <= 0.5)
        {
            let r = this.bonus / this.bonusInit;
            let s = 1 + (r/2);
            this.textBonus.element.text = "+ " + ScUtils.formatNumber(this.bonus);
            this.textBonus.setLocalPosition(0,-(25+(50*r)),0);
            this.textBonus.setLocalScale(s,s,1);
            if (!this.doFade)
                this.textBonus.enabled = true;
        }

        return;
    }

    // Shade Fade Out
    let opac = this.shade.element.opacity;
    if (opac > 0)
    {
        opac -= 4 * dt;
        if (opac < 0)
            opac = 0;
        this.shade.element.opacity = opac;
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

    // Text Translation
    // YOU ARE
    pos = this.textAre.getLocalPosition();
    if (this.textSide)
    {
        if (pos.x > -3072)
            pos.x -= shift*3;
    }
    else if (pos.y < 1024)
        pos.y += shift;
    this.textAre.setLocalPosition(pos);
    // YOUR SCORE
    pos = this.textScore.getLocalPosition();
    if (this.textSide)
    {
        if (pos.x < 1024)
            pos.x += shift;
    }
    else if (pos.y > -1024)
        pos.y -= shift;
    this.textScore.setLocalPosition(pos);

    // Text Scale
    let s = this.textTitle.getLocalScale().x * 0.9;
    this.textTitle.setLocalScale(s,s,1);

    // End Splash
    this.duration -= dt;
    if (this.duration <= -0.5)
    {
        this.director.fire("pauseGame",false);
        if (this.themeNo >= 2)
            this.patrick.fire("reachEnd");

        this.entity.enabled = false;
    }
};

// Special Splash activated
ScBonusSplash.prototype.activate = function(nextThemeNo)
{
    this.director.fire("pauseGame",true);

    this.bonus = this.patrickScript.bonusCount;
    this.patrickScript.bonusCount = 0;
    this.bonusInit = Math.max(1,this.bonus); // prevent zero division in case of 0 bonus

    this.textBonus.enabled = false;
    this.duration = 1;    //sec
    this.doFade = false;
    this.themeNo = nextThemeNo-1;

    this.shade.element.opacity = 0;

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

    this.scaleDown = false;
    this.textTitle.setLocalScale(0,0,1);
    if (Math.random() >= 0.5)
    {
        this.textAre.setLocalPosition(-3072,0,0);
        this.textScore.setLocalPosition(1024,0,0);
        this.textSide = true;
    }
    else
    {
        this.textAre.setLocalPosition(0,1024,0);
        this.textScore.setLocalPosition(0,-1024,0);
        this.textSide = false;
    }

    if (nextThemeNo == 1)
        this.textTitle.element.text = "POP STAR";
    else if (nextThemeNo == 2)
        this.textTitle.element.text = "VIRAL STAR";
    else this.textTitle.element.text = "GOLD STAR";
};