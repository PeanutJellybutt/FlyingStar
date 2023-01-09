var ScPatrick = pc.createScript('scPatrick');

ScPatrick.attributes.add('yDrop',{ type: 'number', title: 'Gravity', default: 5 });
ScPatrick.attributes.add('xDrop',{ type: 'number', title: 'Air Resistance', default: 0.05 });
ScPatrick.attributes.add('tapPower',{ type: 'number', title: 'Tap Power', default: 2 });
ScPatrick.attributes.add('speedFactor',{ type: 'number', title: 'Speed Factor', default: 0.85, min: 0, max: 2 });

// initialize code called once per entity
ScPatrick.prototype.initialize = function()
{
    if (ScRoot.sharedData.sfxState == 0)
        this.entity.sound.volume = 0;

    this.sprite = this.entity.sprite;
    this.clipFly = this.sprite.clip("Fly");
    this.clipHighFive = this.sprite.clip("HighFive");
    this.trail = this.entity.findByName("oPatrickTrail");
    this.trailPower = 0;

    this.cam = this.app.root.findByName("Camera");

    this.sceneRoot = this.entity.parent;
    this.director = this.sceneRoot.findByName("Director");
    this.directorScript = this.director.script.scDirector;
    this.shiftGroup = this.sceneRoot.findByName("ShiftGroup");

    this.screenUI = this.sceneRoot.findByName("2DScreen");
    this.specialTimerText = this.screenUI.findByName("txtSpecialTimer");

    this.hpUI = this.screenUI.findByName("UI_HP");
    this.hpUI.enabled = true;
    this.hpBarFrame = this.hpUI.findByName("imgHPFrame");
    this.hpBarFill = this.hpUI.findByName("imgHPFill");
    this.hpBarBlink = 0;
    this.hpBarTapCol =  new pc.Color(1,0.9,0.9);
    this.hpBarHurtCol = new pc.Color(  1,0.5,0.5);
    this.hpBarHealCol = new pc.Color(0.5,  1,0.5);

    this.scoreUI = this.screenUI.findByName("UI_Score");
    this.scoreUI.enabled = true;
    this.scoreCounter = this.scoreUI.findByName("txtScore");
    this.scoreCoin = this.scoreUI.findByName("imgCoin");
    this.scoreBlink = 0;
    this.bonusCount = 0;

    this.minimapUI = this.screenUI.findByName("UI_Minimap");
    this.minimapUI.enabled = true;

    this.specialGain = 0;
    this.specialTap = this.screenUI.findByName("UI_Special");
    this.specialTap.enabled = true;

    let pos = this.entity.getPosition();
    this.posX = pos.x;
    this.posY = pos.y;
    this.initY = this.posY;

    this.panAdjustRate = 2.5;
    this.panAdjust = 3;
    this.endReached = false;
    this.gameOver = false;

    this.xPower = 0;
    this.yPower = 0;
    //xDrop and yDrop are set as attributes
    this.maxHeight = this.directorScript.maxHeight;

    this.hpMax = 100;
    this.hp = this.hpMax;
    this.distScore = 0;
    this.collectScore = 0;
    this.hitGround = false;
    this.bounceGroundPower = -1;
    this.onGround = false;

    this.currentCollider = null;
    this.currentColliderParam = [];
    this.currentReach = null;
    this.currentReachRadius = 0;

    this.ouchieTime = 0;
    this.slowTime = 0;
    this.healEffect = 0;
    this.animHold = 0;

    let touch = this.app.touch;
    if (touch)
        touch.on(pc.EVENT_TOUCHSTART, this.tapControl, this);
    else this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.tapControl, this);

    this.entity.on('tapControl', this.tapControl, this);
    this.entity.on('tapSpecial', this.tapSpecial, this);
    this.entity.on('addScore', this.addScore, this);
    this.entity.on('updateScore', this.updateScoreCounter, this);
    this.entity.on('reachEnd', this.reachEnd, this);
};

//------------------------------------------------------------------------------------------------------------------------------------

// update code called every frame
ScPatrick.prototype.update = function(dt)
{
    // HP Bar effects
    if (this.hpBarBlink > 0)
    {
        this.hpBarBlink -= dt;
        if (this.hpBarBlink <= 0)
        {
            this.hpBarFrame.element.color = pc.Color.WHITE;
            this.hpBarFill.element.color = pc.Color.WHITE;
        }
    }
    
    // Heal effects
    if (this.healEffect > 0)
        this.healEffect -= dt;

    // Game Over or Paused
    if (this.gameOver || this.directorScript.gamePaused)
        return;

    // End Reached
    if (this.endReached && this.entity.getPosition().x >= 18)
    {
        gtag('event', 'level_end');

        this.gameOver = true;
        this.director.fire("gameOver",true);
        this.entity.enabled = false;
        return;
    }

    //  Stung still //------------------------------------------------------------------------------------------------------------------------------------
    if (this.entity.sprite.currentClip.isPlaying && this.entity.sprite.currentClip == this.entity.sprite.clip("Stung"))
        return;

    //------------------------------------------------------------------------------------------------------------------------------------

    let dx = this.xPower * dt;
    if (this.ouchieTime <= 0)
    {
        dx = Math.min(dx,12 * dt);

        if (this.slowTime > 0)
            dx /= 2;
    }
    dx *= this.speedFactor;

    let dy = this.yPower * dt;
    let topReached = false;
    if (this.posY + dy > this.maxHeight)
    {
        topReached = true;
        dy = this.maxHeight - this.posY;
    }
    if (this.slowTime > 0)
        dy /= 2;
    
    // Extra initial boost
    let px = this.posX;
    let initBoost = 1;
    if (px <= 48)
    {
        initBoost = (60 - px)/12;
        dx *= initBoost;
        if (dy > 0)
            dy *= initBoost;
    }

    // Adjust Patrick //------------------------------------------------------------------------------------------------------------------------------------
    if (this.panAdjustRate > 0)
    {
        let pos = this.entity.getPosition();
        let diff = this.panAdjust - pos.x;
        if (diff == 0)
            this.panAdjustRate = 0;
        else
        {
            let rate = this.panAdjustRate;
            let adjust = 0;
            if (diff < 0)
                adjust = Math.max(-rate*dt,diff);
            else if (diff > 0)
                adjust = Math.min(rate*dt,diff);

            // Camera Horizontal Update
            if (!this.endReached)
                this.cam.fire("updateHorizontal",-adjust);
        }
    }

    // Trail Particles
    let spd = (dx + Math.abs(dy))/dt;
    let val = Math.random() * (50+spd)/54;
    if (val > 1)
    {
        let pos = this.entity.getPosition();
        if (this.healEffect > 0)
            this.director.fire("stars",pos.x,pos.y,2);
        else if (this.ouchieTime > 0 && Math.random() < this.ouchieTime/1.5)
            this.director.fire("stars",pos.x,pos.y,0);
        else if (this.slowTime > 0 && Math.random() < this.slowTime/2)
            this.director.fire("stars",pos.x,pos.y,1);
        else this.director.fire("bubs",pos.x,pos.y,0.5);
    }

    // If fell on ground //------------------------------------------------------------------------------------------------------------------------------------
    if (this.onGround)
    {
        if (this.xPower > 0)
        {
            this.xPower *= 0.99;
            dx = Math.min(this.xPower,12) * dt;

            this.posX += dx;
            if (this.endReached)
                this.entity.translate(dx,0,0);

            if (this.xPower < 0.5)
            {
                this.xPower = 0;
                this.gameOver = true;

                let root = this.app.root.findByName("Root");
                root.sound.stop();
                if (ScRoot.sharedData.bgmState == 1)
                    root.sound.play("GameOver");

                this.director.fire("gameOver");
            }
        }
    }
    else //------------------------------------------------------------------------------------------------------------------------------------
    {
        // Physics
        this.posX += dx;
        if (this.endReached)
        {
            this.entity.translate(dx,0,0);
            if (this.hitGround)
                this.posY += dy;
        }
        else this.posY += dy;

        let y = this.posY;

        // No Ouchie
        if (this.ouchieTime <= 0)
        {
            this.xPower = Math.max(0,this.xPower - (this.xDrop * dt));
            this.yPower = Math.max(-12,this.yPower - (this.yDrop * dt/initBoost));

            // Slow Motion
            if (this.slowTime > 0)
            {
                this.slowTime -= dt;
                if (this.slowTime <= 0)
                    this.slowTimeEnd();
                else this.specialTimerText.element.text = Math.ceil(this.slowTime).toString();
            }
        }
        else
        {
            this.ouchieTime -= dt;
            if (this.ouchieTime <= 0)
                this.ouchieEnd();
            else this.specialTimerText.element.text = Math.ceil(this.ouchieTime).toString();
        }

        // Vertical Handling //------------------------------------------------------------------------------------------------------------------------------------
        if (dy != 0)
        {
            // Check hit ground level
            if (y <= 1)
            {
                y = 1;
                this.posY = 1;

                if (this.hitGround && this.bounceGroundPower < 1)
                {
                    this.onGround = true;
                    this.yPower = 0;

                    this.sprite.play("Fell");

                    if (!this.endReached)
                    {
                        this.panAdjustRate = 2;
                        this.panAdjust = 8;
                    }
                }
                else
                {
                    let touch = this.app.touch;
                    if (touch)
                        touch.off(pc.EVENT_TOUCHSTART, this.tapControl);
                    else this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.tapControl);

                    if (this.bounceGroundPower == -1)
                    {
                        this.bounceGroundPower = Math.min(-this.yPower/2,this.xPower*2);

                        this.hitGround = true;

                        this.ouchieEnd();
                        this.slowTimeEnd();

                        this.entity.setEulerAngles(0,0,0);
                        this.trail.sprite.play("None");
                    }
                    else this.bounceGroundPower /= 2;

                    this.yPower = this.bounceGroundPower;
                    this.sprite.play("HitGround");
                }
            }

            //------------------------------------------------------------------------------------------------------------------------------------

            // Rotate Patrick
            if (!this.hitGround && !this.endReached && !topReached && this.ouchieTime <= 0)
                this.entity.setEulerAngles(0,0,ScUtils.point_direction(0,0,this.xPower,this.yPower));
            else this.entity.setEulerAngles(0,0,0);
        }
    }

    // Camera Vertical Update
    this.cam.fire("updateVertical", this.posY, dy);

    //
    if (this.endReached)
        return;

    // Horizontal Simulation //------------------------------------------------------------------------------------------------------------------------------------
    if (dx != 0)
    {
        // Distant Score
        this.addScore(dx,false);

        // Camera Horizontal Update
        this.cam.fire("updateHorizontal",dx);

        // Add distance to spawn director
        this.director.fire("distance",dx);
    }
    
    if (!this.hitGround)
    {
        // Collision Checks //------------------------------------------------------------------------------------------------------------------------------------
        let pos = this.entity.getPosition();
        let x = pos.x;
        let y = pos.y;
        if (this.currentCollider == null)
        {
            this.collisionCircleTag(x,y,1.2,"burger",this.collideBurger,"ReachBurger");
            this.collisionFoodTag(x,y,"foods");
            this.collisionFoodTag(x,y,"coins");
            this.collisionJellyfishTag(x,y);
        }
        else
        {
            let al = x - 1;
            let ar = x + 1;
            let at = y + 1;
            let ab = y - 1;
            let collParam = this.currentColliderParam;
            if (collParam[0] < 0)
            {
                let cpos = this.currentCollider.getPosition();
                if (!ScUtils.coll_rect(al,ar,at,ab,cpos.x+collParam[0],cpos.x+collParam[1],cpos.y+collParam[2],cpos.y+collParam[3])) // Rect ends collision
                    this.currentCollider = null;
            }
            else if (collParam[0] > 0)
            {
                if (!ScUtils.coll_circle(x,y,collParam[0],this.currentCollider)) // Circles ends collision
                    this.currentCollider = null;
            }
            else if (!ScUtils.coll_yline(al,ar,y,1.2,this.currentCollider))  // Jellyfish end collision
                this.currentCollider = null;
        }

        // Animations //------------------------------------------------------------------------------------------------------------------------------------
        if (this.animHold <= 0)
        {
            if (this.ouchieTime <= 0)
            {
                if (this.sprite.currentClip != this.clipFly && !this.sprite.currentClip.isPlaying)
                {
                    this.sprite.play("Fly");
                    this.trail.sprite.play("Fly");
                    this.trail.setLocalEulerAngles(0,0,0);
                }
                if (this.sprite.currentClip == this.clipFly)
                {
                    if (this.yPower >= 0)
                        this.trail.sprite.frame = 1;
                    else this.trail.sprite.frame = 0;
                }
            }
        }
        else this.animHold -= dt;

        // Trail Opacity
        let opacity = 0;
        if (this.ouchieTime > 0)
            opacity = 1;
        else if (this.trailPower <= 0)
        {
            if (this.yPower <= -2)
                opacity = -(this.yPower+2)/2;
        }
        else
        {
            opacity = this.trailPower/2;
            this.trailPower -= dt;
        }
        this.trail.sprite.opacity = Math.min(opacity,1);
    }
    else if (!this.onGround)    //Still bouncing
    {
        let pos = this.entity.getPosition();
        let x = pos.x;
        let y = pos.y;
        this.collisionFoodTag(x,y,"foods");
        this.collisionFoodTag(x,y,"coins");
    }

};

//-----------------------------------------------------------------------------------------------------------------------------------------------------------

// boost or adjust power and angle
ScPatrick.prototype.boost = function(tap,power,angle=90)
{
    if (tap)
        this.yPower += power * Math.sin(angle * pc.math.DEG_TO_RAD);
    else
    {
        if (angle > 0 && this.yPower < 0)
            this.yPower = 0;

        let rad = angle * pc.math.DEG_TO_RAD;
        this.xPower += power * Math.cos(rad);
        this.yPower += power * Math.sin(rad);

        let trailAng = Math.atan(this.yPower/Math.min(this.xPower,12));
        this.trail.setEulerAngles(0,0,trailAng);
    }

    this.yPower = Math.min(this.yPower,12);
};

// tap control
ScPatrick.prototype.tapControl = function(e)
{
    e.event.preventDefault();
    
    if (this.ouchieTime > 0 || this.directorScript.gamePaused)
        return;

    // Tap
    if (this.hp > 0)
    {
        let power = this.tapPower;
        if (this.xPower < 8)
            power *= this.xPower/8;

        this.boost(true,power);

        this.hp = Math.max(0,this.hp - 1);
        this.hpBarFill.element.color = this.hpBarTapCol;
        this.hpBarBlink = 0.1;
        this.updateHPBar();
    }
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------------

// Collisions Rectangle by Tag
ScPatrick.prototype.collisionRectTag = function(x,y,al,ar,at,ab,dl,dr,dt,db,tag,method,reachClip="")
{
    let colliders = this.shiftGroup.findByTag(tag);
    let reachRadius = dl + 1.5;
    for (let collider of colliders)
    {
        let cpos = collider.getPosition();
        let cx = cpos.x;
        let cy = cpos.y;
        if (ScUtils.coll_rect(al,ar,at,ab,cx+dl,cx+dr,cy+dt,cy+db))
        {
            this.currentCollider = collider;
            this.currentColliderParam = [dl,dr,dt,db];
            method = method.bind(this);
            method(collider,x,y,cx,cy);
            return 2;
        }
        else if (ScUtils.point_distance(x,y,cx,cy) <= reachRadius)
            return this.reachCheck(collider,x,y,cx,cy,reachRadius,reachClip);
    }
    return 0;
};

// Collisions Circle by Tag
ScPatrick.prototype.collisionCircleTag = function(x,y,radius,tag,method=null,reachClip="")
{
    let colliders = this.shiftGroup.findByTag(tag);
    let reachRadius = radius + 1.5;
    for (let collider of colliders)
    {
        let cpos = collider.getPosition();
        let dist = ScUtils.point_distance(x,y,cpos.x,cpos.y);
        if (dist > reachRadius)
            continue;
        
        if (dist > radius)
            return this.reachCheck(collider,x,y,cpos.x,cpos.y,reachRadius,reachClip);
        else
        {
            if (method != null)
            {
                this.currentCollider = collider;
                this.currentColliderParam[0] = radius;
                method = method.bind(this);
                method(collider,x,y,cpos.x,cpos.y,dist);
            }
            return 2;
        }
    }
    return 0;
};

// Collisions Foods/Coins by Tag
ScPatrick.prototype.collisionFoodTag = function(x,y,tag)
{
    let colliders = this.shiftGroup.findByTag(tag);
    let radius = 1.2;
    let reachRadius = radius + 1.5;
    let reachState = 0;
    for (let collider of colliders)
    {
        let cpos = collider.getPosition();
        let dist = ScUtils.point_distance(x,y,cpos.x,cpos.y);
        if (dist > reachRadius)
            continue;
        
        if (dist > radius)
        {
            if (reachState != 1)
            {
                if (this.reachCheck(collider,x,y,cpos.x,cpos.y,reachRadius,"ReachFood") == 1)
                    reachState = 1;
            }
        }
        else
        {
            this.collideFood(collider,tag);
            return 2;
        }
    }
    return 0;
};

// Collisions Jellyfish by Tag
ScPatrick.prototype.collisionJellyfishTag = function(x,y)
{
    let xa = x-0.5;
    let xb = x+0.5;
    let colliders = this.shiftGroup.findByTag("jelly");
    for (let collider of colliders)
    {
        if (ScUtils.coll_yline(xa,xb,y,1.2,collider))
        {
            this.currentCollider = collider;
            this.currentColliderParam[0] = 0;
            this.collideJellyfish(collider,x,y);
            return 2;
        }
    }
    return 0;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------------

// Reach checking
ScPatrick.prototype.reachCheck = function(collider,x,y,cx,cy,reachRadius,reachClip)
{
    if (this.currentReach == null)
    {
        if (x < cx && Math.abs(y-cy) < 1)
        {
            this.currentReach = collider;
            this.currentReachRadius = reachRadius;
            this.reachAnimate(reachClip);
            return 1;
        }
    }
    else if (x >= this.currentReach.getPosition().x || !ScUtils.coll_circle(x,y,this.currentReachRadius,this.currentReach))
    {
        if (this.entity.sprite.currentClip.isPlaying)
        {
            let clip = this.entity.sprite.currentClip;
            if (clip == this.entity.sprite.clip("ReachBurger") || clip == this.entity.sprite.clip("ReachFood"))
                this.entity.sprite.stop();
        }
        this.currentReach = null;
        return -1;
    }
    return 0;
};

// Reach anims
ScPatrick.prototype.reachAnimate = function(clip)
{
    if (clip == "" || this.sprite.currentClip != this.clipFly)
        return;
    this.entity.sprite.play(clip);
    if (clip == "ReachBurger")
    {
        this.trail.sprite.play("Reach");
        this.trailPower = 2;
    }

    if (clip == "ReachFood")
        this.animHold = 0.4;
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------------

// Collisions Jellyfishes
ScPatrick.prototype.collideJellyfish = function(jelly,x,y)
{
    let jellyY = jelly.getPosition().y;
    if (y >= jellyY)
    {
        //Shift Patrick up in case too low
        let diffY = (y - (jellyY+0.8)) / 2;
        if (diffY < 0)
        {
            this.posY -= diffY;
            this.cam.fire("updateVertical", this.posY, diffY);
        }

        this.ouchieEnd();

        this.entity.sprite.play("Bounce");
        this.trail.sprite.play("BounceSmall");
        this.trailPower = 2;
        jelly.sprite.play("Bounce");
        this.entity.sound.play("Bounce");

        let z = -(jelly.getPosition().z + 8) * 10;
        if (z == 0)
        {
            let pow = ScUtils.point_distance(0,0,this.xPower,this.yPower)/4;
            this.boost(false,pow,30);
        }
        else
        {
            let ang = 0;
            if (z >= 6)
                ang = 60;
            else if (z >= 4.5)
                ang = 45;
            else if (z >= 3)
                ang = 30;
            else if (z >= 1.5)
                ang = 15;

            this.boost(false,(z*100)%10 * (this.yDrop/2),ang);
        }

        gtag('event', 'collide', {
            'object': 'jellyfish',
            'info': 'bounce'
        });
    }
    else
    {
        this.ouchieEnd();
        this.slowTimeEnd();

        this.entity.sprite.play("Stung");
        this.trail.sprite.play("None");
        this.hp -= 20;
        if (this.hp < 0)
            this.hp = 0;
        this.updateHPBar(-1);

        this.director.fire("disperseJellyfishes",x,y);

        this.entity.sound.play("Shocked");

        gtag('event', 'collide', {
            'object': 'jellyfish',
            'info': 'stung'
        });
    }
};

// Collisions Foods
ScPatrick.prototype.collideFood = function(food,tag)
{
    if (tag == "coins")
    {
        let points = 100;
        if (food.getLocalScale().x > 1)  // Bigger gains doubled score
            points *= 2;

        this.bonusCount += points;
        this.entity.sound.play("Coin");
    }
    else
    {
        let factor = 1;
        if (food.sprite.frame == 3)  // Bundled dums gives triple
            factor = 3;

        this.addScore(50 * factor);
        this.entity.sound.play("Food");

        gtag('event', 'collide', {
            'object': 'food',
            'info': factor
        });
    }

    this.currentCollider = null;
    this.currentReach = null;

    food.destroy();
};

// Collisions Burger
ScPatrick.prototype.collideBurger = function(burger)
{
    if (burger.script.scBurger.collected)
        return 0;

    this.hp = Math.min(this.hp + 20, this.hpMax);
    this.updateHPBar(1);
    this.animHold = 0.5;
    this.healEffect = 1;

    burger.fire("collected", this);

    this.entity.sound.play("Burger");

    gtag('event', 'collide', {
        'object': 'burger'
    });
};

//---------------------------------------------------------------

// Special Powers
ScPatrick.prototype.tapSpecial = function(special)
{
    if (special == -1)
        return;


    if (special == 0)  // Boost
    {
        this.slowTime = 0;

        this.ouchieTime = 3;
        this.entity.sprite.play("Boost");
        this.trail.sprite.play("Urchin");
        this.trailPower = 2;
        this.entity.setLocalEulerAngles(0,0,0);
        this.trail.setLocalEulerAngles(0,0,0);

        this.xPower = 16;
        this.yPower = 0;

        this.entity.sound.play("GainSpecial");
        this.specialTimerText.enabled = true;
        this.specialTimerText.element.text = Math.ceil(this.ouchieTime).toString();
    }
    else if (special == 1)    // Slow
    {
        this.ouchieTime = 0;

        this.slowTime = 8;
        this.specialTimerText.enabled = true;
        this.specialTimerText.element.text = Math.ceil(this.slowTime).toString();
    }
    else   // Stamina
    {
        this.entity.sound.play("HealthGain");
        this.hp = Math.min(this.hp + 20, this.hpMax);
        this.updateHPBar(1);
        this.healEffect = 1;
    }
};

// Ouchie Ends
ScPatrick.prototype.ouchieEnd = function()
{
    this.ouchieTime = 0;
    if (this.slowTime <= 0)
        this.specialTimerText.enabled = false;
};
// SlowTime Ends
ScPatrick.prototype.slowTimeEnd = function()
{
    this.slowTime = 0;
    if (this.ouchieTime <= 0)
        this.specialTimerText.enabled = false;
};

// Reached the end
ScPatrick.prototype.reachEnd  = function()
{
    this.endReached = true;

    let touch = this.app.touch;
    if (touch)
        touch.off(pc.EVENT_TOUCHSTART, this.tapControl);
    else this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.tapControl);

    this.specialTimerText.enabled = false;
    if (this.hitGround || this.ouchieTime > 0)
        return;

    let anim = ScUtils.choose("ReachBurger","ReachFood");
    this.sprite.play(anim);
    this.entity.setEulerAngles(0,0,0);

    this.trail.sprite.play("Reach");
    this.trail.sprite.opacity = 1;
    this.trail.setLocalEulerAngles(0,0,0);
};

//------------------------------------------------------------------

ScPatrick.prototype.updateHPBar  = function(fx=0)
{
    if (fx != 0)
    {
        this.hpBarBlink = 0.1;
        if (fx == 1)
            this.hpBarFrame.element.color = this.hpBarHealCol;
        else this.hpBarFrame.element.color = this.hpBarHurtCol;
        this.hpBarFill.element.color = this.hpBarFrame.element.color;
    }

    let ratio = this.hp / this.hpMax;
    this.hpBarFill.element.rect.z = ratio;
    this.hpBarFill.element.width = 212 * ratio;
    this.hpBarFill.element.anchor = this.hpBarFill.element.anchor;
};

ScPatrick.prototype.addScore  = function(amount,isCollect=true)
{
    if (isCollect)
    {
        this.collectScore += amount;
        this.updateScoreCounter();
    }
    else
    {
        this.distScore += amount;
        this.updateScoreCounter(false);
    }

    this.specialGain += amount;
    while (this.specialGain >= 10000)
    {
        this.specialGain -= 10000;
        this.specialTap.fire("addCount");
        this.entity.sound.play("GainSpecial");

        gtag('event', 'special_gain');
    }
};

ScPatrick.prototype.updateScoreCounter  = function(fx=true)
{
    let total = Math.min(Math.round(this.distScore + this.collectScore),999999);
    this.scoreCounter.element.text = ScUtils.formatNumber(total);

    if (fx || this.scoreBlink > 0)
    {
        this.scoreCoin.element.spriteFrame = 1;
        this.scoreCoin.setLocalScale(0.9,1.4,1);
        if (fx)
            this.scoreBlink = 4;
        else this.scoreBlink--;
    }
    else
    {
        this.scoreCoin.element.spriteFrame = 0;
        this.scoreCoin.setLocalScale(1,1,1);
    }
};
