var ScSlingPart = pc.createScript('scSlingPart');

// initialize code called once per entity
ScSlingPart.prototype.initialize = function()
{
    this.state = 0; //0:Initial, 1:Expanded, 2:Launched, 3:springing/done

    this.sling = this.entity.parent;
    this.partA = this.entity.findByName("oSlingA");
    this.partB = this.entity.findByName("oSlingB");
    this.effect = this.entity.findByName("oSlingEffect");
    this.stringA = this.sling.findByName("oStringA");
    this.stringB = this.sling.findByName("oStringB");
    this.stringC = this.sling.findByName("oStringC");
    this.stringD = this.sling.findByName("oStringD");

    this.slingshot = this.sling.parent;
    this.slingshotScript = this.slingshot.script.scSlingshot;

    this.stickL = this.slingshot.findByName("oSlingstickL");
    
    this.stringAInitPos = new pc.Vec3(-0.18, 0.35, 0.5);
    this.stringBInitPos = new pc.Vec3(-0.18,-0.35, 0.5);
    this.stringCInitPos = new pc.Vec3( 0.2 , 0.35,-2);
    this.stringDInitPos = new pc.Vec3( 0.18,-0.3 ,-2);

    this.entity.on("charge", function()
    {
        this.state = 1;

        this.partA.sprite.frame = 1;
        this.partB.sprite.frame = 1;
        
        this.stringA.setLocalPosition(-0.1, 0.35, 0.5);
        this.stringB.setLocalPosition( 0.1,-0.3 , 0.5);
        this.stringC.setLocalPosition( 0.2, 0.35,-2);
        this.stringD.setLocalPosition( 0.3,-0.25,-2);
    }, this);

    this.entity.on("move", function(dist)
    {
        if (this.entity.getPosition().x > this.slingshot.getPosition().x)
        {
            if (this.state == 1)
            {
                this.state = 2;

                this.slingshotScript.launchState = 3;
                this.slingshotScript.patrick.destroy();
                this.effect.enabled = true;

                let patrick = this.app.root.findByName("Root").findByName("SceneRoot").findByName("oPatrick");
                patrick.enabled = true;
                patrick.script.scPatrick.boost(false,this.slingshotScript.launchPower,this.slingshotScript.aimDir);

                this.stringA.setLocalPosition(-this.stringCInitPos.x,this.stringCInitPos.y,-0.1);
                this.stringB.setLocalPosition(-this.stringDInitPos.x,this.stringDInitPos.y,-0.1);
                this.stringC.setLocalPosition(-this.stringAInitPos.x,this.stringAInitPos.y,-1);
                this.stringD.setLocalPosition(-this.stringBInitPos.x,this.stringBInitPos.y,-1);
            }
        }
        else if (this.state == 2)
        {
            this.state = 3;
            this.effect.destroy();

            this.stringA.setLocalPosition(this.stringAInitPos);
            this.stringB.setLocalPosition(this.stringBInitPos);
            this.stringC.setLocalPosition(this.stringCInitPos);
            this.stringD.setLocalPosition(this.stringDInitPos);
        }

        //
        this.stretch(dist);
    }, this);
};

// update code called every frame
ScSlingPart.prototype.update = function(dt) {

};

//
ScSlingPart.prototype.stretch = function(dist)
{
    // SlingPart
    if (this.state != 1)
    {
        let d = Math.abs(dist)/2;
        if (d < 1)
            d = 1;
        this.entity.setLocalScale(d,1,1);
    }

    // Strings
    let anchor = this.slingshot.getPosition();
    let oX = anchor.x;
    let oY = anchor.y;

    let launchState = this.slingshotScript.launchState;
    let frame = this.stickL.sprite.frame;
    this.partA.sprite.frame = frame;
    this.partB.sprite.frame = frame;

    if (launchState == 0 || launchState == 6 || frame == 2 || frame == 6 || frame == 8)     // Center
    {
        this.stringA.setLocalPosition(this.stringAInitPos);
        this.stringB.setLocalPosition(this.stringBInitPos);
        this.stringC.setLocalPosition(this.stringCInitPos);
        this.stringD.setLocalPosition(this.stringDInitPos);
        this.stringA.script.scSlingStrings.stretch(oX-0.58,oY+0.57);
        this.stringB.script.scSlingStrings.stretch(oX-0.58,oY-0.52);
        this.stringC.script.scSlingStrings.stretch(oX+0.38,oY+0.44);
        this.stringD.script.scSlingStrings.stretch(oX+0.38,oY-0.55);
    }
    else if (frame == 0)    // Full Charge
    {
        this.stringA.setLocalPosition(-0.1, 0.35, 0.5);
        this.stringB.setLocalPosition( 0.2,-0.25, 0.5);
        this.stringC.setLocalPosition( 0.1, 0.35,-2);
        this.stringD.setLocalPosition( 0.5,-0.2 ,-2);
        this.stringA.script.scSlingStrings.stretch(oX-1.78,oY+0.09);
        this.stringB.script.scSlingStrings.stretch(oX-0.95,oY-0.7);
        this.stringC.script.scSlingStrings.stretch(oX-0.48,oY);
        this.stringD.script.scSlingStrings.stretch(oX+0.01,oY-0.7);
    }
    else if (frame == 1 || frame == 7)  // Half Charge
    {
        this.stringA.setLocalPosition(-0.1, 0.35, 0.5);
        this.stringB.setLocalPosition( 0.1,-0.3 , 0.5);
        this.stringC.setLocalPosition( 0.2, 0.35,-2);
        this.stringD.setLocalPosition( 0.3,-0.25,-2);
        this.stringA.script.scSlingStrings.stretch(oX-1.41,oY+0.47);
        this.stringB.script.scSlingStrings.stretch(oX-1,oY-0.57);
        this.stringC.script.scSlingStrings.stretch(oX-0.25,oY+0.34);
        this.stringD.script.scSlingStrings.stretch(oX+0.24,oY-0.59);

    }
    else if (frame == 3 || frame == 5)  // Half Spring
    {
        this.stringA.setLocalPosition( 0  , 0.3 , 0.5);
        this.stringB.setLocalPosition(-0.2,-0.3 , 0.5);
        this.stringC.setLocalPosition( 0.0, 0.35,-2);
        this.stringD.setLocalPosition(-0.2,-0.25,-2);
        this.stringA.script.scSlingStrings.stretch(oX+0,oY+0.47);
        this.stringB.script.scSlingStrings.stretch(oX-0.38,oY-0.57);
        this.stringC.script.scSlingStrings.stretch(oX+0.95,oY+0.35);
        this.stringD.script.scSlingStrings.stretch(oX+0.57,oY-0.58);
    }
    else // (frame == 4)    // Full Spring
    {
        this.stringA.setLocalPosition(-0.1, 0.3, 0.5);
        this.stringB.setLocalPosition(-0.3,-0.3, 0.5);
        this.stringC.setLocalPosition(-0.15, 0.35,-2);
        this.stringD.setLocalPosition(-0.25,-0.3,-2);
        this.stringA.script.scSlingStrings.stretch(oX+0.39,oY+0.09);
        this.stringB.script.scSlingStrings.stretch(oX-0.34,oY-0.7);
        this.stringC.script.scSlingStrings.stretch(oX+1.26,oY);
        this.stringD.script.scSlingStrings.stretch(oX+0.6,oY-0.7);
    }
};