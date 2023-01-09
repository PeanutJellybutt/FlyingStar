var ScKeysUi = pc.createScript('scKeysUi');

ScKeysUi.attributes.add('clickEvent',{ type: 'string', title: 'Click Event', default: 'default' });

// initialize code called once per entity
ScKeysUi.prototype.initialize = function()
{
    //
    this.root = this.app.root.findByName("Root");
    this.clickLink = this.root.findByName("UI_Login");
    this.locked = true;
    this.state = 0;
    this.initX = 0;
    this.initY = 0;

    this.frameInit = this.entity.element.spriteFrame;
    this.hold = 0;
    this.tickShift = 0;
    this.tickDel = 0.5;
    this.intvDel = 0.25;

    this.entity.on("lock",function(lock=true) {
        this.locked = lock;
        this.entity.element.spriteFrame = this.frameInit;
        this.hold = 0;
    },this);

    this.entity.on("shiftOff",function() {
        this.hold = 0;
        this.entity.element.spriteFrame = this.frameInit;
    },this);

    //
    let touch = this.app.touch;
    if (touch)
    {
        this.entity.element.on('touchend', function(e) {
            if (this.state == 2)
                this.interacted(0,2);
            this.state = 0;
            e.event.preventDefault();
        }, this);

        this.entity.element.on('touchstart', function(e)
        {
            this.tickDel = 0.5;
            this.intvDel = 0.25;
            this.interacted(1,1);
            this.state = 2;
            this.initX = e.x;
            this.initY = e.y;
            e.event.preventDefault();
            e.stopPropagation();
        },
        this);

        this.entity.element.on('touchmove', function(e)
        {
            if (ScUtils.point_distance(this.initX,this.initY,e.x,e.y) > 32)
            {
                this.interacted();
                this.state = 0;
            }
            e.event.preventDefault();
        },
        this);

        this.entity.element.on('touchcancel', function(e) {
            this.interacted();
            this.state = 0;
            e.event.preventDefault();
        }, this);
    }
    else
    {
        this.entity.element.on('mousedown', function(e) {
            if (this.state == 1)
            {
                this.interacted(1,1);
                this.state = 2;
                this.tickDel = 0.5;
                this.intvDel = 0.25;
            }
            e.stopPropagation();
        }, this);

        this.entity.element.on('mouseup', function(e) {
            if (this.state == 2)
            {
                this.interacted(0,2);
                this.state = 1;
            }
        }, this);

        this.entity.element.on('mouseenter', function(e) {
            this.state = 1;
        }, this);

        this.entity.element.on('mouseleave', function(e) {
            this.interacted();
            this.state = 0;
        }, this);
    }
};

// update code called every frame
ScKeysUi.prototype.update = function(dt)
{
    if (this.tickShift > 0)
        this.tickShift -= dt;

    if (this.clickEvent == 32 && this.state == 2)
    {
        this.tickDel -= dt;
        if (this.tickDel <= 0)
        {
            this.tickDel = this.intvDel;
            this.intvDel *= 0.9;
            this.clickLink.fire('button',3,32);
        }
    }
};

// visual change on UI
ScKeysUi.prototype.interacted = function(visual=0,action=0)
{
    if (this.locked)
        return;

    if (this.clickEvent < 30)
    {
        let char = this.entity.findByName("Text");
        if (visual == 0)
        {
            this.entity.element.spriteFrame = 0;
            this.entity.element.pivot = [0.5,0.5];
            char.element.pivot = [0.5,0.5];
            char.element.fontSize = 56;
            char.setLocalPosition(0,0,0);
        }
        else // Down
        {
            this.entity.element.spriteFrame = 1;
            this.entity.element.pivot = [0.5,0.25];
            char.element.pivot = [0.5,0];
            char.element.fontSize = 128;
            char.setLocalPosition(0,32,0);
        }
    }
    else
    {
        if (action == 1)
        {
            if (this.clickEvent == 30)
            {
                if (this.hold == 0)
                {
                    this.hold = 1;
                    this.tickShift = 0.4;
                }
                else if (this.tickShift > 0)
                {
                    this.tickShift = 0;
                    this.hold = 2;
                    this.clickLink.fire('button',3,31);
                    action = 0;
                }
                else this.hold = 0;
            }
            else if (this.clickEvent == 33)
                this.hold = ((this.hold == 0) ? 1 : 0);
        }

        if (this.hold != 0)
            visual = this.hold;

        this.entity.element.spriteFrame = this.frameInit + visual;
    }
    
    if (action == 1)
    {
        this.root.fire("click");
        this.clickLink.fire('button',3,this.clickEvent);
    }
    
};