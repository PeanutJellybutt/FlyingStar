var ScSettings = pc.createScript('scSettings');

// initialize code called once per entity
ScSettings.prototype.initialize = function()
{
    this.spotlight = this.entity.findByName("imgShade");
    this.board = this.entity.findByName("imgBoardBox");
    this.title = this.board.findByName("txtSettings");
    this.homeBtn = this.entity.findByName("imgHomeBtn");
    this.backBtn = this.entity.findByName("imgBackBtn");
    this.boardPop = this.entity.findByName("imgBoardPop");
    this.popText = this.boardPop.findByName("txtBoardPop");

    this.langText = this.board.findByName("txtLanguage");
    this.sfxText = this.board.findByName("txtSFX");
    this.bgmText = this.board.findByName("txtBGM");

    this.privacy = this.board.findByName("txtPrivacy");
    this.support = this.board.findByName("txtSupport");
    this.terms = this.board.findByName("txtTerms");
    this.textAsset = null;

    this.langBar = this.board.findByName("imgLangBar");
    this.langFill = this.langBar.findByName("imgBarFill");
    this.langLabel = [this.langBar.findByName("imgLabelENG").element,
                      this.langBar.findByName("imgLabelCHN").element,
                      this.langBar.findByName("imgLabelTRD").element,
                      this.langBar.findByName("imgLabelJPN").element];

    this.darkCol = new pc.Color(104/255,17/255,43/255);
    this.sfxBtn = this.board.findByName("imgSFXToggle");
    this.bgmBtn = this.board.findByName("imgBGMToggle");

    this.uiJellyfishes = this.entity.findByName("uiJellyfishes");

    //
    this.langBarSet(ScRoot.sharedData.currLang);
    this.toggleSet(this.sfxBtn,ScRoot.sharedData.sfxState);
    this.toggleSet(this.bgmBtn,ScRoot.sharedData.bgmState);

    //
    this.duration = 0.5;
    this.titleS = 1;
    this.titleAng = 1.25;
    this.langPop = 0;
    this.sfxPop = 0;
    this.bgmPop = 0;

    this.langText.setLocalPosition(-1024,0,0);
    this.sfxText.setLocalPosition(-2048,0,0);
    this.bgmText.setLocalPosition(-3072,0,0);
    this.langBar.setLocalPosition(1024,0,0);
    this.sfxBtn.setLocalPosition(2048,0,0);
    this.bgmBtn.setLocalPosition(3072,0,0);
    this.terms.setLocalPosition(0,-512,0);
    this.privacy.setLocalPosition(0,-768,0);
    this.support.setLocalPosition(0,-1024,0);

    this.langText.enabled = false;
    this.sfxText.enabled = false;
    this.bgmText.enabled = false;
    this.langBar.enabled = false;
    this.sfxBtn.enabled = false;
    this.bgmBtn.enabled = false;
    this.terms.enabled = false;
    this.privacy.enabled = false;
    this.support.enabled = false;

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
    this.homeBtn.setLocalPosition(512,0,0);
    this.uiJellyfishes.element.width = 8192;

    //
    this.changingScene = false; // To guarantee multiple scene changes prevention

    //
    this.entity.on("button", function(action,button)
    {
        if (this.duration > 0 || action != 2 || this.changingScene)
            return;
        
        if (button == "home")
        {
            this.changingScene = true;
            this.app.root.findByName("Root").fire("changeScene","Home");
        }
        else if (button == "sfx")
        {
            this.toggle(this.sfxBtn,"toggleSFX","sfx_toggle");
            this.sfxPop = 0.05;
        }
        else if (button == "bgm")
        {
            this.toggle(this.bgmBtn,"toggleBGM","bgm_toggle");
            this.bgmPop = 0.05;
        }
        else if (button == "eng")
            this.langSelect(0,"en");
        else if (button == "chn")
            this.langSelect(1,"zh-sc");
        else if (button == "trd")
            this.langSelect(2,"zh-tc");
        else if (button == "jpn")
            this.langSelect(3,"ja");
        else if (button == "back")
        {
            this.boardPop.enabled = false;
            this.board.enabled = true;
            this.homeBtn.enabled = true;
            this.backBtn.enabled = false;

            this.popText.element.text = "";
            this.textAsset.unload();
        }
        else
        {
            this.boardPop.enabled = true;
            this.board.enabled = false;
            this.homeBtn.enabled = false;
            this.backBtn.enabled = true;

            let textName = "";
            if (button == "terms")
                textName = "terms";
            else if (button == "privacy")
                textName = "privacy";
            else if (button == "support")
                textName = "support";

            let self = this;
            this.textAsset = this.app.assets.find(textName + ".txt","text");
            this.textAsset.ready(function (asset) {
                self.popText.fire("activate",asset);
            });
            this.app.assets.load(this.textAsset);
        }
    },this);

};

// update code called every frame
ScSettings.prototype.update = function(dt)
{
    //
    if (this.boardPop.enabled)
    {
        // Jellyfishes
        let w = this.uiJellyfishes.element.width;
        if (w > -4096)
        {
            w -= 4096*dt;
            this.uiJellyfishes.element.width = w;
        }

        return;
    }

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
    }

    // Board Enlarge
    let s = this.board.getLocalScale().x;
    if (s < 1)
    {
        s += 3 * dt;
        if (s >= 1)
        {
            s = 1;
            this.langText.enabled = true;
            this.sfxText.enabled = true;
            this.bgmText.enabled = true;
            this.langBar.enabled = true;
            this.sfxBtn.enabled = true;
            this.bgmBtn.enabled = true;
            this.privacy.enabled = true;
            this.support.enabled = true;
            this.terms.enabled = true;
        }

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

    // Pops
    //
    s = this.langText.getLocalScale().x;
    if (this.langPop > 0)
    {
        s += dt;
        this.langPop -= dt;
        this.langText.setLocalScale(s,s,1);
    }
    else if (s > 1)
    {
        s -= dt;
        if (s < 1)
            s = 1;
        this.langText.setLocalScale(s,s,1);
    }
    //
    s = this.sfxText.getLocalScale().x;
    if (this.sfxPop > 0)
    {
        s += dt;
        this.sfxPop -= dt;
        this.sfxText.setLocalScale(s,s,1);
    }
    else if (s > 1)
    {
        s -= dt;
        if (s < 1)
            s = 1;
        this.sfxText.setLocalScale(s,s,1);
    }
    //
    s = this.bgmText.getLocalScale().x;
    if (this.bgmPop > 0)
    {
        s += dt;
        this.bgmPop -= dt;
        this.bgmText.setLocalScale(s,s,1);
    }
    else if (s > 1)
    {
        s -= dt;
        if (s < 1)
            s = 1;
        this.bgmText.setLocalScale(s,s,1);
    }

    // Jellyfishes
    let w = this.uiJellyfishes.element.width;
    if (w != 0)
    {
        w *= 0.9;
        if (w > -1 && w < 1)
            w = 0;
        this.uiJellyfishes.element.width = w;
    }

    //
    if (this.duration <= 0)
        return;

    // Translation
    let shift = 8192*dt;
    let pos = this.langText.getLocalPosition();
    if (pos.x < 0)
    {
        pos.x += shift;
        if (pos.x > 0)
            pos.x = 0;
        this.langText.setLocalPosition(pos);
    }
    pos = this.sfxText.getLocalPosition();
    if (pos.x < 0)
    {
        pos.x += shift;
        if (pos.x > 0)
            pos.x = 0;
        this.sfxText.setLocalPosition(pos);
    }
    pos = this.bgmText.getLocalPosition();
    if (pos.x < 0)
    {
        pos.x += shift;
        if (pos.x > 0)
            pos.x = 0;
        this.bgmText.setLocalPosition(pos);
    }
    pos = this.langBar.getLocalPosition();
    if (pos.x > 0)
    {
        pos.x -= shift;
        if (pos.x < 0)
            pos.x = 0;
        this.langBar.setLocalPosition(pos);
    }
    pos = this.sfxBtn.getLocalPosition();
    if (pos.x > 0)
    {
        pos.x -= shift;
        if (pos.x < 0)
            pos.x = 0;
        this.sfxBtn.setLocalPosition(pos);
    }
    pos = this.bgmBtn.getLocalPosition();
    if (pos.x > 0)
    {
        pos.x -= shift;
        if (pos.x < 0)
            pos.x = 0;
        this.bgmBtn.setLocalPosition(pos);
    }

    //
    shift = 2048*dt;
    pos = this.privacy.getLocalPosition();
    if (pos.y < 0)
    {
        pos.y += shift;
        if (pos.y > 0)
            pos.y = 0;
        this.privacy.setLocalPosition(pos);
    }
    pos = this.support.getLocalPosition();
    if (pos.y < 0)
    {
        pos.y += shift;
        if (pos.y > 0)
            pos.y = 0;
        this.support.setLocalPosition(pos);
    }
    pos = this.terms.getLocalPosition();
    if (pos.y < 0)
    {
        pos.y += shift;
        if (pos.y > 0)
            pos.y = 0;
        this.terms.setLocalPosition(pos);
    }
    

    //
    if (this.duration < 0.25)
    {
        // Button Translation
        shift = 4096*dt;
        pos = this.homeBtn.getLocalPosition();
        if (pos.x > 0)
        {
            pos.x -= shift;
            if (pos.x < 0)
                pos.x = 0;
            this.homeBtn.setLocalPosition(pos);
        }
    }

    this.duration -= dt;
    if (this.duration <= 0)
        this.homeBtn.fire("lock",false);
};

// Language Bar Set
ScSettings.prototype.langBarSet = function(index)
{
    this.langLabel[0].spriteFrame = 0;
    this.langLabel[1].spriteFrame = 1;
    this.langLabel[2].spriteFrame = 2;
    this.langLabel[3].spriteFrame = 3;
    this.langLabel[index].spriteFrame += 4;
    
    let x;
    switch (index)
    {
        case 1: x = 192; break;
        case 2: x = 320; break;
        case 3: x = 428; break;
        default: x = 0;
    }
    this.langFill.setLocalPosition(x,0,0);
    this.langFill.element.spriteFrame = index;
};

// Language Select
ScSettings.prototype.langSelect = function(index,code)
{
    this.langBarSet(index);
    this.langPop = 0.05;

    this.app.root.findByName("Root").fire("selectLocal",index,code);

    if (this.langFill.element.spriteFrame != index)
    {
        gtag('event', 'lang_select', {
            'language': code,
        });
    }
};

// Toggles Set
ScSettings.prototype.toggleSet = function(entity,state)
{
    let off = entity.findByName("txtOFF");
    let on = entity.findByName("txtON");

    entity.element.spriteFrame = state;
    if (state == 0)
    {
        off.element.color = pc.Color.WHITE;
        on.element.color = this.darkCol;
        off.setLocalScale(1.1,1.1,1);
        on.setLocalScale(0.8,0.8,1);
    }
    else
    {
        on.element.color = pc.Color.WHITE;
        off.element.color = this.darkCol;
        on.setLocalScale(1.1,1.1,1);
        off.setLocalScale(0.8,0.8,1);
    }
};

// Toggles
ScSettings.prototype.toggle = function(entity,eventName,gtagName)
{
    let state = entity.element.spriteFrame == 0 ? 1 : 0;
    this.toggleSet(entity,state);

    this.app.root.findByName("Root").fire(eventName,state);

    gtag('event', gtagName, {
        'state': state,
    });
};