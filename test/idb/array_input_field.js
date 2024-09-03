// text_input_field.js
// import { LitElement, html, css } from 'https://esm.run/lit';
import { LitElement, html, css } from 'lit';
import './auto_complete_dropdown.js';
import './data_validator.js';

class ArrayInputField extends LitElement {
  static get properties() { return {
    fieldName: { type: String, attribute: 'field-name' },
    idbStore: { type: String, attribute: 'idb-store' },
    placeholder: { type: String, attribute: 'placeholder' },
    labelWidth: { type: Number, attribute: 'label-width' },
    queryLimit: { type: Number, attribute: 'query-limit' },
    value: { type: String }
  };}

  constructor() {
    super();
    this.placeholder = 'Type something...';
    this.labelWidth = 55;
    this.queryLimit = 5;
    this.value = '';
    this.timeout = null;
  }

  firstUpdated() {
    this.mainInput = this.shadowRoot.getElementById('main-input');
    this.dropdown = this.shadowRoot.getElementById('dropdown');
  }
  
  handleValidationResult(e) { this.mainInput.style.border = e.detail.isValid ? '' : '1px solid red'; }
  disconnectedCallback() { super.disconnectedCallback(); }  // 移除事件监听器，如果您在firstUpdated中添加了监听器...
  handleBlur() { this.value = this.mainInput.value; }

  

  render() {
    return html`
      <div style="flex-grow: 1; display: flex; flex-wrap: wrap; align-items: flex-start; /* 调整为 flex-start 以确保 label 在顶部对齐 */ padding: 5px;">
        <label class="label" style="display: inline-block; width: ${this.labelWidth}px; text-align: right; margin-right: 8px;">${this.fieldName}:</label>
        <div style="display: block;">
          <input type="text" id="main-input" class="main-input" placeholder="${this.placeholder}" @input="${() => this.handleInput()}" @blur="${() => this.handleBlur()}"/>
          <auto-complete-dropdown id="dropdown" field-name="${this.fieldName}" idb-store="${this.idbStore}" query-limit=${this.queryLimit} @item-selected="${this.handleItemSelected}"></auto-complete-dropdown>
        </div>
        ${this.value ? html`<data-validator idb-store="${this.idbStore}" field-name="${this.fieldName}" .value="${this.value}" @validation-result="${this.handleValidationResult}"></data-validator>` :'' }
      </div>
    `;
  }

  handleInput() {
    const lastCommaIndex = this.mainInput.value.lastIndexOf(','); // 获取this.mainInput值中最后一个逗号后的内容
    const lastPart = lastCommaIndex !== -1 ? this.mainInput.value.substring(lastCommaIndex + 1).trim() : this.mainInput.value.trim();
    this.dropdown.initialQuery = lastPart; // 设置下拉菜单的初始查询值
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => { this.value = this.mainInput.value; }, 2000); // 3秒无输入后自动校验
  }

  handleItemSelected(e) {
    const currentValue = this.mainInput.value;
    const lastCommaIndex = currentValue.lastIndexOf(',');
    this.mainInput.value = lastCommaIndex !== -1 ? `${currentValue.substring(0, lastCommaIndex + 1)} ${e.detail}` : e.detail;
  }

}

customElements.define('array-input-field', ArrayInputField);

