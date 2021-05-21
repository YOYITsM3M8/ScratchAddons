export default async function ({ addon, global, console, msg }) {
  let workspace, showingConsole;

  const spacer = document.createElement("div");
  spacer.className = "sa-debugger-spacer";
  const buttonGroup = document.createElement("div");
  buttonGroup.className = addon.tab.scratchClass("stage-header_stage-size-toggle-group");
  const buttonContainer = document.createElement("div");
  buttonContainer.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
  const buttonContent = document.createElement("div");
  buttonContent.className = addon.tab.scratchClass("button_content");
  const buttonImage = document.createElement("img");
  buttonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
  buttonImage.draggable = false;
  buttonImage.src = addon.self.dir + "/debug.svg";
  buttonContent.appendChild(buttonImage);
  buttonContainer.appendChild(buttonContent);
  buttonGroup.appendChild(buttonContainer);
  spacer.appendChild(buttonGroup);
  buttonContainer.addEventListener("click", () => toggleConsole(true));

  const vm = addon.tab.traps.vm;
  addon.tab.addBlock("sa-log %s", ["content"], ({ content }, targetId, blockId) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, targetId, blockId, "log");
  });
  addon.tab.addBlock("sa-warn %s", ["content"], ({ content }, targetId, blockId) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, targetId, blockId, "warn");
  });
  addon.tab.addBlock("sa-error %s", ["content"], ({ content }, targetId, blockId) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, targetId, blockId, "error");
  });
  let injected;

  const consoleWrapper = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_card", { others: "debug" }),
  });
  const consoleTitle = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons"),
  });
  const consoleText = Object.assign(document.createElement("h1"), {
    innerText: msg("console"),
  });
  const extraContainer = Object.assign(document.createElement("div"), {
    className: `extra-log-container`,
  });
  const consoleList = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("sprite-info_sprite-info", { others: "logs" }),
  });
  const buttons = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons-right"),
  });

  const exportButton = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_shrink-expand-button"),
    draggable: false,
  });
  const exportImg = Object.assign(document.createElement("img"), {
    src: "/svgs/extensions/download-white.svg",
  });
  const exportText = Object.assign(document.createElement("span"), {
    innerText: msg("export"),
  });

  const trashButton = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_shrink-expand-button"),
    draggable: false,
  });
  const trashImg = Object.assign(document.createElement("img"), {
    src: "/static/assets/a5787bb7364d8131ed49a8f53037d7f4.svg",
  });
  const trashText = Object.assign(document.createElement("span"), {
    innerText: msg("clear"),
  });

  const closeButton = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_remove-button"),
    draggable: false,
  });
  const closeImg = Object.assign(document.createElement("img"), {
    className: addon.tab.scratchClass("close-button_close-icon"),
    src: "/static/assets/cb666b99d3528f91b52f985dfb102afa.svg",
  });
  const closeText = Object.assign(document.createElement("span"), {
    innerText: "Close",
  });

  consoleTitle.append(consoleText, buttons);
  buttons.append(exportButton, trashButton, closeButton);
  trashButton.append(trashImg, trashText);
  closeButton.append(closeImg, closeText);
  exportButton.append(exportImg, exportText);
  extraContainer.append(consoleList);
  consoleWrapper.append(consoleTitle, extraContainer);
  document.body.append(consoleWrapper);
  const goToBlock = (blockId) => {
    const offsetX = 32,
      offsetY = 32;
    const block = workspace.getBlockById(blockId);
    if (!block) return;

    // Copied from devtools. If it's code gets improved for this function, bring those changes here too.
    let root = block.getRootBlock();

    let base = block;
    while (base.getOutputShape() && base.getSurroundParent()) {
      base = base.getSurroundParent();
    }

    let ePos = base.getRelativeToSurfaceXY(), // Align with the top of the block
      rPos = root.getRelativeToSurfaceXY(), // Align with the left of the block 'stack'
      eSiz = block.getHeightWidth(),
      scale = workspace.scale,
      x = rPos.x * scale,
      y = ePos.y * scale,
      xx = block.width + x, // Turns out they have their x & y stored locally, and they are the actual size rather than scaled or including children...
      yy = block.height + y,
      s = workspace.getMetrics();
    if (
      x < s.viewLeft + offsetX - 4 ||
      xx > s.viewLeft + s.viewWidth ||
      y < s.viewTop + offsetY - 4 ||
      yy > s.viewTop + s.viewHeight
    ) {
      let sx = x - s.contentLeft - offsetX,
        sy = y - s.contentTop - offsetY;

      workspace.scrollbar.set(sx, sy);
    }
    // Flashing
    const myFlash = { block: null, timerID: null, colour: null };
    if (myFlash.timerID > 0) {
      clearTimeout(myFlash.timerID);
      myFlash.block.setColour(myFlash.colour);
    }

    let count = 4;
    let flashOn = true;
    myFlash.colour = block.getColour();
    myFlash.block = block;

    function _flash() {
      myFlash.block.svgPath_.style.fill = flashOn ? "#ffff80" : myFlash.colour;
      flashOn = !flashOn;
      count--;
      if (count > 0) {
        myFlash.timerID = setTimeout(_flash, 200);
      } else {
        myFlash.timerID = 0;
      }
    }

    _flash();
  };

  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0,
    maxX,
    maxY;
  consoleTitle.addEventListener("mousedown", dragMouseDown);

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function elementDrag(e) {
    e.preventDefault();
    var winW = document.documentElement.clientWidth || document.body.clientWidth,
      winH = document.documentElement.clientHeight || document.body.clientHeight;
    (maxX = winW - consoleWrapper.offsetWidth - 1), (maxY = winH - consoleWrapper.offsetHeight - 1);
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    if (consoleWrapper.offsetTop - pos2 <= maxY && consoleWrapper.offsetTop - pos2 >= 0) {
      consoleWrapper.style.top = consoleWrapper.offsetTop - pos2 + "px";
    }
    if (consoleWrapper.offsetLeft - pos1 <= maxX && consoleWrapper.offsetLeft - pos1 >= 0) {
      consoleWrapper.style.left = consoleWrapper.offsetLeft - pos1 + "px";
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
  }

  trashButton.addEventListener("click", () => {
    document.querySelectorAll(".log").forEach((log, i) => log.remove());
    closeDragElement();
    logs = [];
  });
  trashButton.addEventListener("mouseup", () => {
    closeDragElement();
  });
  closeButton.addEventListener("click", () => toggleConsole(false));
  closeButton.addEventListener("mouseup", () => closeDragElement());
  let download = (filename, text) => {
    var element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  exportButton.addEventListener("click", () => {
    closeDragElement();
    let file = logs.join("\n");
    download("logs.txt", file);
  });
  let logs = [];
  const addItem = (content, targetId, blockId, type) => {
    workspace = Blockly.getMainWorkspace();
    const wrapper = document.createElement("div");
    const span = (text, cl = "") => {
      let s = document.createElement("span");
      s.innerText = text;
      s.className = cl;
      return s;
    };
    const scrolledDown = wrapper.scrollTop === wrapper.scrollHeight - wrapper.clientHeight;

    const targetName = vm.runtime.targets.find((t) => t.id === targetId).getName();
    wrapper.classList = `log ${addon.tab.scratchClass("sprite-info_sprite-info")}`;
    if (type === "warn") wrapper.classList += " warn";
    if (type === "error") wrapper.classList += " error";
    consoleList.append(wrapper);

    const block = workspace.getBlockById(blockId);
    const inputBlock = block.getChildren().find((b) => b.parentBlock_.id === blockId);
    if (inputBlock.type != "text") {
      if (inputBlock.inputList.filter((i) => i.name).length === 0) {
        const inputSpan = document.createElement("span");
        inputSpan.innerHTML = inputBlock.svgPath_.parentElement.querySelector("text").innerHTML;
        inputSpan.className = "console-variable";
        inputSpan.style.background = getComputedStyle(inputBlock.svgPath_).fill;
        wrapper.append(inputSpan);
      }
    }
    let string = addon.settings
      .get("exportFormat")
      .replace("${sprite}", targetName)
      .replace("${type}", type)
      .replace("${content}", content);
    logs.push(string);
    wrapper.append(span(content));

    let link = document.createElement("a");
    link.innerText = targetName;
    link.className = "logLink";
    link.onclick = () => goToBlock(blockId);

    wrapper.appendChild(link);

    if (scrolledDown) wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
  };
  const toggleConsole = (show = !showingConsole) => {
    if (show) {
      consoleWrapper.style.display = "flex";
    } else {
      consoleWrapper.style.display = "";
    }
    showingConsole = show;
  };

  while (true) {
    const stageHeaderWrapper = await addon.tab.waitForElement('[class*="stage-header_stage-menu-wrapper"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    if (addon.tab.editorMode == "editor") {
      stageHeaderWrapper.insertBefore(spacer, stageHeaderWrapper.lastChild);
    } else {
      toggleConsole(false);
    }
  }
}