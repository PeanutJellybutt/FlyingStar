var ScLogin = pc.createScript('scLogin');

// initialize code called once per entity
ScLogin.prototype.initialize = function()
{
    let group = this.entity.findByName("Group");
    this.group = group;
    this.patrick = group.findByName("imgPatrick");
    this.loginText = group.findByName("txtLogin");
    this.registText = group.findByName("txtRegister");
    this.userBox = group.findByName("boxUsername");
    this.passBox = group.findByName("boxPassword");
    this.pass2Box = group.findByName("boxPassword2");
    this.emailBox = group.findByName("boxEmail");
    this.forgotBtn = group.findByName("txtForgot");
    this.loginBtn = group.findByName("imgLoginBtn");
    this.registBtn = group.findByName("imgRegisterBtn");
    this.backBtn = group.findByName("imgBackBtn");
    this.skipBtn = group.findByName("imgSkipBtn");

    this.notifText = group.findByName("txtNotif");
    this.notifShrink = false;
    this.notifValidCol = new pc.Color(0,0.75,0.75);

    this.warning = this.entity.findByName("Warning");

    this.stars = [this.entity.findByName("imgStar0"),this.entity.findByName("imgStar1"),this.entity.findByName("imgStar2"),
                  this.entity.findByName("imgStar3"),this.entity.findByName("imgStar4"),this.entity.findByName("imgStar5"),
                  this.entity.findByName("imgStar6"),this.entity.findByName("imgStar7")];

    this.loginMode = true;
    this.duration = 1;

    this.patrick.setLocalPosition(0,-1024,0);
    this.loginText.setLocalPosition(0,256,0);
    this.registText.setLocalPosition(0,256,0);
    this.userBox.setLocalPosition(-1280,0,0);
    this.passBox.setLocalPosition(-1536,0,0);
    this.pass2Box.setLocalPosition(0,138,0);
    this.emailBox.setLocalPosition(0,300,0);
    this.forgotBtn.setLocalPosition(0,120,0);
    this.loginBtn.setLocalPosition(-1792,0,0);
    this.registBtn.setLocalPosition(0,-512,0);
    this.backBtn.setLocalPosition(-512,0,0);
    this.skipBtn.setLocalPosition(512,0,0);

    this.forgotBtn.enabled = false;
    this.pass2Box.enabled = false;
    this.emailBox.enabled = false;

    //
    this.focusColor = new pc.Color(247/255,1,215/255);
    this.boxFocusIndex = -1;
    this.keyPress = undefined;
    this.tickHighlight = 0;
    this.tickCarat = 0.25;

    //
    this.keyboardGroup = this.entity.findByName("Keyboard");
    this.keyboard = this.keyboardGroup.findByName("imgKeyboard");
    this.boxKeyboard = this.keyboardGroup.findByName("boxKeyboard");
    this.keySetCurr = -1;
    this.keysAlt = false;
    this.keysShift = 0;

    this.keyboardBox = this.keyboardGroup.findByName("boxKeyboard");
    this.carat = this.keyboardBox.findByName("Carat");
    this.boxArray = [this.userBox,this.passBox,this.pass2Box,this.emailBox,this.keyboardBox];
    this.boxStrings = ["","","",""];    //Separate strings and texts for easy hiding of password
    this.boxTexts = [this.userBox.findByName("Text"),this.passBox.findByName("Text"),this.pass2Box.findByName("Text"),this.emailBox.findByName("Text"),this.keyboardBox.findByName("Text")];
    this.boxHints = [this.userBox.findByName("Hint"),this.passBox.findByName("Hint"),this.pass2Box.findByName("Hint"),this.emailBox.findByName("Hint"),this.keyboardBox.findByName("Hint")];

    this.characters = this.keyboard.findByName("Characters");
    this.arrayKeys = [this.characters.findByName("Q"),this.characters.findByName("W"),this.characters.findByName("E"),this.characters.findByName("R"),this.characters.findByName("T"),this.characters.findByName("Y"),
                      this.characters.findByName("U"),this.characters.findByName("I"),this.characters.findByName("O"),this.characters.findByName("P"),this.characters.findByName("A"),this.characters.findByName("S"),
                      this.characters.findByName("D"),this.characters.findByName("F"),this.characters.findByName("G"),this.characters.findByName("H"),this.characters.findByName("J"),this.characters.findByName("K"),
                      this.characters.findByName("L"),this.characters.findByName("Z"),this.characters.findByName("X"),this.characters.findByName("C"),this.characters.findByName("V"),this.characters.findByName("B"),
                      this.characters.findByName("N"),this.characters.findByName("M"),this.characters.findByName("-"),this.characters.findByName("_"),this.characters.findByName("@"),this.characters.findByName(".")];
    this.arrayKeysSpec = [this.keyboard.findByName("Shift"),this.keyboard.findByName("Del"),this.keyboard.findByName("Dots"),this.keyboard.findByName("Up"),this.keyboard.findByName("Down"),this.keyboard.findByName("Enter")];

    //
    this.goPlay = false;
    this.delayPlay = 0;
    this.changingScene = false; // To guarantee multiple scene changes prevention

    //
    this.entity.on("button", this.buttonHandle, this);

    //
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
};

// update code called every frame
ScLogin.prototype.update = function(dt)
{
    //
    this.updateAnimations(dt);

    //
    if (this.tickHighlight > 0)
        this.tickHighlight -= dt;

    //
    this.keyboardUpdate(dt);

    //
    this.tickCarat -= dt;
    if (this.tickCarat <= 0)
    {
        this.tickCarat = 0.25;
        this.carat.element.opacity = ((this.carat.element.opacity == 0) ? 1 : 0);
    }

    //
    if (this.goPlay)
    {
        if (this.delayPlay <= 0)
        {
            this.goPlay = false;
            this.removeKeyboardListeners();

            let root = this.app.root.findByName("Root");
            if (!ScRoot.sharedData.tuts)
            {
                root.sound.stop();
                if (ScRoot.sharedData.bgmState == 1)
                    root.sound.play("Game");
                root.fire("postStart");
                root.fire("changeScene","Play");
            }
            else root.fire("changeScene","Instructions");
        }
        else this.delayPlay -= dt;
    }

};

//----------------------------------------------------------------------------------------

// When focus on input box
ScLogin.prototype.clickBox = function(index)
{
    if (this.boxFocusIndex != index)
    {
        this.focusBox(index);
        this.tickHighlight = 0.5;
        this.keyboardShow();
    }
    else if (this.tickHighlight > 0)
    {
        this.tickHighlight = 0;
        if (this.boxStrings[index].length > 0)
        {
            this.boxTexts[index].element.outlineThickness = 1;
            this.boxTexts[4].element.outlineThickness = 1;
        }
    }
    else
    {
        this.tickHighlight = 0.5;
        this.boxTexts[index].element.outlineThickness = 0;
        this.boxTexts[4].element.outlineThickness = 0;
    }
};

// When focus on input box
ScLogin.prototype.focusBox = function(index)
{
    this.unfocusBox();

    this.boxFocusIndex = index;
    this.boxArray[index].element.color = this.focusColor;

    this.boxTexts[4].element.text = this.boxTexts[index].element.text;
    this.boxHints[4].element.text = this.boxHints[index].element.text;
    this.boxTexts[4].element.outlineThickness = this.boxTexts[index].element.outlineThickness;

    this.carat.enabled = true;
    this.carat.setLocalPosition(this.boxTexts[index].element.textWidth,0,0);
    if (!this.keyboardGroup.enabled)
        this.carat.reparent(this.boxArray[index]);

    this.keyboardChange();
};

// Stop focus on focused box
ScLogin.prototype.unfocusBox = function()
{
    let index = this.boxFocusIndex;
    if (index != -1)
    {
        this.boxArray[index].element.color = pc.Color.WHITE;
        this.boxTexts[index].element.outlineThickness = 0;
        this.boxFocusIndex = -1;
    }

    this.carat.enabled = false;
};

// clear text box
ScLogin.prototype.navigateBox = function(index,up=false)
{
    if (up)
    {
        if (index > 0)
            this.focusBox(index-1);
    }
    else if (index == 0 || (!this.loginMode && index < 3))
        this.focusBox(index+1);
};

// clear text box
ScLogin.prototype.clearBox = function(index)
{
    this.boxStrings[index] = "";
    this.boxTexts[index].element.text = "";
    this.boxHints[index].enabled = true;
    this.boxTexts[index].element.outlineThickness = 0;
};

//----------------------------------------------------------------------------------------

// Hide keyboard
ScLogin.prototype.keyboardHide = function()
{
    if (this.keyboardGroup.enabled)
    {
        this.keyboardGroup.enabled = false;
        this.keyboardGroup.element.opacity = 0;
        this.keyboard.setLocalPosition(1024,-256,0);
        this.boxKeyboard.setLocalScale(0,0,1);

        let children = this.arrayKeys;
        for (let i=0; i<30; i++)
            children[i].fire("lock");

        children = this.arrayKeysSpec;
        for (let i=0; i<6; i++)
            children[i].fire("lock");

        this.carat.reparent(this.boxArray[this.boxFocusIndex]);
    }
};

// Show keyboard
ScLogin.prototype.keyboardShow = function()
{
    if (!this.keyboardGroup.enabled && this.app.touch)
    {
        this.keyboardGroup.enabled = true;

        this.keysAlt = false;
        this.keysShift = 0;
        this.keyboardChange();

        let children = this.arrayKeys;
        for (let i=0; i<30; i++)
            children[i].fire("lock",false);

        children = this.arrayKeysSpec;
        for (let i=0; i<6; i++)
            children[i].fire("lock",false);

        this.carat.reparent(this.boxArray[4]);
    }
};

// Update keyboard
ScLogin.prototype.keyboardUpdate = function(dt)
{
    if (!this.keyboardGroup.enabled)
        return;

    let opacity = this.keyboardGroup.element.opacity;
    if (opacity < 0.9)
    {
        opacity += dt*4;
        if (opacity > 0.9)
            opacity = 0.9;
        this.keyboardGroup.element.opacity = opacity;
    }

    let pos = this.keyboard.getLocalPosition();
    if (pos.y < 230)
    {
        pos.y += 2048*dt;
        if (pos.y > 230)
            pos.y = 230;
        this.keyboard.setLocalPosition(pos);
    }

    let s = this.boxKeyboard.getLocalScale().x;
    if (s < 1)
    {
        s += dt*4;
        if (s > 1)
            s = 1;
        this.boxKeyboard.setLocalScale(s,s,1);
    }
};

// Keyboard change sets
ScLogin.prototype.keyboardChange = function()
{
    let index = this.boxFocusIndex;
    let setIndex = 0;
    if (!this.keysAlt)
    {
        if (this.keysShift != 0)
            setIndex = 1;
    }
    else if (index == 0 || index == 3)
        setIndex = 4;
    else
    {
        if (this.keysShift != 0)
            setIndex = 3;
        else setIndex = 2;
    }

    if (setIndex != this.keySetCurr)
    {
        this.keySetCurr = setIndex;

        let keys = this.arrayKeys;
        for (let i=0; i<30; i++)
            keys[i].findByName("Text").element.text = ScKeys.keySets[setIndex][i];
    }
};

//----------------------------------------------------------------------------------------

// On key press down
ScLogin.prototype.onKeyDown = function(e)
{
    let key =  e.key;
    if (this.keyPress == key && key != pc.KEY_BACKSPACE)
        return;

    this.keyPress = key;

    this.actionKey(key,e.event.key);

    e.event.preventDefault();
};

// On key press down
ScLogin.prototype.onKeyUp = function(e)
{
    if (e.key === this.keyPress)
        this.keyPress = undefined;
};

// key action
ScLogin.prototype.actionKey = function(key,char='',overrideKey=false)
{
    if (key === pc.KEY_ENTER)
    {
        this.unfocusBox();
        this.keyboardHide();
        this.notifText.enabled = false;

        let self = this;
        let root = this.app.root.findByName("Root");
        if (this.loginMode)
        {
            if (this.boxStrings[0].length == 0 || this.boxStrings[1].length == 0)
            {
                this.loginNotif("PLEASE FILL ALL FIELDS");
                if (this.boxStrings[0].length == 0)
                    this.boxArray[0].translateLocal(32,0,0);
                if (this.boxStrings[1].length == 0)
                    this.boxArray[1].translateLocal(48,0,0);
            }
            else if (this.boxStrings[1].length < 8)
                this.loginNotif("INVALID LOGIN",1);
            else root.fire("postLogin",this.boxStrings[0],this.boxStrings[1], function(valid) {
                if (valid)
                    self.loginNotif("LOGIN SUCCESSFUL",-1);
                else self.loginNotif("INVALID LOGIN",1);
            });
        }
        else
        {
            if (this.boxStrings[0].length == 0 || this.boxStrings[1].length == 0 || this.boxStrings[2].length == 0 || this.boxStrings[3].length == 0)
            {
                this.loginNotif("PLEASE FILL ALL FIELDS");
                if (this.boxStrings[0].length == 0)
                    this.boxArray[0].translateLocal(32,0,0);
                if (this.boxStrings[1].length == 0)
                    this.boxArray[1].translateLocal(40,0,0);
                if (this.boxStrings[2].length == 0)
                    this.boxArray[2].translateLocal(48,0,0);
                if (this.boxStrings[3].length == 0)
                    this.boxArray[3].translateLocal(56,0,0);
            }
            else if (this.boxStrings[1].length < 8)
            {
                this.loginNotif("PASSWORD IS TOO SHORT");
                this.boxArray[1].translateLocal(32,0,0);
            }
            else if (this.boxStrings[1] != this.boxStrings[2])
            {
                this.loginNotif("PASSWORDS DON'T MATCH");
                this.boxArray[1].translateLocal(32,0,0);
                this.boxArray[2].translateLocal(56,0,0);
            }
            else root.fire("postRegister",this.boxStrings[0],this.boxStrings[3],this.boxStrings[1], function(valid) {
                if (valid)
                {
                    self.loginNotif("REGISTRATION SUCCESSFUL",-2);
                    self.toLogin(false);
                }
                else self.loginNotif("INVALID REGISTER",2);
            });
        }

        return;
    }

    //
    let index = this.boxFocusIndex;
    if (index == -1)
        return;

    let highlighted = this.boxTexts[index].element.outlineThickness;
    if (key === pc.KEY_BACKSPACE)
    {
        let n = this.boxStrings[index].length;
        if (n > 0)
        {
            if (highlighted == 1 || n == 1)
            {
                this.clearBox(index);
                this.clearBox(4);
            }
            else
            {
                this.boxStrings[index] = this.boxStrings[index].substr(0,n-1);
                if (index == 1 || index == 2)
                    this.boxTexts[index].element.text = "•".repeat(this.boxStrings[index].length);
                else this.boxTexts[index].element.text = this.boxStrings[index];

                this.boxTexts[4].element.text = this.boxTexts[index].element.text;
            }

            this.carat.setLocalPosition(this.boxTexts[index].element.textWidth,0,0);
        }
    }
    else if (key === pc.KEY_TAB)
        this.navigateBox(index,this.app.keyboard.isPressed(pc.KEY_SHIFT));
    else if (key == 65 && this.app.keyboard.isPressed(pc.KEY_CONTROL))
    {
        if (this.boxStrings[index].length > 0)
        {
            this.boxTexts[index].element.outlineThickness = ((highlighted == 0) ? 1 : 0);
            this.boxTexts[4].element.outlineThickness = this.boxTexts[index].element.outlineThickness;
        }
    }
    else if (overrideKey || (key >= 48 && key <= 57) || (key >= 65 && key <= 90) || (key >= 96 && key <= 105) ||
             (key >= 186 && key <= 192) || (key >= 219 && key <= 222))
    {
        if (char == '')
            return;

        if (index == 1 || index == 2 || 
            (index == 0 && char.search(/^[0-9a-zA-Z_-]+$/) != -1) || (index == 3 && char.search(/^[0-9a-zA-Z.@_-]+$/) != -1) )
        {
            if (highlighted == 1)
                this.clearBox(index);

            this.boxStrings[index] += char;
            this.boxHints[index].enabled = false;
            if (index == 1 || index == 2)
                this.boxTexts[index].element.text += "•";
            else this.boxTexts[index].element.text += char;

            this.boxTexts[4].element.text = this.boxTexts[index].element.text;

            this.carat.setLocalPosition(this.boxTexts[index].element.textWidth,0,0);
        }
    }
};

// remove Keyboard Listeners
ScLogin.prototype.removeKeyboardListeners = function()
{
    this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.off(pc.EVENT_KEYUP, this.onKeyUp, this);
};

// handle button events
ScLogin.prototype.buttonHandle = function(action,button)
{
    if (this.duration > 0 || action < 2 || this.changingScene)
        return;

    //
    if (action == 3)
    {
        if (button == 30)
        {
            this.keysShift = ((this.keysShift == 0) ? 1 : 0);
            this.keyboardChange();
        }
        else if (button == 31)
        {
            this.keysShift = 2;
            this.keyboardChange();
        }
        else if (button == 33)
        {
            this.keysAlt = !this.keysAlt;
            this.arrayKeysSpec[0].fire("shiftOff");
            this.keysShift = 0;
            this.keyboardChange();
        }
        else if (button == 32)
            this.actionKey(pc.KEY_BACKSPACE);
        else if (button == 34)
            this.navigateBox(this.boxFocusIndex,true);
        else if (button == 35)
            this.navigateBox(this.boxFocusIndex,false);
        else if (button == 36)
            this.actionKey(pc.KEY_ENTER);
        else
        {
            this.actionKey(-1,ScKeys.keySets[this.keySetCurr][button],true);  // characters
            if (this.keysShift == 1)
            {
                this.arrayKeysSpec[0].fire("shiftOff");
                this.keysShift = 0;
                this.keyboardChange();
            }
        }

        return;
    }

    //
    let root = this.app.root.findByName("Root");

    if (button == "unfocus")
    {
        this.unfocusBox();
        this.keyboardHide();
    }
    else if (button == "user")
        this.clickBox(0);
    else if (button == "pass")
        this.clickBox(1);
    else if (button == "pass2")
        this.clickBox(2);
    else if (button == "email")
        this.clickBox(3);
    else if (button == "keyboard")
        this.clickBox(this.boxFocusIndex);
    else if (button == "login")
        this.actionKey(pc.KEY_ENTER);
    else if (button == "skip")
    {
        gtag('event', 'login_skip');
        
        this.unfocusBox();
        this.group.enabled = false;
        this.warning.enabled = true;
    }
    else if (!this.group.enabled)
    {
        if (button == "close")
        {
            this.group.enabled = true;
            this.warning.enabled = false;
        }
        else if (button == "ok")
        {
            gtag('event', 'skip_confirm');

            this.changingScene = true;
            this.removeKeyboardListeners();
            root.fire("changeScene","Instructions");
        }
    }
    else
    {
        this.unfocusBox();

        if (button == "register")
        {
            this.loginMode = false;
            this.loginBtn.findByName("Text").element.text = this.app.i18n.getText("CONFIRM");
            this.notifText.enabled = false;

            gtag('event', 'to_register', {
                'state': true,
            });
        }
        else if (button == "back")
            this.toLogin();

        this.loginBtn.fire("lock");
        this.registBtn.fire("lock");
        this.backBtn.fire("lock");
    }
};

// back from registering to logging in
ScLogin.prototype.toLogin = function(notifClear=true)
{
    this.loginMode = true;
    this.loginBtn.findByName("Text").element.text = this.app.i18n.getText("LOGIN");

    if (notifClear)
        this.notifText.enabled = false;

    this.clearBox(2);
    this.clearBox(3);
    this.clearBox(4);

    gtag('event', 'to_register', {
        'state': false,
    });
};

//----------------------------------------------------------------------------------------

// update element animations
ScLogin.prototype.updateAnimations = function(dt)
{
    //
    if (this.notifText.enabled)
    {
        let s = this.notifText.getLocalScale().x;
        if (!this.notifShrink && s < 1.25)
        {
            s += 10*dt;
            this.notifText.setLocalScale(s,s,1);
            if (s >= 1.25)
                this.notifShrink = true;
        }
        else if (s > 1)
        {
            s *= 0.95;
            if (s < 1.001)
                s = 1;
            this.notifText.setLocalScale(s,s,1);
        }
    }

    //
    if (this.duration > 0)
    {
        // Stars
        let time = this.duration;
        let time2 = time * 2;
        for (let i=0; i<8; i++)
        {
            this.stars[i].enabled = (time <= (1-(i*0.1)));
            this.stars[i].element.opacity = Math.min(2.5 - (i*0.2) - time2,1);
        }

        this.duration -= dt*1.5;
    }

    //
    let shift = 4096 * dt;
    let shakeShift = 256 * dt;
    if (this.loginMode)
    {
        // Patrick
        let pos = this.patrick.getLocalPosition();
        if (pos.y < -160)
        {
            pos.y += shift;
            if (pos.y > -160)
                pos.y = 0;
            this.patrick.setLocalPosition(pos);
        }

        // Register
        pos = this.registText.getLocalPosition();
        if (pos.y < 256)
        {
            pos.y += shift;
            this.registText.setLocalPosition(pos);
        }
        else
        {
            // Login
            pos = this.loginText.getLocalPosition();
            if (pos.y > 0)
            {
                pos.y -= shift;
                if (pos.y < 0)
                    pos.y = 0;
                this.loginText.setLocalPosition(pos);
            }
        }

        // Boxes
        pos = this.userBox.getLocalPosition();
        if (pos.x < 0)
        {
            pos.x += shift;
            if (pos.x > 0)
                pos.x = 0;
            this.userBox.setLocalPosition(pos);
        }
        else if (pos.x > 0)
        {
            pos.x -= shakeShift;
            if (pos.x < 0)
                pos.x = 0;
            this.userBox.setLocalPosition(pos);
        }

        pos = this.passBox.getLocalPosition();
        if (pos.x < 0)
        {
            pos.x += shift;
            if (pos.x >= 0)
            {
                pos.x = 0;
                //this.forgotBtn.enabled = true;
            }
            this.passBox.setLocalPosition(pos);
        }
        else if (pos.x > 0)
        {
            pos.x -= shakeShift;
            if (pos.x < 0)
                pos.x = 0;
            this.passBox.setLocalPosition(pos);
        }
        else
        {
            pos = this.pass2Box.getLocalPosition();
            if (pos.y < 138)
            {
                pos.y += shift;
                if (pos.y >= 138)
                {
                    pos.y = 138;
                    this.pass2Box.enabled = false;
                }
                this.pass2Box.setLocalPosition(pos);
            }
            if (pos.x > 0)
            {
                pos.x -= shakeShift;
                if (pos.x < 0)
                    pos.x = 0;
                this.pass2Box.setLocalPosition(pos);
            }

            pos = this.emailBox.getLocalPosition();
            if (pos.x > 0)
            {
                pos.x -= shakeShift;
                if (pos.x < 0)
                    pos.x = 0;
                this.emailBox.setLocalPosition(pos);
            }
            if (pos.y < 300)
            {
                pos.y += shift;
                if (pos.y >= 300)
                {
                    pos.y = 300;
                    this.emailBox.enabled = false;
                    //this.forgotBtn.enabled = true;
                }
                this.emailBox.setLocalPosition(pos);
            }
            else
            {
                // Forgot Password
                pos = this.forgotBtn.getLocalPosition();
                if (pos.y > 0)
                {
                    pos.y -= shift/2;
                    if (pos.y < 0)
                        pos.y = 0;
                    this.forgotBtn.setLocalPosition(pos);
                }
            }
        }

        // Login Button
        pos = this.loginBtn.getLocalPosition();
        if (pos.x < 0)
        {
            pos.x += shift;
            if (pos.x > 0)
                pos.x = 0;
        }
        else if (pos.y < 0)
        {
            pos.y += shift;
            if (pos.y >= 0)
            {
                pos.y = 0;
                this.loginBtn.fire("lock",false);
            }
        }
        this.loginBtn.setLocalPosition(pos);

        // Back Button
        pos = this.backBtn.getLocalPosition();
        if (pos.x > -512)
        {
            pos.x -= shift;
            this.backBtn.setLocalPosition(pos);
        }
        else
        {
            // Register Button
            pos = this.registBtn.getLocalPosition();
            if (pos.y < 0)
            {
                pos.y += shift;
                if (pos.y >= 0)
                {
                    pos.y = 0;
                    this.registBtn.fire("lock",false);
                }
                this.registBtn.setLocalPosition(pos);
            }
        }

        // Skip Button
        pos = this.skipBtn.getLocalPosition();
        if (pos.x > 0)
        {
            pos.x -= shift;
            if (pos.x <= 0)
            {
                pos.x = 0;
                this.skipBtn.fire("lock",false);
            }
            this.skipBtn.setLocalPosition(pos);
        }
    }
    else
    {
        // Login
        let pos = this.loginText.getLocalPosition();
        if (pos.y < 256)
        {
            pos.y += shift;
            this.loginText.setLocalPosition(pos);
        }
        else
        {
            // Register
            pos = this.registText.getLocalPosition();
            if (pos.y > 0)
            {
                pos.y -= shift;
                if (pos.y < 0)
                    pos.y = 0;
                this.registText.setLocalPosition(pos);
            }
        }

        // Forgot Password
        pos = this.forgotBtn.getLocalPosition();
        if (pos.y < 120)
        {
            pos.y += shift/2;
            if (pos.y >= 120)
            {
                pos.y = 120;
                //this.forgotBtn.enabled = false;
                this.pass2Box.enabled = true;
                this.emailBox.enabled = true;
            }
            this.forgotBtn.setLocalPosition(pos);
        }
        else
        {
            // Boxes
            pos = this.userBox.getLocalPosition();
            if (pos.x > 0)
            {
                pos.x -= shakeShift;
                if (pos.x < 0)
                    pos.x = 0;
                this.userBox.setLocalPosition(pos);
            }

            pos = this.passBox.getLocalPosition();
            if (pos.x > 0)
            {
                pos.x -= shakeShift;
                if (pos.x < 0)
                    pos.x = 0;
                this.passBox.setLocalPosition(pos);
            }

            pos = this.pass2Box.getLocalPosition();
            if (pos.y > 0)
            {
                pos.y -= shift;
                if (pos.y < 0)
                    pos.y = 0;
                this.pass2Box.setLocalPosition(pos);
            }
            if (pos.x > 0)
            {
                pos.x -= shakeShift;
                if (pos.x < 0)
                    pos.x = 0;
                this.pass2Box.setLocalPosition(pos);
            }

            pos = this.emailBox.getLocalPosition();
            if (pos.y > 0)
            {
                pos.y -= shift;
                if (pos.y < 0)
                    pos.y = 0;
                this.emailBox.setLocalPosition(pos);
            }
            if (pos.x > 0)
            {
                pos.x -= shakeShift;
                if (pos.x < 0)
                    pos.x = 0;
                this.emailBox.setLocalPosition(pos);
            }
        }

        // Login Button
        pos = this.loginBtn.getLocalPosition();
        if (pos.y > -256)
        {
            pos.y -= shift;
            if (pos.y <= -256)
            {
                pos.y = -256;
                this.loginBtn.fire("lock",false);
            }
            this.loginBtn.setLocalPosition(pos);
        }

        // Register Button
        pos = this.registBtn.getLocalPosition();
        if (pos.y > -512)
        {
            pos.y -= shift;
            this.registBtn.setLocalPosition(pos);
        }
        else
        {
            // Back Button
            pos = this.backBtn.getLocalPosition();
            if (pos.x < 0)
            {
                pos.x += shift;
                if (pos.x >= 0)
                {
                    pos.x = 0;
                    this.backBtn.fire("lock",false);
                }
                this.backBtn.setLocalPosition(pos);
            }
        }
    }
};

//
ScLogin.prototype.loginNotif = function(text,shake=0)
{
    this.notifText.element.text = this.app.i18n.getText(text);
    this.notifText.setLocalScale(0,0,1);
    this.notifText.enabled = true;
    this.notifShrink = false;

    this.notifText.element.color = pc.Color.RED;

    if (shake < 0)
    {
        this.notifText.element.color = this.notifValidCol;

        if (shake == -1)
        {
            gtag('event', 'login');

            this.goPlay = true;
            this.delayPlay = 1;
            this.changingScene = true;
        }
        else gtag('event', 'sign_up');
    }
    else if (shake == 1)
    {
        this.boxArray[0].translateLocal(32,0,0);
        this.boxArray[1].translateLocal(56,0,0);
    }
    else if (shake == 2)
    {
        this.boxArray[0].translateLocal(32,0,0);
        this.boxArray[3].translateLocal(56,0,0);
    }
};