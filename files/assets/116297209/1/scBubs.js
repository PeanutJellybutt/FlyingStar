var ScBubs = pc.createScript('scBubs');

// initialize code called once per entity
ScBubs.prototype.initialize = function() {
    this.spd = Math.abs(this.entity.getLocalScale().x) * 3;
};

// update code called every frame
ScBubs.prototype.update = function(dt) {
    this.entity.translateLocal(0,this.spd*dt,0);
};