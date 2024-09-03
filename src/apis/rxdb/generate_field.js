// auto_generate_field.js
import { LitElement, html, css } from 'https://esm.run/lit';

class AutoGenerateField extends LitElement {
  static get properties() { return {
    fieldName: { type: String, attribute: 'field-name' },
    labelWidth: { type: Number, attribute: 'label-width'},
    value: { type: String, attribute: 'value' },
  };}




  constructor() {
    super();
    this.fieldName = '';
    this.value = 'zxczxc';
    this.labelWidth = 55;
  }

  connectedCallback() {
    super.connectedCallback();
    this.generateValue();
  }

  generateValue() {
    switch (this.fieldName) {
      case 'id':
        this.value = this.generateId();
        break;
      case 'cid':
        this.value = this.generateCid();
        break;
      case 'cidActor':
        this.value = this.generateCidActor();
        break;
      // 可以添加更多字段名和生成逻辑
      default:
        this.value = 'Unknown Field';
    }
  }

  generateId() {
    // 使用 slice 替代弃用的 substr
    return 'id-' + Math.random().toString(36); // 从第 2 位开始，截取到第 11 位
  }
  
  generateCid() {
    // 使用 slice 替代弃用的 substr
    return 'cid-' + Math.random().toString(36).slice(2, 11); // 从第 2 位开始，截取到第 11 位
  }
  
  generateCidActor() {
    // 使用 slice 替代弃用的 substr
    return 'actor-' + Math.random().toString(36).slice(2, 11); // 从第 2 位开始，截取到第 11 位
  }
  



  render() {
    // 渲染隐藏的输入框，仅用于保存自动生成的值
    return html`
      <label class="label" style="display: inline-block; width: ${this.labelWidth}px; text-align: right; margin-right: 8px;">${this.fieldName}:</label>
      <input type="text" style="border: none; background: transparent; color: inherit; " .value="${this.value}" readonly name="${this.fieldName}">
    `;
  }


}

customElements.define('auto-generate-field', AutoGenerateField);
