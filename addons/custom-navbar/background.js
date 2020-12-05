export default async function ({ addon, global, console }) {
  // Get the text and urls for the buttons
  const ideasName = addon.settings.get("ideasTxt");
  const ideasUrl = addon.settings.get("ideasUrl");
  const aboutName = addon.settings.get("aboutTxt");
  const aboutUrl = addon.settings.get("aboutUrl");
  
  if (!aboutUrl.includes("javascript:" || !ideasUrl.includes("javascript:"))) {
    if (addon.tab.clientVersion == "scratch-www") { // 3.0 styled page
    
    // assign button elements to variables
    var ideasBtn = document.getElementsByClassName("ideas")[0];
    var aboutBtn = document.getElementsByClassName("about")[0];
    
    // change data on ideas button
    ideasBtn.childNodes[0].href = ideasUrl;
    ideasBtn.childNodes[0].childNodes[0].innerText = ideasName;
    
    // change data on about button
    aboutBtn.childNodes[0].href = aboutUrl;
    aboutBtn.childNodes[0].childNodes[0].innerText = aboutName;
    
  } else if (addon.tab.clientVersion == "scratchr2") { // 2.0 styled page
    
    var ideasBtn = document.getElementsByClassName("site-nav")[0].childNodes[3];
    var aboutBtn = document.getElementsByClassName("site-nav")[0].childNodes[4];
    
    // change data on ideas button
    ideasBtn.childNodes[0].href = ideasUrl;
    ideasBtn.childNodes[0].innerText = ideasName;
    
    // change data on about button
    aboutBtn.childNodes[0].href = aboutUrl;
    aboutBtn.childNodes[0].innerText = aboutName;
  } else {
    console.log("You cannot have a javascript: url in a button :/")
  }
  }
  
  
  
}