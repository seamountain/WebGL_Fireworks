window.onload = init;
var context;
var bufferLoader;

function init() {
  context = new webkitAudioContext();
  // The firework2.mp3 is from http://taira-komori.jpn.org/event01.html
  bufferLoader = new BufferLoader(context,['./firework2.mp3'],function(){console.log("finish load.");});
  bufferLoader.load();
}

var fireSound;
function startSound() {
    var startTime = context.currentTime + 0.05;
    var endTime = startTime + 5.0;
    fireSound = playSound(bufferLoader.bufferList[0], startTime, endTime);
}

function playSound(buffer,startTime, endTime) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(context.destination);
    source.noteOn(startTime);
    source.noteOff(endTime);
    return source;
}

window.onclick = startSound;
