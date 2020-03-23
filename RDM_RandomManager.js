//=============================================================================
// RDM_RandomManager.js
//=============================================================================
//-----------------------------------------------------------------------------
// SMGame_Random
//
// The superclass of SMGame_Medicine and SMGame_Sperm
function SMGame_GeneratorRandom() {
    this.initialize.apply(this, arguments);
}
SMGame_GeneratorRandom.prototype.initialize = function(makerId) {
	this.w = Math.randomInt(899999999)+100000000;
	this.x = Math.randomInt(899999999)+100000000;
	this.y = Math.randomInt(899999999)+100000000;
    this.z = Math.randomInt(899999999)+100000000;
    this._makerId = makerId;
};
SMGame_GeneratorRandom.prototype.nextRandom = function() {
	let t;
    t = this.x ^ (this.x << 11);
    this.x = this.y; this.y = this.z; this.z = this.w;
    return this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8)); 
};
SMGame_GeneratorRandom.prototype.nextRandomInt = function(min, max) {
    const r = Math.abs(this.nextRandom());
    return min + (r % (max + 1 - min));
};