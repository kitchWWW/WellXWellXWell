fetch("https://gist.githubusercontent.com/guest271314/f48ee0658bc9b948766c67126ba9104c/raw/958dd72d317a6087df6b7297d4fee91173e0844d/mespeak.js")
  .then(response => response.text())
  .then(text => {
    const script = document.createElement("script");
    script.textContent = text;
    document.body.appendChild(script);

    return Promise.all([
      new Promise(resolve => {
        meSpeak.loadConfig("https://gist.githubusercontent.com/guest271314/8421b50dfa0e5e7e5012da132567776a/raw/501fece4fd1fbb4e73f3f0dc133b64be86dae068/mespeak_config.json", resolve)
      }),
      new Promise(resolve => {
        meSpeak.loadVoice("https://gist.githubusercontent.com/guest271314/fa0650d0e0159ac96b21beaf60766bcc/raw/82414d646a7a7ef11bb04ddffe4091f78ef121d3/en.json", resolve)
      })
    ])
  })
  .then(() => {
    // takes approximately 14 seconds to get here
    console.log(meSpeak.isConfigLoaded());
    console.log(meSpeak.speak("what it do my ninja", {
      amplitude: 100,
      pitch: 5,
      speed: 150,
      wordgap: 1,
      variant: "m7",
      rawdata: "mime"
    }));
})
.catch(err => console.log(err));