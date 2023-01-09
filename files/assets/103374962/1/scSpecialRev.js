var ScSpecialRev = pc.createScript('scSpecialRev');

// initialize code called once per entity
ScSpecialRev.prototype.initialize = function()
{
    //
    this.screen = this.app.root.findByName("2DScreen").screen;
    this.res = this.screen.resolution;
    let pos = this.entity.getPosition();
    this.oX = (1+pos.x)/2;  //position is somehow of top-left and normalize to 1, so +1 and /2 to get center position
    this.oY = (1-pos.y)/2;

    //
    this.turn = 0;
    this.icons = [ [this.entity.findByName("imgSpecialIcon1"),-1],
                   [this.entity.findByName("imgSpecialIcon2"),-1],
                   [this.entity.findByName("imgSpecialIcon3"),-1] ];
    this.iconCurr = 1;

    //
    this.hasSpecial = true;
    let unlocked = this.entity.parent.script.scSpecialUI.specialUnlocked;
    let index = 1;
    let count = 0;
    for (let i=0; i<3; i++)
    {
        if (!unlocked[i])
            continue;

        let icon = this.icons[index][0];
        icon.enabled = true;
        icon.findByName("Image").element.spriteFrame = i+2;
        this.icons[index][1] = i;
        count++;
        if (index == 1)
            index = 0;
        else index = 2;
    }
    this.minDir = 0;
    this.maxDir = 0;
    if (count > 1)
    {
        this.minDir = -45;
        if (count > 2)
            this.maxDir = 45;
    }
    this.specialCurr = this.icons[1][1];

    //
    this.state = 0;
    this.initDir = 0;
    this.updateRotate = false;
    this.locked = false;
    this.lastDiff = 0;
    this.moved = 0;

    //
    this.on("countOut", function(out=true)
    {
        let icon = this.icons[this.iconCurr][0];
        if (out)
        {
            icon.element.opacity = 0.5;
            icon.element.spriteFrame = 1;
            icon.findByName("Image").element.opacity = 0.5;
            this.hasSpecial = false;
        }
        else
        {
            icon.element.opacity = 1;
            icon.element.spriteFrame = 0;
            icon.findByName("Image").element.opacity = 1;
            this.hasSpecial = true;
        }
    },
    this);

    //
    let touch = this.app.touch;
    if (touch)
    {
        this.entity.element.on('touchstart', function(e) {
            this.state = 2;
            this.locked = true;
            this.moved = 0;
            this.initDir = ScUtils.point_direction_ui(this.oX*this.res.x, this.oY*this.res.y, e.x, e.y);
            e.event.preventDefault();
            e.stopPropagation();
        }, this);

        this.entity.element.on('touchmove', function(e) {
            this.interact(e);
        }, this);

        this.entity.element.on('touchend', function(e)
        {
            if (this.moved < 3)
                this.interact(e,2);
            else this.interact(e,1);
            this.state = 0;
        },
        this);

        this.entity.element.on('touchcancel', function(e) {
            this.interact(e,1);
            this.state = 0;
        }, this);
    }
    else
    {
        this.entity.element.on('mousedown', function(e) {
            this.state = 2;
            this.locked = true;
            this.moved = 0;
            this.initDir = ScUtils.point_direction_ui(this.oX*this.res.x, this.oY*this.res.y, e.x, e.y);
            e.stopPropagation();
        }, this);

        this.entity.element.on('mousemove', function(e) {
            this.interact(e);
        }, this);

        this.entity.element.on('mouseup', function(e)
        {
            if (this.moved < 3)
                this.interact(e,2);
            else this.interact(e,1);
            this.state = 0;
        },
        this);

        this.entity.element.on('mouseleave', function(e) {
            this.interact(e,1);
            this.state = 0;
        }, this);
    }
};

// update code called every frame
ScSpecialRev.prototype.update = function(dt)
{
    //Needs rounding because engine outputs inaccurate floating numbers when getting Euler angles, despite assigning integers
    //This is because Euler angles are not stored directly but rather calculated every use
    let oAng = this.entity.getLocalEulerAngles().z; //Use for calculation
    let ang = +(oAng.toPrecision(2));   //Use for condition checking
    let prevAng = ang;

    //
    if (!this.locked)
    {
        let turn = this.turn;
        if (turn != 0)
        {
            this.entity.rotateLocal(0,0,turn);
            ang += turn;

            turn *= 0.98;
            if (ang < this.minDir || ang > this.maxDir)
                turn *= 0.75;

            if (turn > -0.1 && turn < 0.1)
                turn = 0;
            this.turn = turn;
        }
        else
        {
            let dir = (this.iconCurr*45)-45;
            if (ang != dir && ( ang < this.minDir || ang > this.maxDir || (ang >= dir-15 && ang <= dir+15)) )
            {
                let d = (oAng-dir) * 0.95;
                if (d > -0.05 && d < 0.05)
                    d = 0;

                ang = dir + d;
                this.entity.setLocalEulerAngles(0,0,ang);
            }
        }
    }

    //
    if (this.hasSpecial)
    {
        let index = this.iconCurr;
        this.icons[index][0].rotateLocal(0,0,-45*dt);
        //this.icons[index][0].findByName("Image").setEulerAngles(0,0,0);   //doesn't work properly
        this.icons[index][0].findByName("Image").rotateLocal(0,0,45*dt);
    }

    //
    if (prevAng != ang || this.updateRotate)
    {
        this.updateRotate = false;

        // Update current icon
        let index = pc.math.clamp(Math.floor(((ang+45)/45)+0.5),0,2);
        if (index != this.iconCurr && this.icons[index][1] != -1)
        {
            let icon = this.icons[this.iconCurr][0];
            icon.element.opacity = 0.5;
            icon.element.spriteFrame = 1;
            icon.setLocalScale(0.67,0.67,0.67);
            icon.findByName("Image").element.opacity = 0.5;

            this.iconCurr = index;
            icon = this.icons[index][0];
            icon.setLocalScale(1,1,1);
            if (this.hasSpecial)
            {
                icon.element.opacity = 1;
                icon.element.spriteFrame = 0;
                icon.findByName("Image").element.opacity = 1;
            }

            this.specialCurr = this.icons[index][1];
        }

        // Keep upright
        for (let i=0; i<3; i++)
            this.icons[i][0].findByName("Image").setEulerAngles(0,0,0);
    }
};

// Interacted
ScSpecialRev.prototype.interact = function(e,type=0)
{
    if (this.state != 2)
        return;

    let input = e;
    if (this.app.touch)
    {
        input = e;
        e.event.preventDefault();
    }

    if (type == 0)
    {
        let dir = ScUtils.point_direction_ui(this.oX*this.res.x,this.oY*this.res.y,input.x ,input.y);
        let angDiff = ScUtils.ang_diff(this.initDir,dir) * (this.app.touch ? 1.3 : 1);

        this.entity.rotateLocal(0,0,angDiff);
        this.updateRotate = true;
        this.initDir = dir;
        this.lastDiff = angDiff;
        this.moved++;
    }
    else
    {
        if (type == 1)
            this.turn = this.lastDiff/2;
        else
        {
            let dir = this.entity.getLocalEulerAngles().z;
            let angDiff = ScUtils.ang_diff(this.initDir,135);
            //For slide effects
            if (angDiff > 0)
                angDiff -= 10;
            else angDiff += 10;

            this.entity.setLocalEulerAngles(0,0,pc.math.clamp(dir+angDiff,this.minDir,this.maxDir));
            this.updateRotate = true;
        }

        this.moved = 0;
        this.locked = false;
        this.lastDiff = 0;
    }

    e.stopPropagation();
};