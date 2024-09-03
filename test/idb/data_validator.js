// data_validator.js
// import { LitElement, html, css } from 'https://esm.run/lit';
import { LitElement, html, css } from 'lit';

class DataValidator extends LitElement {
  static get properties() { return {
      idbStore: { type: String, attribute: 'idb-store' },
      fieldName: { type: String, attribute: 'field-name' },
      value: { type: String, attribute: 'value' },
      isValid: { type: Boolean },
      validationMessage: { type: String }
    };}

  static styles = css`
    /* 工具提示和图标样式 */
    .tooltip {
      position: relative;
      display: inline-block;
      border-bottom: 1px dotted black; /* 可选样式，使其看起来可点击 */
    }
    .tooltip .tooltiptext {
      visibility: hidden;
      background-color: rgba(0, 0, 0, 0.6); /* 设置背景色和透明度 */
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 5px;
      position: absolute;
      z-index: 1;
      /* 设置最大宽度并允许自动换行 */
      /* max-width: 600px;  控制最大宽度 */
      white-space: normal; /* 允许文本换行 */
      overflow-wrap: break-word; /* 确保长单词也可以在边界处换行 */
      /* 调整为显示在图标下方并向左偏移 */
      /* bottom: -35px;  可能需要根据具体情况调整这个值 */

      margin-left: -200px; /*  向左偏移200px */
    }
    .tooltip:hover .tooltiptext {
      visibility: visible;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadModule();
  }
  async loadModule() {
    const modules = import.meta.glob('./*_store.js');    // 使用模式匹配导入，给与vite打包工具更多的信息
    this.dbModule = await modules[`./${this.idbStore}_store.js`]();
    this.validateInput();
  }

  updated(changedProperties) { if (changedProperties.has('value')) { this.validateInput(); } }  // 当value属性变化时，执行校验

  
  dispatchValidationResult(isValid, message) {
    this.isValid = isValid;
    this.validationMessage = message;
    this.dispatchEvent(new CustomEvent('validation-result', {  // 派发自定义事件，携带验证结果和消息
      detail: { isValid, message },
      bubbles: true,
      composed: true
    }));
  }

  validateInput() {
    if (!this.dbModule || !this.fieldName || this.value === undefined) { return; }
    const schema = this.dbModule.default.schema.pick([this.fieldName]);
    schema.validate({ [this.fieldName]: this.value })
      .then(() => { this.dispatchValidationResult(true, 'Validation OK'); })
      .catch((err) => { this.dispatchValidationResult(false, err.message); });
      // .finally(() => { this.requestUpdate(); });  //手动更新组件
  }
  

  render() {
    const icon = this.isValid ? html`<span style="color: green;">✔</span>` : html`<span class="tooltip" style="color: red;">❗<span class="tooltiptext">${this.validationMessage}</span></span>`;
    return html`${icon}`;
  }
}

customElements.define('data-validator', DataValidator);
