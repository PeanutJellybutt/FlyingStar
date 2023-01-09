var ScScrollUi = pc.createScript('scScrollUi');

// initialize code called once per entity
ScScrollUi.prototype.initialize = function()
{
    //
    this.state = 0;
    this.locked = false;
    this.lastDiff = 0;
    this.initY = 0;
    this.scroll = 0;
    this.index = 0;
    this.textArray = [];
    this.lines = 0;

    //
    this.entity.on("activate",this.activate,this);

    //
    let touch = this.app.touch;
    if (touch)
    {
        this.entity.element.on('touchstart', function(e) {
            this.state = 2;
            this.locked = true;
            this.initY = e.y;
            e.event.preventDefault();
            e.stopPropagation();
        }, this);

        this.entity.element.on('touchmove', function(e) {
            this.interact(e);
        }, this);

        this.entity.element.on('touchend', function(e)
        {
            this.interact(e,2);
            this.state = 0;
        },
        this);

        this.entity.element.on('touchcancel', function(e) {
            this.interact(e,2);
            this.state = 0;
        }, this);
    }
    else
    {
        this.entity.element.on('mousedown', function(e) {
            this.state = 2;
            this.locked = true;
            this.initY = e.y;
            e.stopPropagation();
        }, this);

        this.entity.element.on('mousemove', function(e) {
            this.interact(e);
        }, this);

        this.entity.element.on('mouseup', function(e)
        {
            this.interact(e,2);
            this.state = 0;
        },
        this);

        this.entity.element.on('mouseleave', function(e) {
            this.interact(e,2);
            this.state = 0;
        }, this);

        this.entity.element.on('mousewheel', function(e) {
            this.interact(e,1);
            this.state = 0;
        }, this);
    }
};

// update code called every frame
ScScrollUi.prototype.update = function(dt)
{
    if (!this.locked)
    {
        let scroll = this.scroll;
        if (scroll != 0)
        {
            let pvIndex = this.index;
            this.index = pc.math.clamp(this.index + this.scroll,0,Math.max(this.lines-10,0));
            let index = Math.round(this.index);
            if (pvIndex != index)
            {
                let last = pc.math.clamp(this.index+20,1,this.lines);
                let text = "";
                for (let i=index; i<last; i++)
                    text += this.textArray[i]+"\n";
                this.entity.element.text = text;

                if (this.index <= 0 || this.index >= this.lines-10)
                    scroll = 0;
            }

            scroll *= 0.98;
            if (scroll > -0.00001 && scroll < 0.00001)
                scroll = 0;
            this.scroll = scroll;
        }
    }
};

// Interacted
ScScrollUi.prototype.interact = function(e,type=0)
{
    if (this.state != 2 && type != 1)
        return;

    let input = e;
    if (this.app.touch)
    {
        input = e;
        e.event.preventDefault();
    }

    if (type != 2)  // Move
    {
        if (type == 0)
        {
            this.lastDiff = (this.initY - input.y) / 32;
            this.initY = input.y;
        }
        else
        {
            this.lastDiff = input.wheelDelta * 2;
            this.scroll = 0;
        }

        let pvIndex = this.index;
        this.index = pc.math.clamp(this.index + this.lastDiff,0,Math.max(this.lines-10,0));
        let index = Math.round(this.index);
        if (pvIndex != index)
        {
            let last = pc.math.clamp(this.index+20,1,this.lines);
            let text = "";
            for (let i=index; i<last; i++)
                text += this.textArray[i]+"\n";
            this.entity.element.text = text;
        }
    }
    else //Leave/Cancel/Lift
    {
        this.scroll = this.lastDiff * 10;
        this.locked = false;
        this.lastDiff = 0;
    }

    e.stopPropagation();
};

// Reset
ScScrollUi.prototype.activate = function(asset)
{
    this.state = 0;
    this.locked = false;
    this.lastDiff = 0;
    this.initY = 0;
    this.scroll = 0;
    this.index = 0;

    this.textArray = asset.resource.split(/\r\n|\r|\n/);
    this.lines = this.textArray.length;

    let text = "";
    let last = pc.math.clamp(this.index+20,1,this.lines);
    for (let i=this.index; i<last; i++)
        text += this.textArray[i]+"\n";
    this.entity.element.text = text;
};