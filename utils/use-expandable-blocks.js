/* eslint-disable func-names */
/* eslint-disable max-classes-per-file */
/**
 * Label options for different input types.
 * @type {{s: string, n: string, b: string}}
 */
const INPUT_TYPES_OPTIONS_LABEL = {
  s: 'ADD_TEXT_PARAMETER',
  n: 'ADD_NUM_PARAMETER',
  b: 'ADD_BOOL_PARAMETER',
};

/**
 * A record of enabled dynamic argument blocks.
 * @type {Object}
 */
const enabledDynamicArgBlocks = {};

let proxyingBlocklyBlocks = false;

/**
 * Retrieves ScratchBlocks from the runtime or window object.
 * @param {Runtime} runtime - The runtime object.
 * @returns {Object} The ScratchBlocks object.
 */
function getScratchBlocks(runtime) {
  // In Gandi, ScratchBlocks can be accessed from the runtime.
  // In TW, ScratchBlocks can be directly accessed from the window.
  return (
    runtime.scratchBlocks ||
    window.ScratchBlocks
  );
}

/**
 * Sets localization messages for Blockly.
 * @param {Blockly} Blockly - The Blockly object.
 */
function setLocales(Blockly) {
  Object.assign(Blockly.ScratchMsgs.locales.en, {
    ADD_TEXT_PARAMETER: 'Add Text Parameter',
    ADD_NUM_PARAMETER: 'Add Num Parameter',
    ADD_BOOL_PARAMETER: 'Add Booln Parameter',
    DELETE_DYNAMIC_PARAMETER: 'Delete Dynamic Parameter',
  });

  Object.assign(Blockly.ScratchMsgs.locales['zh-cn'], {
    ADD_TEXT_PARAMETER: '添加文本参数',
    ADD_NUM_PARAMETER: '添加数字参数',
    ADD_BOOL_PARAMETER: '添加布尔值参数',
    DELETE_DYNAMIC_PARAMETER: '删除动态参数',
  });
}

/**
 * Translates a key using Blockly's translation messages.
 * @param {Blockly} Blockly - The Blockly object.
 * @param {string} key - The key to translate.
 * @returns {string} The translated string.
 */
function translate(Blockly, key) {
  return Blockly.ScratchMsgs.translate(key);
}

/**
 * Creates custom buttons for Blockly blocks.
 * @param {Blockly} Blockly - The Blockly object.
 * @returns {Object} An object containing custom button classes.
 */
function createButtons(Blockly) {
  const minusImage =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA0MCAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIzOSIgaGVpZ2h0PSIzMSIgcng9IjE1LjUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS1vcGFjaXR5PSIwLjIiLz4KPHBhdGggZD0iTTE0LjE2NjUgMTZIMjUuODMzMiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjY2NjY3IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==';
  const plusImage =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA0MCAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIzOSIgaGVpZ2h0PSIzMSIgcng9IjE1LjUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS1vcGFjaXR5PSIwLjIiLz4KPHBhdGggZD0iTTE5Ljk5OTggMTAuMTY0MVYyMS44MzA3TTE0LjE2NjUgMTUuOTk3NEgyNS44MzMyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNjY2NjciIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
  const plusSelectImage =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTQiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA1NCAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSI1MyIgaGVpZ2h0PSIzMSIgcng9IjE1LjUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS1vcGFjaXR5PSIwLjIiLz4KPHBhdGggZD0iTTE3Ljk5OTggMTAuMTY0MVYyMS44MzA3TTEyLjE2NjUgMTUuOTk3NEgyMy44MzMyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNjY2NjciIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMzkuNzYzOCAxOC44Mzg2QzM5LjMyNTQgMTkuMjE4MiAzOC42NzQ2IDE5LjIxODIgMzguMjM2MiAxOC44Mzg2TDM1LjMwMzMgMTYuMjk4NkMzNC40ODY4IDE1LjU5MTQgMzQuOTg2OSAxNC4yNSAzNi4wNjcxIDE0LjI1TDQxLjkzMjkgMTQuMjVDNDMuMDEzMSAxNC4yNSA0My41MTMyIDE1LjU5MTQgNDIuNjk2NyAxNi4yOTg2TDM5Ljc2MzggMTguODM4NloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';

  class FieldButton extends Blockly.FieldImage {
    constructor(src, width = 40, height = 32) {
      super(src, width, height, undefined, false);
      this.initialized = false;
    }

    init() {
      super.init();

      if (!this.initialized) {
        this.getSvgRoot().style.cursor = 'pointer';
        Blockly.bindEventWithChecks_(this.getSvgRoot(), 'mousedown', this, (e) => {
          // Prevent event bubbling, otherwise clicking the button will execute the block (clicking the button).
          e.stopPropagation();
        });
        Blockly.bindEventWithChecks_(this.getSvgRoot(), 'mouseup', this, this.handleClick.bind(this));
      }
      this.initialized = true;
    }

    handleClick(e) {
      if (!this.sourceBlock_ || !this.sourceBlock_.workspace) return;
      if (this.sourceBlock_.workspace.isDragging()) return;
      if (this.sourceBlock_.isInFlyout) return;
      this.onClick(e);
    }

    onClick() {
      // Implemented by subclass
    }
  }
  // (+ ▽) Optional button for adding new types
  class PlusSelectButton extends FieldButton {
    constructor() {
      super(plusSelectImage, 54, 32);
    }

    onClick(e) {
      const menuOptions = this.sourceBlock_.dynamicArgOptionalTypes_.map((i) => ({
        text: translate(Blockly, INPUT_TYPES_OPTIONS_LABEL[i]),
        enabled: true,
        callback: () => {
          this.sourceBlock_.addDynamicArg(i);
        },
      }));
      Blockly.ContextMenu.show(e, menuOptions, false);
    }
  }
  // + button
  class PlusButton extends FieldButton {
    constructor() {
      super(plusImage);
    }

    onClick() {
      this.sourceBlock_.addDynamicArg(this.sourceBlock_.dynamicArgOptionalTypes_[0]);
    }
  }
  // - button
  class MinusButton extends FieldButton {
    constructor() {
      super(minusImage);
    }

    onClick() {
      const { dynamicArgumentIds_ } = this.sourceBlock_;
      this.sourceBlock_.removeDynamicArg(dynamicArgumentIds_.slice(-1));
    }
  }
  return {
    PlusSelectButton,
    PlusButton,
    MinusButton,
  };
}

/**
 * Proxies the Blockly Blocks object to enable dynamic argument blocks.
 * @param {Runtime} runtime - The runtime object.
 */
function proxyBlocklyBlocksObject(runtime) {
  if (proxyingBlocklyBlocks) return;
  proxyingBlocklyBlocks = true;
  const Blockly = getScratchBlocks(runtime);
  // There is no Blockly in the Player.
  if (Blockly) {
    setLocales(Blockly);
    Blockly.Blocks = new Proxy(Blockly.Blocks, {
      set(target, opcode, blockDefinition) {
        if (Object.prototype.hasOwnProperty.call(enabledDynamicArgBlocks, opcode)) {
          initExpandableBlock(runtime, blockDefinition, enabledDynamicArgBlocks[opcode]);
        }
        return Reflect.set(target, opcode, blockDefinition);
      },
    });
  }
}

/**
 * Initializes an expandable block with dynamic arguments.
 * @param {Runtime} runtime - The runtime object.
 * @param {Object} blockDefinition - The block definition.
 * @param {string[]} dynamicArgTypes - The dynamic argument types.
 */
function initExpandableBlock(runtime, blockDefinition, dynamicArgTypes) {
  const Blockly = getScratchBlocks(runtime);
  const { PlusSelectButton, PlusButton, MinusButton } = createButtons(Blockly);

  const orgInit = blockDefinition.init;
  blockDefinition.init = function () {
    orgInit.call(this);

    this.dynamicArgumentIds_ = [];
    this.dynamicArgumentTypes_ = [];
    this.dynamicArgOptionalTypes_ = dynamicArgTypes;
    this.plusButton_ = dynamicArgTypes.length > 1 ? new PlusSelectButton() : new PlusButton();
    this.minusButton_ = new MinusButton();

    this.appendDummyInput('DYNAMIC_ARGS').appendField(this.plusButton_).appendField(this.minusButton_);
  };

  // Supports deleting specified parameters with right-click
  blockDefinition.customContextMenu = function (contextMenu) {
    this.dynamicArgOptionalTypes_.forEach((i) =>
      contextMenu.push({
        text: translate(Blockly, INPUT_TYPES_OPTIONS_LABEL[i]),
        enabled: true,
        callback: () => {
          this.sourceBlock_.addDynamicArg(i);
        },
      })
    );
    this.dynamicArgumentIds_.forEach((id, idx) => {
      const element = document.createElement('div');
      element.innerText = `${ Blockly.ScratchMsgs.translate('DELETE_DYNAMIC_PARAMETER')} ${idx + 1}`;
      const input = this.inputList.find((i) => i.name === id);
      const pathElement = input.connection.targetConnection
        ? input.connection.targetConnection.sourceBlock_.svgPath_
        : input.outlinePath;
      element.addEventListener('mouseenter', () => {
        const replacementGlowFilterId =
          this.workspace.options.replacementGlowFilterId || 'blocklyReplacementGlowFilter';
        pathElement.setAttribute('filter', `url(#${replacementGlowFilterId})`);
      });
      element.addEventListener('mouseleave', () => {
        pathElement.removeAttribute('filter');
      });
      contextMenu.push({
        text: element,
        enabled: true,
        callback: () => {
          pathElement.removeAttribute('filter');
          this.removeDynamicArg(id);
        },
      });
    });
  };

  blockDefinition.attachShadow_ = function (input, argumentType) {
    if (argumentType === 'n' || argumentType === 's') {
      const blockType = argumentType === 'n' ? 'math_number' : 'text';
      Blockly.Events.disable();
      const newBlock = this.workspace.newBlock(blockType);
      try {
        if (argumentType === 'n') {
          newBlock.setFieldValue('1', 'NUM');
        } else {
          newBlock.setFieldValue('', 'TEXT');
        }
        newBlock.setShadow(true);
        if (!this.isInsertionMarker()) {
          newBlock.initSvg();
          newBlock.render(false);
        }
      } finally {
        Blockly.Events.enable();
      }
      if (Blockly.Events.isEnabled()) {
        Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
      }
      newBlock.outputConnection.connect(input.connection);
    }
  };

  blockDefinition.mutationToDom = function () {
    const container = document.createElement('mutation');
    container.setAttribute('dynamicargids', JSON.stringify(this.dynamicArgumentIds_));
    container.setAttribute('dynamicargtypes', JSON.stringify(this.dynamicArgumentTypes_));
    return container;
  };

  blockDefinition.domToMutation = function (xmlElement) {
    this.dynamicArgumentIds_ = JSON.parse(xmlElement.getAttribute('dynamicargids')) || [];
    this.dynamicArgumentTypes_ = JSON.parse(xmlElement.getAttribute('dynamicargtypes')) || [];
    this.updateDisplay_();
  };

  blockDefinition.addDynamicArg = function (type) {
    const oldMutationDom = this.mutationToDom();
    const oldMutation = oldMutationDom && Blockly.Xml.domToText(oldMutationDom);

    Blockly.Events.setGroup(true);

    let index = 0;
    const lastArgName = this.dynamicArgumentIds_.slice(-1)[0];
    if (lastArgName) {
      [index] = lastArgName.match(/\d+/g);
    }

    this.dynamicArgumentIds_.push(`DYNAMIC_ARGS${Number(index) + 1}`);
    this.dynamicArgumentTypes_.push(type);
    this.updateDisplay_();

    const newMutationDom = this.mutationToDom();
    const newMutation = newMutationDom && Blockly.Xml.domToText(newMutationDom);
    if (oldMutation !== newMutation) {
      Blockly.Events.fire(new Blockly.Events.BlockChange(this, 'mutation', null, oldMutation, newMutation));
    }

    Blockly.Events.setGroup(false);
  };

  blockDefinition.removeDynamicArg = function (id) {
    Blockly.Events.setGroup(true);

    const oldMutationDom = this.mutationToDom();
    const oldMutation = oldMutationDom && Blockly.Xml.domToText(oldMutationDom);

    const idx = this.dynamicArgumentIds_.indexOf(id);
    this.dynamicArgumentIds_.splice(idx, 1);
    this.dynamicArgumentTypes_.splice(idx, 1);
    this.removeInput(id);
    this.updateDisplay_();

    const newMutationDom = this.mutationToDom();
    const newMutation = newMutationDom && Blockly.Xml.domToText(newMutationDom);
    if (oldMutation !== newMutation) {
      Blockly.Events.fire(new Blockly.Events.BlockChange(this, 'mutation', null, oldMutation, newMutation));
      setTimeout(() => {
        const target = runtime.getEditingTarget();
        const block = target.blocks._blocks[this.id];
        Object.keys(block.inputs).forEach((name) => {
          if (/^DYNAMIC_ARGS\d+$/.test(name) && !this.dynamicArgumentIds_.includes(name)) {
            target.blocks.deleteBlock(block.inputs[name].shadow, {
              source: 'default',
              targetId: target.id,
            });
            delete block.inputs[name];
            if (runtime.emitTargetBlocksChanged) {
              runtime.emitTargetBlocksChanged(target.id, ['deleteInput', { id: block.id, inputName: name }]);
            }
          }
        });
      }, 0);
    }

    Blockly.Events.setGroup(false);
  };

  blockDefinition.updateDisplay_ = function () {
    const wasRendered = this.rendered;
    this.rendered = false;

    const connectionMap = this.disconnectDynamicArgBlocks_();
    this.removeAllDynamicArgInputs_();

    this.createAllDynamicArgInputs_(connectionMap);
    this.deleteShadows_(connectionMap);

    // Move the + and - buttons to the far right.
    this.moveInputBefore('DYNAMIC_ARGS', null);

    this.rendered = wasRendered;
    if (wasRendered && !this.isInsertionMarker()) {
      this.initSvg();
      this.render();
    }
  };

  blockDefinition.disconnectDynamicArgBlocks_ = function () {
    // Remove old stuff
    const connectionMap = {};
    for (let i = 0; this.inputList[i]; i++) {
      const input = this.inputList[i];
      if (input.connection && /^DYNAMIC_ARGS\d+$/.test(input.name)) {
        const target = input.connection.targetBlock();
        const saveInfo = {
          shadow: input.connection.getShadowDom(),
          block: target,
        };
        connectionMap[input.name] = saveInfo;

        // Remove the shadow DOM, then disconnect the block.  Otherwise a shadow
        // block will respawn instantly, and we'd have to remove it when we remove
        // the input.
        input.connection.setShadowDom(null);
        if (target) {
          input.connection.disconnect();
        }
      }
    }
    return connectionMap;
  };

  blockDefinition.removeAllDynamicArgInputs_ = function () {
    // Delete inputs directly instead of with block.removeInput to avoid splicing
    // out of the input list at every index.
    const inputList = [];
    for (let i = 0; this.inputList[i]; i++) {
      const input = this.inputList[i];
      if (/^DYNAMIC_ARGS\d+$/.test(input.name)) {
        input.dispose();
      } else {
        inputList.push(input);
      }
    }
    this.inputList = inputList;
  };

  blockDefinition.createAllDynamicArgInputs_ = function (connectionMap) {
    // Create arguments and labels as appropriate.
    for (let i = 0; this.dynamicArgumentTypes_[i]; i++) {
      const argumentType = this.dynamicArgumentTypes_[i];
      if (!(argumentType === 'n' || argumentType === 'b' || argumentType === 's')) {
        throw new Error(`Found an dynamic argument with an invalid type: ${argumentType}`);
      }

      const id = this.dynamicArgumentIds_[i];
      const input = this.appendValueInput(id);
      if (argumentType === 'b') {
        input.setCheck('Boolean');
      }
      this.populateArgument_(argumentType, connectionMap, id, input);
    }
  };

  blockDefinition.populateArgument_ = function (type, connectionMap, id, input) {
    let oldBlock = null;
    let oldShadow = null;
    if (connectionMap && id in connectionMap) {
      const saveInfo = connectionMap[id];
      oldBlock = saveInfo.block;
      oldShadow = saveInfo.shadow;
    }

    if (connectionMap && oldBlock) {
      // Reattach the old block and shadow DOM.
      connectionMap[input.name] = null;
      oldBlock.outputConnection.connect(input.connection);
      if (type !== 'b') {
        const shadowDom = oldShadow || this.buildShadowDom_(type);
        input.connection.setShadowDom(shadowDom);
      }
    } else {
      this.attachShadow_(input, type);
    }
  };

  blockDefinition.deleteShadows_ = Blockly.ScratchBlocks.ProcedureUtils.deleteShadows_;

  blockDefinition.buildShadowDom_ = Blockly.ScratchBlocks.ProcedureUtils.buildShadowDom_;
}

/**
 * Initializes expandable blocks for a given extension.
 * @param {Object} extension - The extension object.
 */
function initExpandableBlocks(extension) {
  const { runtime } = extension;
  const { id, blocks: blocksInfo } = extension.getInfo();
  blocksInfo.forEach((i) => {
    if (i.enableDynamicArgs) {
      enabledDynamicArgBlocks[`${id}_${i.opcode}`] = i.dynamicArgTypes || ['s'];
    }
  });
  proxyBlocklyBlocksObject(runtime);
}

export default initExpandableBlocks;
