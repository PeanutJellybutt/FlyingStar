var ScMinimap = pc.createScript('scMinimap');

// initialize code called once per entity
ScMinimap.prototype.initialize = function()
{
    this.tplMarker = this.entity.findByName("tplMarker");

    this.themeStart = 0;
    this.lengthFactor = 3.2;
    this.distance = 0;
    this.patrickY = 0;

    this.markPatrick = this.tplMarker.clone();
    this.entity.addChild(this.markPatrick);
    this.markPatrick.setLocalPosition(-240,0,0);
    this.markPatrick.enabled = true;

    this.markersList = [];
    this.markersListN = 0;

    this.entity.on("updateHorizontal", this.updateHorizontal, this);

    this.entity.on("updateVertical", function(y)
    {
        this.patrickY = y;
        let n = this.markersListN;
        for (let i=0; i<n; i++)
        {
            if (this.updateMarker(i) == -1)
            {
                i--;
                n--;
            }
        }
    },
    this);

    this.entity.on("reset", function(start,length)
    {
        let n = this.markersListN;
        for (let i=0; i<n; i++)
            this.markersList[i][0].destroy();

        this.markersList = [];
        this.markersListN = 0;
        this.lengthFactor = 480 / length;
        this.themeStart = start;
        this.updateHorizontal(start);
    },
    this);

    this.entity.on("add", this.createMarker, this);
};

// update code called every frame
ScMinimap.prototype.update = function(dt) {

};

// create marker
ScMinimap.prototype.createMarker = function(entity,x,frame=3)
{
    let marker = this.tplMarker.clone();
    this.entity.insertChild(marker,0);

    let xpos = ((x-this.themeStart)*this.lengthFactor) - 240;
    marker.setLocalPosition(xpos,0,0);
    marker.element.spriteFrame = frame;
    marker.enabled = true;

    this.markersList[this.markersListN] = [marker,entity];
    this.updateMarker(this.markersListN);
    this.markersListN++;
};

// update marker
ScMinimap.prototype.updateMarker = function(index)
{
    let entity = this.markersList[index][1];
    if (!entity.enabled)
    {
        this.markersList[index][0].destroy();
        this.markersList.splice(index,1);
        this.markersListN--;
        return -1;
    }

    let yDiff = (entity.getLocalPosition().y - this.patrickY) / 4.5;
    let absYDiff = Math.abs(yDiff) - 1;
    let scale = 1;
    if (absYDiff > 0)
        scale = 1 - Math.min(absYDiff/8,0.5);

    let marker = this.markersList[index][0];
    let pos = marker.getLocalPosition();
    pos.y = pc.math.clamp(yDiff,-1,1) * 32;
    marker.setLocalPosition(pos);
    marker.setLocalScale(scale,scale,1);

    return 1;
};

ScMinimap.prototype.updateHorizontal = function(x)
{
    let xShift = (x-this.themeStart) * this.lengthFactor;
    let pos = this.markPatrick.getLocalPosition();
    pos.x = xShift - 240;
    this.markPatrick.setLocalPosition(pos);

    if (xShift >= 160)
        this.markPatrick.element.spriteFrame = 1;
    else if (xShift >= 320)
        this.markPatrick.element.spriteFrame = 2;
    else this.markPatrick.element.spriteFrame = 0;
};