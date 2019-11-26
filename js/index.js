twemoji.parse(document.querySelector('#guide table'));
let maxWaitIntervals = 16

let twitterTimelineLoadListener = setInterval(() => {
  if(!maxWaitIntervals){
    console.error('Waiting for twitter timeline timed out.')
  }

  let timelineFrame = document.getElementById('twitter-widget-0')

  if(timelineFrame || !maxWaitIntervals){
    clearInterval(twitterTimelineLoadListener)

    console.log(timelineFrame)
  }

  maxWaitIntervals--
}, 200)
