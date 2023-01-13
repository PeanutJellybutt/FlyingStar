var ScLeaderboard = pc.createScript('scLeaderboard');

// initialize code called once per entity
ScLeaderboard.prototype.initialize = function()
{
    this.spotlight = this.entity.findByName("imgShade");
    this.board = this.entity.findByName("imgBoardBox");
    this.tmpEntry = this.board.findByName("tmpEntry");
    this.title = this.board.findByName("txtLeaderboard");
    this.uiCharacters = this.entity.findByName("uiCharacters");
    this.homeBtn = this.entity.findByName("imgHomeBtn");
    this.replayBtn = this.entity.findByName("imgReplayBtn");

    this.duration = 1.25;
    this.titleS = 1;
    this.titleAng = 1.25;
    this.phase = 0;
    this.phaseSpd = 10;

    let sx,sy;
    if (Math.random() < 0.5)
    {
        sx = ScUtils.choose(-2048,2048);
        sy = pc.math.random(-1344,1344);
    }
    else
    {
        sx = pc.math.random(-2048,2048);
        sy = ScUtils.choose(-1344,1344);
    }
    this.spotlight.setLocalPosition(sx,sy,0);
    this.spotlightX = -sx*3;
    this.spotlightY = -sy*3;
    this.spotlightDone = false;


    this.board.setLocalScale(0,0,1);
    this.uiCharacters.element.width = 4096;
    this.homeBtn.setLocalPosition(512,0,0);
    this.replayBtn.setLocalPosition(-512,0,0);

    this.changingScene = false; // To guarantee multiple scene changes prevention

    //
    this.entries = [];

    let self = this;
    this.app.root.findByName("Root").fire("getLeaderboard", function (data) {

        self.clear();

        let board = self.board;
        let n = Math.min(data.length,5);
        let y = 0;
        for (let i = 0; i < n; i++)
        {
            self.addEntry(board, y, i+1, data[i].username.slice(0,12), data[i].score);
            y -= 110;
        }
    });

    //
    this.entity.on("button", function(action,button)
    {
        if (this.duration > 0 || action != 2 || this.changingScene)
            return;

        this.changingScene = true;
        
        let root = this.app.root.findByName("Root");
        if (button == "replay")
        {
            root.fire("postStart");
            root.fire("changeScene","Play");
        }
        else root.fire("changeScene","Home");

    },this);
};

// update code called every frame
ScLeaderboard.prototype.update = function(dt)
{
    // Spotlight Translation
    if (!this.spotlightDone)
    {
        let pos = this.spotlight.getLocalPosition();
        let x = pos.x;
        let y = pos.y;
        if (x != 0)
        {
            if (x > 0)
            {
                x += this.spotlightX * dt;
                if (x < 0)
                    x = 0;
            }
            else
            {
                x += this.spotlightX * dt;
                if (x > 0)
                    x = 0;
            }
        }
        if (y != 0)
        {
            if (y > 0)
            {
                y += this.spotlightY * dt;
                if (y < 0)
                    y = 0;
            }
            else
            {
                y += this.spotlightY * dt;
                if (y > 0)
                    y = 0;
            }
        }
        this.spotlight.setLocalPosition(x,y,0);

        if (x == 0 && y == 0)
            this.spotlightDone = true;
            
        return;
    }

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


    // Characters
    let w = this.uiCharacters.element.width;
    if (w > 0)
    {
        w *= 0.9;
        if (w < 1)
            w = 0;
        this.uiCharacters.element.width = w;
    }

    // Title Scale and Turn
    let y = this.title.getLocalPosition().y;
    y += this.titleS * 128 * dt;
    this.title.setLocalPosition(0,y,0);
    this.title.rotateLocal(0,0,this.titleAng*dt);
    this.titleS *= 0.98;
    if (y <= -16)
        this.titleS = 1;
    else if (y >= 16)
    {
        this.titleS = -1;
        let r = this.title.getLocalEulerAngles().z;
        let ang = Math.abs(r) + (Math.random()*2.5);
        if (r > 0)
            ang = -ang;
        this.titleAng = ang;
    }

    // Entries enlarge
    let n = this.entries.length;
    if (n > 0)
    {
        for (let i=0; i<n; i++)
        {
            let a = this.phase - (i*2) - 1;
            let b = pc.math.clamp(a,-1,3) * Math.PI/2;
            let s = 1.1 + Math.sin(b)/10;

            let entry = this.entries[i];
            entry.findByName("Position").setLocalScale(s,s,1);
            entry.findByName("Name").setLocalScale(s,s,1);
            entry.findByName("Coin").setLocalScale(s,s,1);
            entry.findByName("Score").setLocalScale(s,s,1);

            if (a > -1)
                entry.enabled = true; 
        }
        this.phase += this.phaseSpd * dt;
        if (this.phase >= 16)
        {
            this.phase -= 16;
            this.phaseSpd = 4;
        }
    }

    //
    if (this.duration > 0)
    {
        if (this.duration < 0.25)
        {
            // Button Translation
            shift = 3072*dt;
            pos = this.homeBtn.getLocalPosition();
            if (pos.x > 0)
            {
                pos.x -= shift;
                if (pos.x < 0)
                    pos.x = 0;
                this.homeBtn.setLocalPosition(pos);
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

        this.duration -= dt;
        if (this.duration <= 0)
        {
            this.homeBtn.fire("lock",false);
            this.replayBtn.fire("lock",false);
        }
    }
};

// clear all leaderboard entries
ScLeaderboard.prototype.clear = function ()
{
    for (var i = 0; i < this.entries.length; i++)
        this.entries[i].destroy();

    this.entries = [];
};

// add a new entry into the leaderboard
ScLeaderboard.prototype.addEntry = function (board, y, position, name, score)
{
    var entry = this.tmpEntry.clone();

    var rank = entry.findByName("Position").element;
    rank.text = position.toString() + '.';
    rank.fontSize = 104 - (position*8);

    entry.findByName("Name").element.text = name.toUpperCase();
    entry.findByName("Score").element.text = ScUtils.formatNumber(score);

    board.addChild(entry);
    entry.translateLocal(0, y, 0);

    this.entries.push(entry);
};
